export const readImageAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export const createSafeImagePath = (userId, file) => {
  const rawExtension = file.name.split('.').pop() || 'jpg'
  const extension = rawExtension.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const randomId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `${userId}/${randomId}.${extension}`
}
