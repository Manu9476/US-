import { useState } from 'react'
import { CalendarDays, Heart, Sparkles, X } from 'lucide-react'
import { motion } from 'framer-motion'

const todayValue = new Date().toISOString().split('T')[0]

export function OnboardingScreen({
  initialProfile,
  isModal = false,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    partnerOne: initialProfile?.partnerOne ?? '',
    partnerTwo: initialProfile?.partnerTwo ?? '',
    startDate: initialProfile?.startDate ?? '',
  })

  const handleChange = (field) => (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    onSave({
      partnerOne: form.partnerOne.trim(),
      partnerTwo: form.partnerTwo.trim(),
      startDate: form.startDate,
    })
  }

  const disabled =
    !form.partnerOne.trim() || !form.partnerTwo.trim() || !form.startDate

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(18,8,16,0.78)] px-4 py-6 backdrop-blur-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`glass-panel relative w-full overflow-hidden ${
          isModal ? 'max-w-3xl' : 'max-w-5xl'
        }`}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="surface-panel flex flex-col justify-between p-6">
            <div>
              <div className="meta-pill">
                <Sparkles className="h-3.5 w-3.5 accent-text" />
                Welcome To Us+
              </div>
              <h1 className="mt-6">
                Build your own
                <span className="accent-text block">little love world.</span>
              </h1>
              <p className="body-secondary mt-5 max-w-xl">
                Save the names that matter most, set the day your story began,
                and let the app become a private space that feels warm, soft,
                and entirely yours.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="surface-panel-soft p-4">
                <Heart className="h-5 w-5 accent-text" />
                <p className="body-primary mt-3 text-sm">Memories, dates, and notes</p>
                <p className="body-secondary mt-2 text-sm">
                  Everything stays on this device for a private shared ritual.
                </p>
              </div>

              <div className="surface-panel-soft p-4">
                <CalendarDays className="h-5 w-5 text-[var(--accent-secondary)]" />
                <p className="body-primary mt-3 text-sm">Track your time together</p>
                <p className="body-secondary mt-2 text-sm">
                  The dashboard keeps your milestones and next plans close.
                </p>
              </div>
            </div>
          </div>

          <form className="relative space-y-5" onSubmit={handleSubmit}>
            {isModal && (
              <button
                type="button"
                onClick={onClose}
                className="secondary-button absolute right-0 top-0 h-11 w-11 p-0"
                aria-label="Close profile editor"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            <div className="pt-12 sm:pt-14">
              <p className="section-label">First Things First</p>
              <h2 className="mt-3">Name your universe</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="body-secondary text-sm">Partner one</span>
                <input
                  className="input-field"
                  maxLength={32}
                  placeholder="Your name"
                  value={form.partnerOne}
                  onChange={handleChange('partnerOne')}
                />
              </label>

              <label className="space-y-2">
                <span className="body-secondary text-sm">Partner two</span>
                <input
                  className="input-field"
                  maxLength={32}
                  placeholder="Their name"
                  value={form.partnerTwo}
                  onChange={handleChange('partnerTwo')}
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="body-secondary text-sm">Relationship start date</span>
              <input
                type="date"
                className="input-field"
                max={todayValue}
                value={form.startDate}
                onChange={handleChange('startDate')}
              />
            </label>

            <div className="surface-panel-soft p-4">
              <p className="body-secondary text-sm">
                This anchors your dashboard, countdowns, and days-together pulse.
              </p>
            </div>

            <button
              type="submit"
              disabled={disabled}
              className="primary-button w-full"
            >
              <Heart className="h-4 w-4 fill-current" />
              Save our space
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}
