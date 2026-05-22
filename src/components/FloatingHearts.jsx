import { motion } from 'framer-motion'

const sparks = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  left: `${6 + ((index * 6.4) % 88)}%`,
  size: 10 + (index % 5) * 4,
  duration: 18 + (index % 4) * 2.2,
  delay: index * 0.45,
  drift: index % 2 === 0 ? 24 : -20,
  start: 106 + (index % 5) * 6,
  opacity: 0.05 + (index % 4) * 0.02,
}))

export function FloatingHearts() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {sparks.map((spark) => (
        <motion.span
          key={spark.id}
          className="absolute text-[rgba(255,94,140,0.16)] blur-[0.2px]"
          style={{
            left: spark.left,
            bottom: `${spark.start}%`,
            fontSize: `${spark.size}px`,
            opacity: spark.opacity,
          }}
          animate={{
            y: [0, -260, -360],
            x: [0, spark.drift, spark.drift * 0.4],
            opacity: [0, spark.opacity + 0.12, 0],
            scale: [0.86, 1.06, 0.92],
          }}
          transition={{
            repeat: Infinity,
            repeatType: 'loop',
            delay: spark.delay,
            duration: spark.duration,
            ease: 'easeInOut',
          }}
        >
          {'\u2665'}
        </motion.span>
      ))}
    </div>
  )
}
