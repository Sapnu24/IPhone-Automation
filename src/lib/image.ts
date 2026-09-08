// Downscale a captured photo before storing it, so receipts don't bloat the
// on-device database. Falls back to the original blob if anything fails.
export async function resizeImage(
  blob: Blob,
  maxDim = 1400,
  quality = 0.6,
): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(blob)
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return blob
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const out: Blob | null = await new Promise((res) =>
      canvas.toBlob((b) => res(b), 'image/jpeg', quality),
    )
    return out ?? blob
  } catch {
    return blob
  }
}
