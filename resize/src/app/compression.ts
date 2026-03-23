import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

export type ResizeMode = 'max' | 'percent';

export async function compressImageLocally(
  file: File,
  mode: ResizeMode,
  maxSizeKb: number | null,
  percent: number | null
): Promise<Blob> {
  const originalSize = file.size;

  let targetBytes: number | null = null;
  if (mode === 'percent' && percent) {
    targetBytes = Math.floor((originalSize * percent) / 100);
  } else if (mode === 'max' && maxSizeKb) {
    targetBytes = maxSizeKb * 1024;
  }

  if (!targetBytes || targetBytes >= originalSize) {
    return file;
  }

  const image = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Impossible de créer le contexte canvas.');
  }

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const mimeType = 'image/jpeg';

  const toBlob = (quality: number): Promise<Blob> =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Échec de la génération de l’image compressée."));
            return;
          }
          resolve(blob);
        },
        mimeType,
        quality
      );
    });

  let low = 0.1;
  let high = Math.min(0.95, targetBytes / originalSize);
  let bestBlob: Blob | null = null;

  if (high <= low) {
    high = low;
  }

  for (let i = 0; i < 6; i++) {
    const quality = (low + high) / 2;
    const blob = await toBlob(quality);

    if (blob.size > targetBytes) {
      high = quality;
    } else {
      bestBlob = blob;
      low = quality;
    }
  }

  return bestBlob ?? (await toBlob(low));
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

  // Sans cible exploitable, on renvoie le PDF original.
  if (!targetGlobalBytes || targetGlobalBytes >= originalPdfSize) {
    return file;
  }

  const arrayBuffer = await file.arrayBuffer();

  // PDF.js a besoin d’un worker source (pour éviter les erreurs de chargement).
  // Le worker est copié dans `resize/public/pdf.worker.min.mjs`.
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', document.baseURI).toString();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const scale = mode === 'percent' && percent ? Math.sqrt(percent / 100) : 1;

  const pageJpegBlobs: Blob[] = [];

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex++) {
    const page = await pdf.getPage(pageIndex);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Impossible de créer le contexte canvas pour le PDF.');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await (page as any).render({ canvasContext: context, viewport } as any).promise;

    // Rendu haute qualité, puis compression par pages ensuite.
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
        0.95
      );
    });

    pageJpegBlobs.push(jpegBlob);
  }

  if (pageJpegBlobs.length === 0) {
    return file;
  }

  const pageBytes = pageJpegBlobs.map((b) => b.size);
  const totalPageBytes = pageBytes.reduce((a, b) => a + b, 0);
  if (!totalPageBytes) {
    return file;
  }

  const outPdf = await PDFDocument.create();

  let usedBytes = 0;
  for (let i = 0; i < pageJpegBlobs.length; i++) {
    const isLast = i === pageJpegBlobs.length - 1;
    const rawTargetBytes = isLast
      ? Math.max(0, targetGlobalBytes - usedBytes)
      : Math.floor((targetGlobalBytes * pageBytes[i]) / totalPageBytes);

    const targetBytes = Math.max(500, rawTargetBytes);
    usedBytes += targetBytes;

    const targetMaxSizeKb = Math.max(1, Math.floor(targetBytes / 1024));

    const pageFile = new File([pageJpegBlobs[i]], `page-${i + 1}.jpg`, {
      type: 'image/jpeg',
    });

    // Même logique que pour une image utilisateur.
    const compressedPage = await compressImageLocally(pageFile, 'max', targetMaxSizeKb, null);
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
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

