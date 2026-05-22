import { Bold, Italic, RemoveFormatting } from 'lucide-react'
import { useEffect, useRef } from 'react'

const sanitizeHtml = (html) =>
  html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/ on\w+="[^"]*"/g, '')
    .trim()

export function RichTextEditor({ label, value, onChange, placeholder }) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (!editorRef.current) {
      return
    }

    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const applyCommand = (command) => {
    document.execCommand(command, false)
    editorRef.current?.focus()
    onChange(sanitizeHtml(editorRef.current?.innerHTML ?? ''))
  }

  return (
    <div className="space-y-2">
      <span className="body-secondary text-sm">{label}</span>
      <div className="surface-panel-soft p-3">
        <div className="mb-2 flex gap-2">
          <button type="button" className="secondary-button !h-9 !w-9 !p-0" onClick={() => applyCommand('bold')}>
            <Bold className="h-4 w-4" />
          </button>
          <button type="button" className="secondary-button !h-9 !w-9 !p-0" onClick={() => applyCommand('italic')}>
            <Italic className="h-4 w-4" />
          </button>
          <button type="button" className="secondary-button !h-9 !w-9 !p-0" onClick={() => applyCommand('removeFormat')}>
            <RemoveFormatting className="h-4 w-4" />
          </button>
        </div>
        <div
          ref={editorRef}
          className="rich-editor"
          contentEditable
          data-placeholder={placeholder}
          onInput={(event) => onChange(sanitizeHtml(event.currentTarget.innerHTML))}
        />
      </div>
    </div>
  )
}

