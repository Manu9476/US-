import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Heart,
  Mail,
  Menu,
  Quote,
  Sparkles,
  Timer,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate } from '../lib/utils'

const bouquetBlooms = [
  { left: '16%', top: '18%', size: 62, rotate: -10 },
  { left: '29%', top: '9%', size: 68, rotate: -5 },
  { left: '43%', top: '5%', size: 78, rotate: 2 },
  { left: '57%', top: '10%', size: 70, rotate: 10 },
  { left: '69%', top: '18%', size: 62, rotate: 14 },
  { left: '25%', top: '29%', size: 74, rotate: -8 },
  { left: '41%', top: '24%', size: 86, rotate: 0 },
  { left: '58%', top: '28%', size: 74, rotate: 8 },
  { left: '34%', top: '43%', size: 64, rotate: -6 },
  { left: '51%', top: '45%', size: 64, rotate: 7 },
]

const floatingChips = [
  { left: '8%', top: '70%', size: 28 },
  { left: '18%', top: '80%', size: 24 },
  { left: '74%', top: '76%', size: 22 },
  { left: '84%', top: '69%', size: 30 },
  { left: '91%', top: '78%', size: 20 },
]

function PortalCard({ icon: Icon, kicker, title, meta, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="feature-tile"
    >
      <div className="icon-shell h-11 w-11 rounded-[16px]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="section-label">{kicker}</p>
        <p className="feature-tile-title mt-3">{title}</p>
        <p className="feature-tile-meta mt-2">{meta}</p>
      </div>
      <span className="feature-tile-link">Open page</span>
    </motion.button>
  )
}

function BouquetArt() {
  return (
    <div className="hero-art">
      <div className="hero-art-orb" />

      {bouquetBlooms.map((bloom, index) => (
        <motion.div
          key={`${bloom.left}-${bloom.top}`}
          className="bouquet-bloom"
          style={{
            left: bloom.left,
            top: bloom.top,
            width: `${bloom.size}px`,
            height: `${bloom.size}px`,
          }}
          animate={{
            y: [0, -8, 0],
            rotate: [bloom.rotate, bloom.rotate + 4, bloom.rotate],
          }}
          transition={{
            repeat: Infinity,
            duration: 3.6 + index * 0.18,
            ease: 'easeInOut',
          }}
        >
          <Heart className="h-[44%] w-[44%] fill-current" />
        </motion.div>
      ))}

      <div className="bouquet-wrap" />
      <div className="bouquet-ribbon bouquet-ribbon-left" />
      <div className="bouquet-ribbon bouquet-ribbon-right" />
      <div className="bouquet-base" />

      {floatingChips.map((chip, index) => (
        <motion.div
          key={`${chip.left}-${chip.top}`}
          className="floating-heart-chip"
          style={{
            left: chip.left,
            top: chip.top,
            width: `${chip.size}px`,
            height: `${chip.size}px`,
          }}
          animate={{ y: [0, -10, 0], scale: [1, 1.08, 1] }}
          transition={{
            repeat: Infinity,
            duration: 2.8 + index * 0.2,
            ease: 'easeInOut',
          }}
        >
          <Heart className="h-[48%] w-[48%] fill-current" />
        </motion.div>
      ))}
    </div>
  )
}

function PhonePreview({
  canUseMotion,
  dailyQuote,
  daysTogether,
  minuteKey,
  motionEnabled,
  onEnableMotion,
  onNavigate,
  onShowSurprise,
  profile,
}) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
      className="phone-shell"
    >
      <div className="phone-frame">
        <div className="phone-top-row">
          <div className="phone-circle">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <div className="phone-circle">
            <Menu className="h-4 w-4" />
          </div>
        </div>

        <div className="phone-illustration flex items-center justify-center">
          <motion.div
            className="icon-shell h-20 w-20 rounded-[26px]"
            animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            <Heart className="h-9 w-9 fill-current" />
          </motion.div>
          <motion.div
            className="absolute left-[22%] top-[26%] text-[var(--accent-secondary)]"
            animate={{ y: [0, -10, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>
          <motion.div
            className="absolute right-[18%] top-[34%] text-[var(--accent-primary)]"
            animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', delay: 0.4 }}
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
        </div>

        <p className="phone-caption">"{dailyQuote}"</p>

        <motion.div
          key={minuteKey}
          className="surface-panel-soft mt-5 p-4"
          initial={{ scale: 0.98 }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          <p className="days-label">Days together</p>
          <div className="days-counter-value mt-3 text-[64px]">{daysTogether}</div>
          <p className="body-muted mt-3 text-xs">
            Private to {profile.partnerOne} and {profile.partnerTwo}
          </p>
        </motion.div>

        <div className="phone-actions">
          <button
            type="button"
            onClick={onShowSurprise}
            className="phone-action phone-action-primary"
          >
            Surprise
          </button>
          <button
            type="button"
            onClick={() => onNavigate('story')}
            className="phone-action phone-action-secondary"
          >
            Our Story
          </button>
        </div>

        <div className="phone-mini-grid">
          <button
            type="button"
            onClick={() => onNavigate('story')}
            className="phone-mini-card"
          >
            <BookOpen className="h-5 w-5 accent-text" />
            Story
          </button>
          <button
            type="button"
            onClick={() => onNavigate('dates')}
            className="phone-mini-card"
          >
            <CalendarDays className="h-5 w-5 accent-text" />
            Dates
          </button>
          <button
            type="button"
            onClick={() => onNavigate('countdowns')}
            className="phone-mini-card"
          >
            <Timer className="h-5 w-5 text-[var(--accent-secondary)]" />
            Timers
          </button>
          <button
            type="button"
            onClick={() => onNavigate('notes')}
            className="phone-mini-card"
          >
            <Mail className="h-5 w-5 accent-text" />
            Notes
          </button>
        </div>

        {canUseMotion && !motionEnabled && (
          <button
            type="button"
            onClick={onEnableMotion}
            className="secondary-button mt-5 w-full justify-center"
          >
            <Sparkles className="h-4 w-4" />
            Enable shake surprise
          </button>
        )}
      </div>
    </motion.aside>
  )
}

export function DashboardSection({
  id,
  canUseMotion,
  dailyQuote,
  daysTogether,
  minuteKey,
  motionEnabled,
  onEnableMotion,
  onNavigate,
  onShowSurprise,
  profile,
}) {
  return (
    <section id={id} className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="section-copy">
          <p className="section-label">Shared Home</p>
          <h2 className="mt-3">Our World</h2>
          <p className="body-secondary mt-3 max-w-3xl">
            Home is now its own dedicated page. It holds your shared identity,
            your days together, the daily love quote, and clean entry points to
            the other parts of Us+ without mixing their content into this view.
          </p>
        </div>

        <div className="meta-pill">
          <Heart className="h-3.5 w-3.5 accent-text" />
          Together since {formatDate(profile.startDate)}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.56fr]">
        <div className="showcase-desktop">
          <div className="desktop-topline">
            <div className="meta-pill">
              <Sparkles className="h-3.5 w-3.5 accent-text" />
              Private home
            </div>

            <div className="desktop-mini-nav hidden lg:flex">
              <button type="button" onClick={() => onNavigate('world')}>
                Home
              </button>
              <button type="button" onClick={() => onNavigate('story')}>
                Story
              </button>
              <button type="button" onClick={() => onNavigate('dates')}>
                Dates
              </button>
              <button type="button" onClick={() => onNavigate('notes')}>
                Notes
              </button>
            </div>
          </div>

          <div className="showcase-hero-grid mt-8">
            <div className="hero-copy">
              <p className="section-label">For Two</p>
              <h1 className="hero-partners mt-4">
                {profile.partnerOne}
                <span className="accent-text mx-3">&amp;</span>
                {profile.partnerTwo}
              </h1>

              <p className="body-secondary mt-4 max-w-[29rem]">
                A premium private home screen for your relationship. This page
                now stays focused on your shared identity and the mood of the
                app instead of embedding story, notes, or planner content.
              </p>

              <motion.div
                key={minuteKey}
                className="hero-stat-panel surface-panel mt-6 p-5"
                initial={{ scale: 0.98, boxShadow: '0 0 0 rgba(0,0,0,0)' }}
                animate={{
                  scale: [1, 1.02, 1],
                  boxShadow: [
                    '0 18px 40px rgba(0,0,0,0.2)',
                    '0 18px 40px rgba(0,0,0,0.2), 0 0 28px rgba(255,77,123,0.12)',
                    '0 18px 40px rgba(0,0,0,0.2)',
                  ],
                }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              >
                <p className="days-label">Days together</p>
                <div className="days-counter-value mt-3">{daysTogether}</div>
                <p className="body-muted mt-3 text-sm">
                  Time feels more alive here, with a soft pulse every minute.
                </p>
              </motion.div>

              <div className="hero-quote-card surface-panel-soft mt-5 p-5">
                <div className="flex items-center gap-2">
                  <Quote className="h-4 w-4 accent-text" />
                  <p className="section-label">Daily quote</p>
                </div>
                <p className="body-primary mt-3 text-lg leading-8">
                  "{dailyQuote}"
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onShowSurprise}
                  className="primary-button"
                >
                  <Heart className="h-4 w-4 fill-current" />
                  Surprise me
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('story')}
                  className="secondary-button"
                >
                  <BookOpen className="h-4 w-4" />
                  Enter our story
                </button>
              </div>
            </div>

            <BouquetArt />
          </div>

          <div className="feature-grid">
            <PortalCard
              icon={BookOpen}
              kicker="Memory journal"
              meta="Save photos, moods, titles, and little notes in a page dedicated only to your story."
              title="Our Story"
              onClick={() => onNavigate('story')}
            />

            <PortalCard
              icon={CalendarDays}
              kicker="Date planner"
              meta="Create plans, set locations and times, and keep your shared calendar in its own space."
              title="Plan Our Date"
              onClick={() => onNavigate('dates')}
            />

            <PortalCard
              icon={Timer}
              kicker="Countdown hub"
              meta="Track upcoming anniversaries, trips, birthdays, and milestones without mixing them into home."
              title="Moments Ahead"
              onClick={() => onNavigate('countdowns')}
            />

            <PortalCard
              icon={Mail}
              kicker="Private inbox"
              meta="Leave sealed messages, open them with love, and keep notes separate from every other page."
              title="Just For You"
              onClick={() => onNavigate('notes')}
            />
          </div>
        </div>

        <PhonePreview
          canUseMotion={canUseMotion}
          dailyQuote={dailyQuote}
          daysTogether={daysTogether}
          minuteKey={minuteKey}
          motionEnabled={motionEnabled}
          onEnableMotion={onEnableMotion}
          onNavigate={onNavigate}
          onShowSurprise={onShowSurprise}
          profile={profile}
        />
      </div>
    </section>
  )
}
