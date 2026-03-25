import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import type { ResizeMode } from '../../models/resize-mode';
import { compressJpegBlobToTargetBytes } from './jpeg-compressor';

async function renderPdfToPageJpegs(
  file: File,
  renderScale: number,
  jpegQuality: number
): Promise<Blob[]> {
  const arrayBuffer = await file.arrayBuffer();

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', document.baseURI).toString();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageJpegBlobs: Blob[] = [];

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex++) {
    const page = await pdf.getPage(pageIndex);
    const viewport = page.getViewport({ scale: renderScale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Impossible de créer le contexte canvas pour le PDF.');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await (page as any).render({ canvasContext: context, viewport } as any).promise;

    const jpegBlob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) {
            reject(new Error("Échec de la génération du JPEG de la page PDF."));
            return;
          }
          resolve(b);
        },
        'image/jpeg',
        jpegQuality
      );
    });

    pageJpegBlobs.push(jpegBlob);
  }

  return pageJpegBlobs;
}

async function buildPdfBytesFromPageJpegs(pageJpegBlobs: Blob[]): Promise<Uint8Array> {
  const outPdf = await PDFDocument.create();

  for (let i = 0; i < pageJpegBlobs.length; i++) {
    const embedded = await outPdf.embedJpg(new Uint8Array(await pageJpegBlobs[i].arrayBuffer()));
    const pdfPage = outPdf.addPage([embedded.width, embedded.height]);
    pdfPage.drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width,
      height: embedded.height,
    });
  }

  const pdfBytes = await outPdf.save();
  return new Uint8Array(pdfBytes);
}

async function buildPdfBytesFromPageTargets(
  pageJpegBlobs: Blob[],
  targetJpegBytesByPage: number[],
  jpegStrictUnder: boolean
): Promise<Uint8Array> {
  const outPdf = await PDFDocument.create();

  for (let i = 0; i < pageJpegBlobs.length; i++) {
    const compressedPage = await compressJpegBlobToTargetBytes(
      pageJpegBlobs[i],
      targetJpegBytesByPage[i],
      { strictUnder: jpegStrictUnder }
    );

    const embedded = await outPdf.embedJpg(new Uint8Array(await compressedPage.arrayBuffer()));
    const pdfPage = outPdf.addPage([embedded.width, embedded.height]);
    pdfPage.drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width,
      height: embedded.height,
    });
  }

  const pdfBytes = await outPdf.save();
  return new Uint8Array(pdfBytes);
}

export async function compressPdfLocally(
  file: File,
  mode: ResizeMode,
  maxSizeKb: number | null,
  percent: number | null
): Promise<Blob> {
  const originalPdfSize = file.size ?? 0;

  let targetGlobalBytes: number | null = null;
  if (mode === 'percent' && percent) {
    targetGlobalBytes = Math.floor((originalPdfSize * percent) / 100);
  } else if (mode === 'max' && maxSizeKb) {
    targetGlobalBytes = Math.floor(maxSizeKb * 1024);
  }

  if (!targetGlobalBytes || targetGlobalBytes >= originalPdfSize) {
    return file;
  }

  // Pour éviter le "trop petit", on rend d'abord le PDF à une résolution suffisamment haute.
  const jpegMaxQuality = 0.98;
  let renderScale = 1;
  const maxRenderScale = 4;
  const scaleAttempts = 5;

  let pageJpegBlobs = await renderPdfToPageJpegs(file, renderScale, jpegMaxQuality);
  if (pageJpegBlobs.length === 0) return file;

  let maxPdfBytes = await buildPdfBytesFromPageJpegs(pageJpegBlobs);
  const nearMaxFactor = 0.98;

  for (let attempt = 0; attempt < scaleAttempts; attempt++) {
    if (maxPdfBytes.length >= targetGlobalBytes * nearMaxFactor) break;
    if (renderScale >= maxRenderScale) break;

    renderScale = Math.min(maxRenderScale, renderScale * 1.6);
    pageJpegBlobs = await renderPdfToPageJpegs(file, renderScale, jpegMaxQuality);
    maxPdfBytes = await buildPdfBytesFromPageJpegs(pageJpegBlobs);
  }

  const pageBytes = pageJpegBlobs.map((b) => b.size);
  const totalPageBytes = pageBytes.reduce((a, b) => a + b, 0);
  if (!totalPageBytes) return file;

  // Si même à alpha=1 on ne peut pas atteindre la cible, renvoyer le plus gros possible.
  if (maxPdfBytes.length <= targetGlobalBytes) {
    return new Blob([maxPdfBytes as unknown as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  }

  // Facteur alpha identique pour toutes les pages.
  let lowAlpha = 0;
  let highAlpha = 1;

  let bestPdfBytes: Uint8Array | null = null;
  let bestDelta = Number.POSITIVE_INFINITY;

  const toleranceBytes = Math.max(20 * 1024, Math.floor(targetGlobalBytes * 0.01));
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const alpha = (lowAlpha + highAlpha) / 2;

    const targetJpegBytesByPage = pageBytes.map((pageOriginalJpegBytes) => {
      return Math.max(200, Math.floor(pageOriginalJpegBytes * alpha));
    });

    const outPdfBytes = await buildPdfBytesFromPageTargets(pageJpegBlobs, targetJpegBytesByPage, false);
    const outPdfSize = outPdfBytes.length;

    const delta = outPdfSize - targetGlobalBytes;
    const absDelta = Math.abs(delta);

    if (absDelta < bestDelta) {
      bestDelta = absDelta;
      bestPdfBytes = outPdfBytes;
    }

    if (absDelta <= toleranceBytes) {
      return new Blob([outPdfBytes as unknown as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
    }

    if (outPdfSize > targetGlobalBytes) {
      highAlpha = alpha;
    } else {
      lowAlpha = alpha;
    }
  }

  if (!bestPdfBytes) return file;
  return new Blob([bestPdfBytes as unknown as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
}

