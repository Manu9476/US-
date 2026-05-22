import { Heart, Lock, Mail, Sparkles, Unlock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { NOTE_MOODS, NOTE_THEMES } from '../data/constants'
import { createId, formatDateTime, sortByDateDesc } from '../lib/utils'
import { SectionShell } from '../components/SectionShell'
import { RichTextEditor } from '../components/RichTextEditor'
import { ImageUploadField } from '../components/ImageUploadField'

function NoteCard({ note, onOpenNote }) {
  const mood = NOTE_MOODS.find((item) => item.value === note.mood)
  const theme = NOTE_THEMES.find((item) => item.value === note.theme) ?? NOTE_THEMES[0]

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className={`surface-panel p-6 note-theme-${theme.value}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="meta-pill">To {note.target}</span>
            <span className="tag-pill">
              {mood?.emoji} {mood?.label}
            </span>
            <span className={note.read ? 'tag-pill' : 'tag-pill-active'}>
              {note.read ? 'Read' : 'Unread'}
            </span>
          </div>

          <h3 className="mt-4">From {note.author}</h3>
          <p className="body-muted mt-2 text-sm">{formatDateTime(note.createdAt)}</p>
        </div>

        {!note.read && (
          <button
            type="button"
            onClick={() => onOpenNote(note.id)}
            className="secondary-button"
          >
            <Unlock className="h-4 w-4" />
            Open with love
          </button>
        )}
      </div>

      <div className="surface-panel-soft mt-6 p-5">
        {note.read ? (
          <div
            className="rich-content body-primary"
            dangerouslySetInnerHTML={{ __html: note.message }}
          />
        ) : (
          <div className="flex items-center gap-3">
            <div className="icon-shell icon-shell-secondary">
              <Lock className="h-4 w-4" />
            </div>
            <p className="body-secondary text-sm">
              This note stays hidden until the other person opens it.
            </p>
          </div>
        )}
      </div>
      {note.photoUrl && note.read && (
        <img
          src={note.photoUrl}
          alt={`From ${note.author}`}
          className="mt-4 h-44 w-full rounded-[16px] object-cover"
          loading="lazy"
        />
      )}
    </motion.article>
  )
}

export function LoveNotesSection({ id, notes, profile, onAddNote, onOpenNote }) {
  const partners = [profile.partnerOne, profile.partnerTwo].filter(Boolean)
  const [form, setForm] = useState({
    author: partners[0] ?? '',
    target: partners[1] ?? partners[0] ?? '',
    mood: 'tender',
    theme: NOTE_THEMES[0].value,
    message: '',
    photoUrl: '',
  })

  const sortedNotes = sortByDateDesc(notes, (note) => note.createdAt).sort((left, right) => {
    if (left.read === right.read) {
      return 0
    }

    return left.read ? 1 : -1
  })

  const handleChange = (field) => (event) => {
    const value = event.target.value

    setForm((currentForm) => {
      const nextForm = {
        ...currentForm,
        [field]: value,
      }

      if (field === 'author' && nextForm.author === nextForm.target) {
        nextForm.target = partners.find((partner) => partner !== value) ?? value
      }

      if (field === 'target' && nextForm.author === nextForm.target) {
        nextForm.author = partners.find((partner) => partner !== value) ?? value
      }

      return nextForm
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedMessage = form.message.replace(/<[^>]+>/g, '').trim()
    if (!trimmedMessage) return

    onAddNote({
      id: createId('note'),
      author: form.author,
      target: form.target,
      mood: form.mood,
      theme: form.theme,
      message: form.message.trim(),
      photoUrl: form.photoUrl.trim(),
      read: false,
      createdAt: new Date().toISOString(),
    })

    const nextAuthor = form.target
    const nextTarget = partners.find((partner) => partner !== nextAuthor) ?? nextAuthor

    setForm({
      author: nextAuthor,
      target: nextTarget,
      mood: 'tender',
      theme: NOTE_THEMES[0].value,
      message: '',
      photoUrl: '',
    })
  }

  return (
    <SectionShell
      id={id}
      eyebrow="Private Inbox"
      title="Just For You"
      description="Leave sealed messages for each other, choose the mood, and keep a tiny inbox of things too sweet to leave unsaid."
    >
      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <form className="glass-panel p-6" onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <div className="icon-shell">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="section-label">New Note</p>
              <h3 className="mt-2">Write something soft</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="body-secondary text-sm">From</span>
                <select
                  className="input-field"
                  value={form.author}
                  onChange={handleChange('author')}
                >
                  {partners.map((partner) => (
                    <option key={partner} value={partner}>
                      {partner}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="body-secondary text-sm">For</span>
                <select
                  className="input-field"
                  value={form.target}
                  onChange={handleChange('target')}
                >
                  {partners.map((partner) => (
                    <option key={partner} value={partner}>
                      {partner}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="body-secondary text-sm">Mood</span>
                <select
                  className="input-field"
                  value={form.mood}
                  onChange={handleChange('mood')}
                >
                  {NOTE_MOODS.map((mood) => (
                    <option key={mood.value} value={mood.value}>
                      {mood.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-2">
                <span className="body-secondary text-sm">Color theme</span>
                <div className="grid grid-cols-3 gap-2">
                  {NOTE_THEMES.map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          theme: theme.value,
                        }))
                      }
                      className={`surface-panel px-3 py-3 text-left transition ${
                        form.theme === theme.value
                          ? 'border-[rgba(212,131,106,0.4)]'
                          : 'hover:border-[rgba(212,131,106,0.24)]'
                      }`}
                    >
                      <span
                        className={`note-swatch-${theme.value} mb-3 block h-2.5 rounded-full`}
                      />
                      <span className="body-secondary text-xs">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <RichTextEditor
              label="Message"
              value={form.message}
              placeholder="A thank you, a little flirt, or something you want them to open later..."
              onChange={(value) => setForm((currentForm) => ({ ...currentForm, message: value }))}
            />
            <ImageUploadField
              label="Optional photo"
              value={form.photoUrl}
              onChange={(value) => setForm((currentForm) => ({ ...currentForm, photoUrl: value }))}
            />
          </div>

          <button type="submit" className="primary-button mt-6 w-full justify-center">
            <Sparkles className="h-4 w-4" />
            Send note
          </button>
        </form>

        <div className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Love Mail</p>
              <h3 className="mt-2">Inbox of little surprises</h3>
            </div>
            <span className="meta-pill">
              {sortedNotes.length} note{sortedNotes.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {sortedNotes.length ? (
              sortedNotes.map((note) => (
                <NoteCard key={note.id} note={note} onOpenNote={onOpenNote} />
              ))
            ) : (
              <div className="empty-state p-10 text-center">
                <Heart className="mx-auto h-8 w-8 accent-text" />
                <h3 className="mt-4">No notes yet</h3>
                <p className="body-secondary mt-3 text-sm">
                  Leave the first little message and start your secret inbox.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
