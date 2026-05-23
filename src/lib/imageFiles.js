export const readImageAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export const createImageThumbnail = async (file, maxSize = 420, quality = 0.72) => {
  const imageUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = imageUrl
    })

    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
      return readImageAsDataUrl(file)
    }

    context.drawImage(image, 0, 0, width, height)

    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

export const createImageThumbnailFromUrl = async (sourceUrl, maxSize = 420, quality = 0.72) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = sourceUrl
  })

  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    return sourceUrl
  }

  context.drawImage(image, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', quality)
}

export const createSafeImagePath = (userId, file) => {
  const rawExtension = file.name.split('.').pop() || 'jpg'
  const extension = rawExtension.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const randomId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `${userId}/${randomId}.${extension}`
}
