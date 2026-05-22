import { Heart, Sparkles, X } from 'lucide-react'
import { motion } from 'framer-motion'

export function SurpriseOverlay({ quote, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(18,8,16,0.82)] px-4 py-6 backdrop-blur-3xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-panel relative w-full max-w-3xl overflow-hidden p-8 text-center"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="secondary-button absolute right-5 top-5 h-11 w-11 p-0"
          aria-label="Close surprise quote"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative">
          <div className="meta-pill mx-auto">
            <Sparkles className="h-3.5 w-3.5 accent-text" />
            Surprise Unlocked
          </div>

          <div className="mt-8 flex justify-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 6, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
              className="icon-shell h-16 w-16 rounded-full"
            >
              <Heart className="h-7 w-7 fill-current" />
            </motion.div>
          </div>

          <blockquote className="mt-8 px-4 text-[clamp(32px,5vw,52px)] leading-[1.08] tracking-[-0.02em] text-[var(--text-primary)]">
            "{quote}"
          </blockquote>

          <p className="body-secondary mx-auto mt-5 max-w-xl">
            Shake your phone anytime you need a soft reminder of what you are
            building together.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
