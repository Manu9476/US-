import { useDeferredValue, useState } from 'react'
import { CalendarDays, Filter, ImagePlus, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { MEMORY_MOODS } from '../data/constants'
import { createId, formatDate, sortByDateDesc } from '../lib/utils'
import { RichTextEditor } from '../components/RichTextEditor'
import { ImageUploadField } from '../components/ImageUploadField'

function MemoryCard({ memory, index }) {
  const [imageFailed, setImageFailed] = useState(false)
  const mood = MEMORY_MOODS.find((item) => item.value === memory.mood)

  return (
    <motion.article
      className="memory-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.18), duration: 0.25 }}
    >
      {memory.photoUrl && !imageFailed ? (
        <img
          alt={memory.title}
          className="memory-image"
          loading="lazy"
          src={memory.photoUrl}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="memory-placeholder">
          <ImagePlus className="h-5 w-5" />
        </div>
      )}

      <div className="memory-content">
        <div className="memory-meta-row">
          <span className="status-pill">{mood?.emoji} {mood?.label ?? 'Memory'}</span>
          <span className="body-muted">{formatDate(memory.date)}</span>
        </div>
        <h3>{memory.title}</h3>
        <div
          className="rich-content body-secondary"
          dangerouslySetInnerHTML={{ __html: memory.note }}
        />
      </div>
    </motion.article>
  )
}

export function MemoriesSection({ id, memories, onAddMemory, partners }) {
  const [form, setForm] = useState({
    title: '',
    date: '',
    mood: 'giddy',
    note: '',
    photoUrl: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMood, setSelectedMood] = useState('all')
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const sortedMemories = sortByDateDesc(memories, (memory) => memory.date || memory.createdAt)
  const filteredMemories = sortedMemories.filter((memory) => {
    const matchesMood = selectedMood === 'all' || memory.mood === selectedMood
    const plainNote = memory.note.replace(/<[^>]+>/g, '')
    const searchSource = `${memory.title} ${plainNote}`.toLowerCase()
    const matchesSearch = searchSource.includes(deferredSearchTerm.toLowerCase())

    return matchesMood && matchesSearch
  })

  const memoryMoodOptions = MEMORY_MOODS.filter((item) => item.value !== 'all')

  const handleChange = (field) => (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedTitle = form.title.trim()
    const trimmedNote = form.note.replace(/<[^>]+>/g, '').trim()

    if (!trimmedTitle || !form.date || !trimmedNote) {
      return
    }

    onAddMemory({
      id: createId('memory'),
      title: trimmedTitle,
      date: form.date,
      mood: form.mood,
      note: form.note.trim(),
      photoUrl: form.photoUrl.trim(),
      createdAt: new Date().toISOString(),
    })

    setForm({
      title: '',
      date: '',
      mood: 'giddy',
      note: '',
      photoUrl: '',
    })
  }

  return (
    <motion.section
      id={id}
      className="app-page story-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="page-header">
        <p className="eyebrow">Story</p>
        <h1>Journal</h1>
        <p className="page-summary">
          Entries for {partners.partnerOne} and {partners.partnerTwo}, organized by date and mood.
        </p>
      </div>

      <div className="workspace-grid">
        <form className="tool-panel" onSubmit={handleSubmit}>
          <div className="panel-head">
            <div>
              <p className="eyebrow">New entry</p>
              <h2>Add memory</h2>
            </div>
            <CalendarDays className="h-5 w-5 accent-text" />
          </div>

          <div className="field-grid">
            <label>
              <span>Title</span>
              <input
                required
                className="input-field"
                placeholder="Sunset after dinner"
                value={form.title}
                onChange={handleChange('title')}
              />
            </label>

            <label>
              <span>Date</span>
              <input
                required
                type="date"
                className="input-field"
                value={form.date}
                onChange={handleChange('date')}
              />
            </label>

            <div className="field-block">
              <span>Mood</span>
              <div className="filter-row">
                {memoryMoodOptions.map((mood) => (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        mood: mood.value,
                      }))
                    }
                    className={`tag-pill ${form.mood === mood.value ? 'tag-pill-active' : ''}`}
                  >
                    <span>{mood.emoji}</span>
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <RichTextEditor
            label="Note"
            value={form.note}
            placeholder="What happened?"
            onChange={(value) => setForm((currentForm) => ({ ...currentForm, note: value }))}
          />

          <ImageUploadField
            label="Photo"
            value={form.photoUrl}
            onChange={(value) => setForm((currentForm) => ({ ...currentForm, photoUrl: value }))}
          />

          <button type="submit" className="primary-button">
            <ImagePlus className="h-4 w-4" />
            Save memory
          </button>
        </form>

        <div className="list-panel">
          <div className="memory-toolbar">
            <label className="search-box">
              <Search className="h-4 w-4" />
              <input
                placeholder="Search memories"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <span className="status-pill">{filteredMemories.length} shown</span>
          </div>

          <div className="filter-row">
            {MEMORY_MOODS.map((mood) => (
              <button
                key={mood.value}
                type="button"
                onClick={() => setSelectedMood(mood.value)}
                className={`tag-pill ${selectedMood === mood.value ? 'tag-pill-active' : ''}`}
              >
                <Filter className="h-3.5 w-3.5" />
                <span>{mood.emoji}</span>
                {mood.label}
              </button>
            ))}
          </div>

          {filteredMemories.length ? (
            <div className="memory-grid">
              {filteredMemories.map((memory, index) => (
                <MemoryCard key={memory.id} index={index} memory={memory} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-title">No memories yet</p>
              <p className="body-muted">Add an entry or adjust the current filter.</p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}
