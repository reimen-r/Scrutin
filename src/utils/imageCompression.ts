const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export function shouldCompress(base64: string): boolean {
  const sizeInBytes = (base64.length * 3) / 4;
  return sizeInBytes > MAX_IMAGE_SIZE;
}

export function estimateSize(base64: string): string {
  const sizeInBytes = (base64.length * 3) / 4;
  if (sizeInBytes > 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(sizeInBytes / 1024).toFixed(0)} KB`;
}
