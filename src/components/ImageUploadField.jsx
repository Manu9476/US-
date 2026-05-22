import { ImagePlus, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export function ImageUploadField({ label, value, onChange }) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = async (files) => {
    const [file] = files || []
    if (!file || !file.type.startsWith('image/')) return
    const dataUrl = await readAsDataUrl(file)
    onChange(dataUrl)
  }

  return (
    <div className="space-y-2">
      <span className="body-secondary text-sm">{label}</span>
      <div
        className={`upload-field ${isDragging ? 'upload-field-dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={async (event) => {
          event.preventDefault()
          setIsDragging(false)
          await handleFiles(event.dataTransfer.files)
        }}
      >
        {value ? (
          <img src={value} alt="Preview" className="upload-preview" />
        ) : (
          <div className="text-center">
            <ImagePlus className="mx-auto h-5 w-5 accent-text" />
            <p className="body-secondary mt-2 text-sm">Drop an image or upload one</p>
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <button type="button" className="secondary-button" onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Choose
          </button>
          {value && (
            <button type="button" className="secondary-button" onClick={() => onChange('')}>
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={async (event) => handleFiles(event.target.files)}
        />
      </div>
    </div>
  )
}

