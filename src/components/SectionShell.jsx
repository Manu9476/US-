import { motion } from 'framer-motion'

export function SectionShell({
  id,
  eyebrow,
  title,
  description,
  actions,
  children,
}) {
  return (
    <motion.section
      id={id}
      className="section-shell space-y-7"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="section-copy">
          {eyebrow && <p className="section-label">{eyebrow}</p>}
          {title && <h2 className="mt-3">{title}</h2>}
          {description && (
            <p className="body-secondary mt-3 max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {actions ? <div className="md:shrink-0">{actions}</div> : null}
      </div>

      {children}
    </motion.section>
  )
}
