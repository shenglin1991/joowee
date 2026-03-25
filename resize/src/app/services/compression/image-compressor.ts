import type { ResizeMode } from '../../models/resize-mode';
import { compressJpegBlobToTargetBytes } from './jpeg-compressor';

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

  return compressJpegBlobToTargetBytes(file, targetBytes);
}

