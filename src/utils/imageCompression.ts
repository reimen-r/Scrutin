const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export function base64Size(base64: string): number {
  return Math.round((base64.length * 3) / 4);
}

export function shouldCompress(base64: string): boolean {
  return base64Size(base64) > MAX_IMAGE_SIZE;
}

export function estimateSize(base64: string): string {
  const sizeInBytes = base64Size(base64);
  if (sizeInBytes > 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(sizeInBytes / 1024).toFixed(0)} KB`;
}

export function validateFile(base64: string, mimeType: string): { valid: boolean; error: string } {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { valid: false, error: 'Formato no soportado. Solo JPEG, PNG, WebP y PDF.' };
  }
  const size = base64Size(base64);
  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: `El archivo (${estimateSize(base64)}) supera el límite de 20 MB.` };
  }
  return { valid: true, error: '' };
}
