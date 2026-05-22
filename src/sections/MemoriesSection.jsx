import { useDeferredValue, useState } from 'react'
import confetti from 'canvas-confetti'
import {
  CalendarDays,
  FileText,
  Filter,
  Heart,
  ImagePlus,
  Lock,
  Search,
  Sparkles,
  Tag,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { MEMORY_MOODS } from '../data/constants'
import { createId, formatDate, sortByDateDesc } from '../lib/utils'
import { RichTextEditor } from '../components/RichTextEditor'
import { ImageUploadField } from '../components/ImageUploadField'

function VaultFeature({ icon: Icon, title, caption }) {
  return (
    <div className="story-vault-feature">
      <div className="story-vault-feature-icon">
        <Icon className="h-6 w-6" />
      </div>
      <p className="story-vault-feature-title">{title}</p>
      <span className="story-vault-feature-check" />
      <p className="story-vault-feature-caption">{caption}</p>
    </div>
  )
}

function VaultStep({ icon: Icon, title, copy }) {
  return (
    <div className="story-vault-step">
      <div className="story-vault-step-icon">
        <Icon className="h-8 w-8" />
      </div>
      <p className="story-vault-step-title">{title}</p>
      <p className="story-vault-step-copy">{copy}</p>
    </div>
  )
}

function MemoryCard({ memory, index }) {
  const [flipped, setFlipped] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const mood = MEMORY_MOODS.find((item) => item.value === memory.mood)

  return (
    <motion.article
      className="story-memory-card h-full"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.25), duration: 0.3 }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <button
        type="button"
        onClick={() => setFlipped((currentValue) => !currentValue)}
        className="h-full w-full text-left"
      >
        <motion.div
          className="memory-rotor relative min-h-[356px] w-full"
          animate={{ rotateY: flipped ? 180 : 0, y: flipped ? -4 : 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="memory-face story-memory-panel absolute inset-0 flex h-full flex-col">
            <div className="story-memory-media">
              {memory.photoUrl && !imageFailed ? (
                <img
                  alt={memory.title}
                  className="h-52 w-full rounded-[16px] object-cover"
                  loading="lazy"
                  src={memory.photoUrl}
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="story-memory-fallback">
                  <ImagePlus className="h-10 w-10" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col px-1 pb-1 pt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="story-vault-meta">{formatDate(memory.date)}</p>
                <span className="story-vault-mood-mini">
                  {mood?.emoji ?? '\u2728'}
                </span>
              </div>
              <h3 className="mt-3">{memory.title}</h3>
              <p className="story-memory-hint mt-3">
                Tap or hover to flip this memory and read the note on the back.
              </p>
            </div>
          </div>

          <div className="memory-face memory-back story-memory-panel absolute inset-0 flex h-full flex-col">
            <div className="flex items-center justify-between gap-3">
              <span className="story-vault-badge">Stored note</span>
              <span className="story-vault-badge story-vault-badge-soft">
                {mood?.emoji ?? '\u{1F496}'} {mood?.label ?? 'Sweet'}
              </span>
            </div>

            <div className="story-memory-note mt-5 flex-1">
              <p className="story-vault-meta">{formatDate(memory.date)}</p>
              <div
                className="rich-content story-memory-copy mt-4"
                dangerouslySetInnerHTML={{ __html: memory.note }}
              />
            </div>

            <p className="story-memory-hint mt-5">
              A small moment worth keeping close.
            </p>
          </div>
        </motion.div>
      </button>
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

  const activeMood = MEMORY_MOODS.find((mood) => mood.value === selectedMood)
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

    confetti({
      particleCount: 90,
      spread: 78,
      startVelocity: 28,
      scalar: 0.85,
      colors: ['#ff6a38', '#ab8dff', '#ff915f', '#f5eee7'],
      origin: { y: 0.68 },
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
      className="story-vault space-y-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="story-vault-hero">
        <div className="story-vault-hero-copy">
          <p className="story-vault-kicker">Shared Journal System</p>
          <h2 className="story-vault-title">
            Your Shared Journal:
            <span> More Than Just Photos</span>
          </h2>
          <p className="story-vault-subtitle">
            Store dates, moods, photos, and rich notes securely for {partners.partnerOne} and {partners.partnerTwo}.
          </p>

          <div className="story-vault-stats">
            <div className="story-vault-stat">
              <span>Memories saved</span>
              <strong>{memories.length}</strong>
            </div>
            <div className="story-vault-stat">
              <span>Filter</span>
              <strong>{activeMood?.label ?? 'All'}</strong>
            </div>
            <div className="story-vault-stat">
              <span>Search</span>
              <strong>{deferredSearchTerm ? 'Active' : 'Ready'}</strong>
            </div>
          </div>
        </div>

        <div className="story-vault-hero-aside">
          <div className="story-vault-lock-card">
            <Heart className="h-14 w-14" />
          </div>
          <div className="story-vault-orange-pill">Private on this device</div>
        </div>
      </div>

      <div className="story-vault-overview">
        <div className="story-vault-block">
          <div className="story-vault-block-head">
            <h3>What You Can Save</h3>
            <span className="story-vault-orange-pill story-vault-orange-pill-small">
              Searchable memory fields
            </span>
          </div>

          <div className="story-vault-feature-grid">
            <VaultFeature
              icon={ImagePlus}
              title="Photos & Screens"
              caption="Upload an image or keep a text-only memory."
            />
            <VaultFeature
              icon={CalendarDays}
              title="Dates"
              caption="Anchor every memory to a real day."
            />
            <VaultFeature
              icon={FileText}
              title="Rich Notes"
              caption="Write longer context with light formatting."
            />
            <VaultFeature
              icon={Tag}
              title="Moods"
              caption="Tag the feeling and filter later."
            />
            <VaultFeature
              icon={Search}
              title="Fast Search"
              caption="Search titles and note text instantly."
            />
            <VaultFeature
              icon={Lock}
              title="Private Storage"
              caption="Everything stays local to this device."
            />
          </div>
        </div>

        <div className="story-vault-block">
          <div className="story-vault-block-head">
            <h3>How It Works</h3>
          </div>

          <div className="story-vault-step-grid">
            <VaultStep
              icon={ImagePlus}
              title="Capture"
              copy="Add the title, date, note, and optional image."
            />
            <VaultStep
              icon={Tag}
              title="Tag"
              copy="Pick the mood that best fits the moment."
            />
            <VaultStep
              icon={Search}
              title="Revisit"
              copy="Filter and search the wall when you want it back."
            />
          </div>
        </div>
      </div>

      <div className="story-vault-workspace">
        <form className="story-vault-form" onSubmit={handleSubmit}>
          <div className="story-vault-form-head">
            <div>
              <p className="story-vault-kicker">New Memory</p>
              <h3>Save a keepsake</h3>
            </div>
            <div className="story-vault-form-icon">
              <ImagePlus className="h-6 w-6" />
            </div>
          </div>

          <div className="story-vault-form-grid">
            <label className="space-y-2">
              <span className="story-vault-field-label">Title</span>
              <input
                required
                className="input-field"
                placeholder="Sunset after dinner"
                value={form.title}
                onChange={handleChange('title')}
              />
            </label>

            <label className="space-y-2">
              <span className="story-vault-field-label">Date</span>
              <input
                required
                type="date"
                className="input-field"
                value={form.date}
                onChange={handleChange('date')}
              />
            </label>

            <div className="space-y-3">
              <span className="story-vault-field-label">Mood</span>
              <div className="story-vault-filter-row">
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
                    className={`tag-pill ${
                      form.mood === mood.value ? 'tag-pill-active' : ''
                    }`}
                  >
                    <span>{mood.emoji}</span>
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>

            <RichTextEditor
              label="Short note"
              value={form.note}
              placeholder="What happened, what it felt like, what you never want to forget..."
              onChange={(value) => setForm((currentForm) => ({ ...currentForm, note: value }))}
            />

            <ImageUploadField
              label="Optional photo"
              value={form.photoUrl}
              onChange={(value) => setForm((currentForm) => ({ ...currentForm, photoUrl: value }))}
            />
          </div>

          <button type="submit" className="primary-button mt-6 w-full justify-center">
            <Sparkles className="h-4 w-4" />
            Save memory
          </button>
        </form>

        <div className="story-vault-wall">
          <div className="story-vault-wall-head">
            <div>
              <p className="story-vault-kicker">Memory Wall</p>
              <h3>Everything you want to revisit</h3>
            </div>

            <div className="story-vault-wall-tools">
              <label className="story-vault-search">
                <Search className="h-4 w-4" />
                <input
                  className="input-field"
                  placeholder="Search a title or note"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              <div className="story-vault-badge">
                {filteredMemories.length} showing
              </div>
            </div>
          </div>

          <div className="story-vault-filter-row story-vault-filter-row-wide">
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

          <div className="story-vault-wall-body">
            {filteredMemories.length ? (
              <div className="story-memory-grid">
                {filteredMemories.map((memory, index) => (
                  <MemoryCard key={memory.id} index={index} memory={memory} />
                ))}
              </div>
            ) : (
              <div className="story-vault-empty">
                <p className="story-vault-empty-title">No memories match yet</p>
                <p className="story-vault-empty-copy">
                  Try a different mood filter or add your first little keepsake.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
