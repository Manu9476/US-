import { ImagePlus, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { readImageAsDataUrl } from '../lib/imageFiles'

export function ImageUploadField({ label, value, onChange, onUploadFile }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const handleFiles = async (files) => {
    const [file] = files || []
    if (!file || !file.type.startsWith('image/')) return

    try {
      setError('')
      setIsUploading(true)
      const nextValue = onUploadFile ? await onUploadFile(file) : await readImageAsDataUrl(file)
      onChange(nextValue)
    } catch (uploadError) {
      setError(uploadError.message || 'Image upload failed.')
    } finally {
      setIsUploading(false)
    }
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
          <button
            type="button"
            className="secondary-button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" /> {isUploading ? 'Uploading...' : 'Choose'}
          </button>
          {value && (
            <button type="button" className="secondary-button" onClick={() => onChange('')}>
              Remove
            </button>
          )}
        </div>
        {error ? <p className="field-error">{error}</p> : null}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={async (event) => {
            await handleFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

