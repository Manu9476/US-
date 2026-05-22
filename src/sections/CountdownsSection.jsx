import { Pin, Sparkles, Timer } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { COUNTDOWN_TYPES } from '../data/constants'
import {
  createId,
  formatDateTime,
  getCountdownParts,
  isWithinDays,
  sortByDateAsc,
} from '../lib/utils'
import { SectionShell } from '../components/SectionShell'

function CountdownCard({ countdown, featuredLimitReached, now, onToggleFeatured }) {
  const parts = getCountdownParts(countdown.targetDate, now)
  const urgent = isWithinDays(countdown.targetDate, 7, now)

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className={`glass-panel p-6 ${urgent ? 'countdown-glow' : ''}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="tag-pill">{countdown.category}</span>
            {urgent && !parts.complete && (
              <span className="tag-pill tag-pill-active">Under 7 days</span>
            )}
          </div>

          <h3 className="mt-4">{countdown.title}</h3>
          <p className="body-secondary mt-2 text-sm">
            {formatDateTime(countdown.targetDate)}
          </p>
        </div>

        <button
          type="button"
          disabled={featuredLimitReached && !countdown.featured}
          onClick={() => onToggleFeatured(countdown.id)}
          className={countdown.featured ? 'primary-button' : 'secondary-button'}
        >
          <Pin className="h-4 w-4" />
          {countdown.featured ? 'Pinned to dashboard' : 'Pin'}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Days', parts.days],
          ['Hours', parts.hours],
          ['Minutes', parts.minutes],
          ['Seconds', parts.seconds],
        ].map(([label, value]) => (
          <div
            key={label}
            className="surface-panel-soft px-4 py-4 text-center"
          >
            <p className="body-primary text-[28px] leading-none">{value}</p>
            <p className="days-label mt-2">{label}</p>
          </div>
        ))}
      </div>

      {parts.complete && (
        <p className="mt-5 text-sm text-[var(--danger)]">
          This moment is here. Update it or leave it as a beautiful timestamp.
        </p>
      )}
    </motion.article>
  )
}

export function CountdownsSection({
  id,
  countdowns,
  featuredCount,
  now,
  onAddCountdown,
  onToggleFeatured,
}) {
  const [form, setForm] = useState({
    title: '',
    targetDate: '',
    category: 'anniversary',
    featured: false,
  })

  const sortedCountdowns = sortByDateAsc(countdowns, (countdown) => countdown.targetDate)

  const handleChange = (field) => (event) => {
    const value =
      field === 'featured' ? event.target.checked : event.target.value

    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    onAddCountdown({
      id: createId('countdown'),
      title: form.title.trim(),
      targetDate: form.targetDate,
      category: form.category,
      featured: form.featured,
      createdAt: new Date().toISOString(),
    })

    setForm({
      title: '',
      targetDate: '',
      category: 'anniversary',
      featured: false,
    })
  }

  return (
    <SectionShell
      id={id}
      eyebrow="Milestone Tracker"
      title="Moments Ahead"
      description="Keep anniversaries, birthdays, trips, and all the delicious anticipation in one glowing place. Anything close lights up automatically."
    >
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <form className="glass-panel p-6" onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <div className="icon-shell">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <p className="section-label">New Countdown</p>
              <h3 className="mt-1">Add the next big moment</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="space-y-2">
              <span className="body-secondary text-sm">Title</span>
              <input
                required
                className="input-field"
                placeholder="Anniversary weekend"
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
                  value={form.targetDate}
                  onChange={handleChange('targetDate')}
                />
              </label>

              <label className="space-y-2">
                <span className="body-secondary text-sm">Category</span>
                <select
                  className="input-field"
                  value={form.category}
                  onChange={handleChange('category')}
                >
                  {COUNTDOWN_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="surface-panel-soft flex items-center gap-3 px-4 py-4 text-sm body-secondary">
              <input
                type="checkbox"
                checked={form.featured}
                disabled={!form.featured && featuredCount >= 3}
                onChange={handleChange('featured')}
              />
              Pin to dashboard
            </label>

            {featuredCount >= 3 && (
              <p className="body-secondary text-sm">
                You already have three featured countdowns pinned on the home dashboard.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="primary-button mt-6 w-full"
          >
            <Sparkles className="h-4 w-4" />
            Save countdown
          </button>
        </form>

        <div className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Live Timers</p>
              <h3 className="mt-1">Everything you are waiting for</h3>
            </div>
            <span className="meta-pill">{sortedCountdowns.length} total</span>
          </div>

          <div className="mt-6 space-y-4">
            {sortedCountdowns.length ? (
              sortedCountdowns.map((countdown) => (
                <CountdownCard
                  key={countdown.id}
                  countdown={countdown}
                  featuredLimitReached={featuredCount >= 3}
                  now={now}
                  onToggleFeatured={onToggleFeatured}
                />
              ))
            ) : (
              <div className="empty-state p-8 text-center text-sm">
                Add an anniversary, trip, or birthday and the live timer starts instantly.
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
