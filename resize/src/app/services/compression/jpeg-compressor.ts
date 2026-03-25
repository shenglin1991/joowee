async function loadImageFromFile(file: Blob): Promise<HTMLImageElement> {
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

export async function compressJpegBlobToTargetBytes(
  source: Blob,
  targetBytes: number,
  opts?: { strictUnder?: boolean }
): Promise<Blob> {
  const image = await loadImageFromFile(source);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Impossible de créer le contexte canvas.');
  }

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

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
        'image/jpeg',
        quality
      );
    });

  let low = 0.02;
  let high = 1.0;
  let bestUnder: Blob | null = null;
  let bestOver: Blob | null = null;

  for (let i = 0; i < 8; i++) {
    const quality = (low + high) / 2;
    const blob = await toBlob(quality);

    if (blob.size <= targetBytes) {
      bestUnder = blob;
      low = quality;
    } else {
      bestOver = blob;
      high = quality;
    }
  }

  if (bestUnder && bestOver) {
    if (opts?.strictUnder) return bestUnder;

    const underDelta = targetBytes - bestUnder.size;
    const overDelta = bestOver.size - targetBytes;
    return underDelta <= overDelta ? bestUnder : bestOver;
  }

  if (bestUnder) return bestUnder;
  if (bestOver) return bestOver;

  return toBlob(0.8);
}

