const MAX_DIMENSION = 1600
const WEBP_QUALITY = 0.82
// Files already below this size are uploaded as-is — re-encoding tiny files mostly wastes quality.
const OPTIMIZE_THRESHOLD_BYTES = 200 * 1024

/**
 * Downscales and re-encodes an image in the browser before upload.
 * Returns the original file when optimization is unsupported, fails,
 * or would not make the file smaller.
 */
export async function optimizeImageFile(file: File): Promise<File> {
  if (typeof window === 'undefined') return file
  if (!file.type.startsWith('image/')) return file
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))

    if (scale === 1 && file.size <= OPTIMIZE_THRESHOLD_BYTES) {
      bitmap.close()
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))

    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      return file
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
    )

    if (!blob || blob.size === 0 || blob.size >= file.size) {
      return file
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
  } catch {
    return file
  }
}

export function optimizeImageFiles(files: File[]) {
  return Promise.all(files.map(optimizeImageFile))
}
