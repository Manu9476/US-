import { CalendarDays, Check, Clock3, MapPin, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { DATE_TYPES } from '../data/constants'
import { createId, formatDateTime, sortByDateAsc, sortByDateDesc } from '../lib/utils'
import { SectionShell } from '../components/SectionShell'
import { RichTextEditor } from '../components/RichTextEditor'
import { ImageUploadField } from '../components/ImageUploadField'

function DateCard({ datePlan, isPast, onToggleDone }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="glass-panel p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="tag-pill">{datePlan.type.replace('-', ' ')}</span>
            {datePlan.done ? (
              <span className="tag-pill tag-pill-active">Loved</span>
            ) : isPast ? (
              <span className="tag-pill">Passed into memories</span>
            ) : null}
          </div>

          <h3 className="mt-4">{datePlan.title}</h3>

          <div className="body-secondary mt-4 flex flex-wrap gap-4 text-sm">
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 accent-text" />
              {formatDateTime(datePlan.dateTime)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--accent-secondary)]" />
              {datePlan.location}
            </span>
          </div>

          {datePlan.notes && (
            <div
              className="rich-content body-secondary mt-4 text-sm"
              dangerouslySetInnerHTML={{ __html: datePlan.notes }}
            />
          )}
          {datePlan.photoUrl && (
            <img
              src={datePlan.photoUrl}
              alt={datePlan.title}
              className="mt-4 h-44 w-full rounded-[16px] object-cover"
              loading="lazy"
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => onToggleDone(datePlan.id)}
          className={datePlan.done ? 'secondary-button' : 'primary-button'}
        >
          <Check className="h-4 w-4" />
          {datePlan.done ? 'Undo loved' : 'Mark loved'}
        </button>
      </div>
    </motion.article>
  )
}

export function DatePlannerSection({ id, dates, now, onAddDate, onToggleDone }) {
  const [form, setForm] = useState({
    title: '',
    dateTime: '',
    location: '',
    type: 'dinner',
    notes: '',
    photoUrl: '',
  })

  const upcomingDates = sortByDateAsc(
    dates.filter(
      (datePlan) =>
        !datePlan.done && new Date(datePlan.dateTime).getTime() >= now.getTime(),
    ),
    (datePlan) => datePlan.dateTime,
  )

  const pastDates = sortByDateDesc(
    dates.filter(
      (datePlan) =>
        datePlan.done || new Date(datePlan.dateTime).getTime() < now.getTime(),
    ),
    (datePlan) => datePlan.dateTime,
  )

  const handleChange = (field) => (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    onAddDate({
      id: createId('date'),
      title: form.title.trim(),
      dateTime: form.dateTime,
      location: form.location.trim(),
      type: form.type,
      notes: form.notes.trim(),
      photoUrl: form.photoUrl.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    })

    setForm({
      title: '',
      dateTime: '',
      location: '',
      type: 'dinner',
      notes: '',
      photoUrl: '',
    })
  }

  return (
    <SectionShell
      id={id}
      eyebrow="Shared Planner"
      title="Plan Our Date"
      description="Turn a sweet idea into a real plan, then let time move it from anticipation into your beautiful archive of days already lived."
    >
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <form className="glass-panel p-6" onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <div className="icon-shell">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="section-label">New Date</p>
              <h3 className="mt-1">Put something lovely on the calendar</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="space-y-2">
              <span className="body-secondary text-sm">Title</span>
              <input
                required
                className="input-field"
                placeholder="Moonlit rooftop dinner"
                value={form.title}
                onChange={handleChange('title')}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="body-secondary text-sm">Date and time</span>
                <input
                  required
                  type="datetime-local"
                  className="input-field"
                  value={form.dateTime}
                  onChange={handleChange('dateTime')}
                />
              </label>

              <label className="space-y-2">
                <span className="body-secondary text-sm">Type</span>
                <select
                  className="input-field"
                  value={form.type}
                  onChange={handleChange('type')}
                >
                  {DATE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="space-y-2">
              <span className="body-secondary text-sm">Location</span>
              <input
                required
                className="input-field"
                placeholder="City lights rooftop"
                value={form.location}
                onChange={handleChange('location')}
              />
            </label>

            <RichTextEditor
              label="Notes"
              value={form.notes}
              placeholder="Dress code, wishlist, a tiny surprise idea..."
              onChange={(value) => setForm((currentForm) => ({ ...currentForm, notes: value }))}
            />
            <ImageUploadField
              label="Optional photo"
              value={form.photoUrl}
              onChange={(value) => setForm((currentForm) => ({ ...currentForm, photoUrl: value }))}
            />
          </div>

          <button
            type="submit"
            className="primary-button mt-6 w-full"
          >
            <Sparkles className="h-4 w-4" />
            Save date plan
          </button>
        </form>

        <div className="space-y-5">
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Coming Up</p>
                <h3 className="mt-1">Upcoming dates</h3>
              </div>
              <span className="meta-pill">{upcomingDates.length} planned</span>
            </div>

            <div className="mt-6 space-y-4">
              {upcomingDates.length ? (
                upcomingDates.map((datePlan) => (
                  <DateCard
                    key={datePlan.id}
                    datePlan={datePlan}
                    isPast={false}
                    onToggleDone={onToggleDone}
                  />
                ))
              ) : (
                <div className="empty-state p-8 text-center text-sm">
                  Your next date night, adventure, or surprise will appear here.
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Beautiful Memories</p>
                <h3 className="mt-1">Dates already lived</h3>
              </div>
              <span className="meta-pill">{pastDates.length} saved</span>
            </div>

            <div className="mt-6 space-y-4">
              {pastDates.length ? (
                pastDates.map((datePlan) => (
                  <DateCard
                    key={datePlan.id}
                    datePlan={datePlan}
                    isPast
                    onToggleDone={onToggleDone}
                  />
                ))
              ) : (
                <div className="empty-state p-8 text-center text-sm">
                  Once a planned date passes, it moves here automatically.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
