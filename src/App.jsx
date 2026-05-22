import { useMemo, useState } from 'react'
import {
  BookOpenText,
  CalendarRange,
  Heart,
  KeyRound,
  Music4,
  Menu,
  MessageSquareHeart,
  MountainSnow,
  Plus,
  Shuffle,
  Sparkles,
} from 'lucide-react'
import { FloatingHearts } from './components/FloatingHearts'
import { ImageUploadField } from './components/ImageUploadField'
import { RichTextEditor } from './components/RichTextEditor'
import { LOVE_QUOTES } from './data/constants'
import { useLocalStorageState } from './hooks/useLocalStorageState'
import { useNow } from './hooks/useNow'
import { createId, formatDate, formatDateTime, getCountdownParts, getDaysTogether, sortByDateAsc } from './lib/utils'
import { MemoriesSection } from './sections/MemoriesSection'

const navItems = [
  { id: 'home', label: 'Sanctuary', icon: Sparkles },
  { id: 'timeline', label: 'Timeline', icon: BookOpenText },
  { id: 'date-lab', label: 'Date Lab', icon: CalendarRange },
  { id: 'dream-board', label: 'Dream Board', icon: MountainSnow },
  { id: 'vault', label: 'Private Vault', icon: KeyRound },
  { id: 'playlist', label: 'Our Playlist', icon: Music4 },
]

const initialProfile = { one: 'My Love', two: 'Forever', since: '2024-01-01' }
const dateIdeas = [
  'Rooftop dinner with a dress code',
  'Late-night city drive + playlist roulette',
  'Bookstore date and coffee notes',
  'Cook one new recipe together',
  'Sunrise walk and photo challenge',
]
const timelineMoodMap = {
  romantic: 'giddy',
  adventure: 'wild',
  cozy: 'cozy',
}

function App() {
  const now = useNow(1000)
  const [tab, setTab] = useState('home')
  const [mobileNav, setMobileNav] = useState(false)
  const [profile, setProfile] = useLocalStorageState('us-plus-premium-profile', initialProfile)
  const [timeline, setTimeline] = useLocalStorageState('us-plus-premium-timeline', [])
  const [dates, setDates] = useLocalStorageState('us-plus-premium-dates', [])
  const [dreams, setDreams] = useLocalStorageState('us-plus-premium-dreams', [])
  const [vault, setVault] = useLocalStorageState('us-plus-premium-vault', [])
  const [playlist, setPlaylist] = useLocalStorageState('us-plus-premium-playlist', [])
  const [idea, setIdea] = useState(dateIdeas[0])

  const days = getDaysTogether(profile.since, now)
  const quote = LOVE_QUOTES[Math.floor(now.getDate() % LOVE_QUOTES.length)]

  const upcomingDates = useMemo(
    () => sortByDateAsc(dates.filter((item) => new Date(item.when).getTime() >= now.getTime()), (item) => item.when),
    [dates, now],
  )
  const timelineMemories = useMemo(
    () =>
      timeline.map((item) => ({
        ...item,
        mood: timelineMoodMap[item.mood] ?? item.mood ?? 'giddy',
        photoUrl: item.photoUrl ?? item.photo ?? '',
      })),
    [timeline],
  )

  const shellTitle = navItems.find((item) => item.id === tab)?.label ?? 'Sanctuary'
  const topDream = useMemo(() => [...dreams].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))[0], [dreams])

  return (
    <div className="lux-app">
      <FloatingHearts />
      <div className={`lux-overlay ${mobileNav ? 'is-open' : ''}`} onClick={() => setMobileNav(false)} />

      <aside className={`lux-sidebar ${mobileNav ? 'is-open' : ''}`}>
        <div className="lux-logo">Us+</div>
        <p className="lux-subtitle">Private Romance OS</p>

        <nav className="lux-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id)
                  setMobileNav(false)
                }}
                className={`lux-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="lux-partner-chip">
          <Heart className="h-4 w-4 fill-current" /> {profile.one} + {profile.two}
        </div>
      </aside>

      <main className="lux-main">
        <header className="lux-mobile-bar">
          <button type="button" onClick={() => setMobileNav(true)} className="lux-ghost-btn">
            <Menu className="h-4 w-4" />
          </button>
          <span>{shellTitle}</span>
        </header>

        <section className="lux-hero scroll-anchor">
          <div>
            <p className="lux-kicker">For {profile.one} & {profile.two}</p>
            <h1 className="lux-title">Your relationship HQ, crafted like a premium love OS.</h1>
            <p className="lux-copy">“{quote}”</p>
          </div>
          <div className="lux-days">
            <p>Days together</p>
            <strong>{days}</strong>
            <span>Since {formatDate(profile.since)}</span>
          </div>
        </section>

        {tab === 'home' && (
          <section className="lux-grid scroll-anchor">
            <article className="lux-card">
              <h3>Identity Studio</h3>
              <div className="lux-form-grid">
                <input className="input-field" value={profile.one} onChange={(e) => setProfile((v) => ({ ...v, one: e.target.value }))} />
                <input className="input-field" value={profile.two} onChange={(e) => setProfile((v) => ({ ...v, two: e.target.value }))} />
                <input type="date" className="input-field" value={profile.since} onChange={(e) => setProfile((v) => ({ ...v, since: e.target.value }))} />
              </div>
            </article>
            <article className="lux-card">
              <h3>Next Date</h3>
              {upcomingDates[0] ? (
                <div className="lux-mini">
                  <p className="body-primary">{upcomingDates[0].title}</p>
                  <p className="body-muted">{formatDateTime(upcomingDates[0].when)}</p>
                </div>
              ) : (
                <p className="body-muted">No date planned yet.</p>
              )}
            </article>
            <article className="lux-card">
              <h3>Current Dream</h3>
              {topDream ? (
                <div className="lux-mini">
                  <p className="body-primary">{topDream.title}</p>
                  <p className="body-muted">{topDream.progress}% complete</p>
                </div>
              ) : (
                <p className="body-muted">No active dream yet.</p>
              )}
            </article>
          </section>
        )}

        {tab === 'timeline' && (
          <MemoriesSection
            id="timeline"
            memories={timelineMemories}
            partners={{ partnerOne: profile.one, partnerTwo: profile.two }}
            onAddMemory={(memory) =>
              setTimeline((items) => [
                {
                  ...memory,
                  photo: memory.photoUrl,
                  photoUrl: memory.photoUrl,
                },
                ...items,
              ])
            }
          />
        )}
        {tab === 'date-lab' && (
          <DateLabSection
            dates={dates}
            setDates={setDates}
            idea={idea}
            onShuffleIdea={() => setIdea(dateIdeas[Math.floor(Math.random() * dateIdeas.length)])}
          />
        )}
        {tab === 'dream-board' && <DreamBoardSection dreams={dreams} setDreams={setDreams} />}
        {tab === 'vault' && <VaultSection vault={vault} setVault={setVault} />}
        {tab === 'playlist' && <PlaylistSection playlist={playlist} setPlaylist={setPlaylist} now={now} />}
      </main>
    </div>
  )
}

function DateLabSection({ dates, setDates, idea, onShuffleIdea }) {
  const [form, setForm] = useState({ title: '', when: '', place: '', note: '', photo: '' })
  const ordered = sortByDateAsc(dates, (item) => item.when)
  const add = (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.when || !form.place.trim()) return
    setDates((items) => [...items, { id: createId('date'), ...form }])
    setForm({ title: '', when: '', place: '', note: '', photo: '' })
  }
  return (
    <section className="lux-grid two-col scroll-anchor">
      <form className="lux-card" onSubmit={add}>
        <div className="flex items-center justify-between gap-3">
          <h3>Create Date Plan</h3>
          <button type="button" onClick={onShuffleIdea} className="secondary-button !h-10 !px-3 !py-0">
            <Shuffle className="h-4 w-4" /> Idea
          </button>
        </div>
        <p className="body-secondary mt-3">Try this: {idea}</p>
        <input className="input-field" placeholder="Date title" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
        <input type="datetime-local" className="input-field mt-3" value={form.when} onChange={(e) => setForm((v) => ({ ...v, when: e.target.value }))} />
        <input className="input-field mt-3" placeholder="Location" value={form.place} onChange={(e) => setForm((v) => ({ ...v, place: e.target.value }))} />
        <div className="mt-3">
          <RichTextEditor label="Notes" value={form.note} onChange={(value) => setForm((v) => ({ ...v, note: value }))} placeholder="Outfit, vibe, playlist..." />
        </div>
        <div className="mt-3">
          <ImageUploadField label="Mood photo" value={form.photo} onChange={(value) => setForm((v) => ({ ...v, photo: value }))} />
        </div>
        <button className="primary-button mt-4 w-full" type="submit"><Plus className="h-4 w-4" /> Save date</button>
      </form>
      <div className="lux-stack">
        {ordered.map((item) => (
          <article key={item.id} className="lux-card">
            <h3>{item.title}</h3>
            <p className="body-muted mt-2">{formatDateTime(item.when)} • {item.place}</p>
            {item.photo && <img src={item.photo} alt={item.title} className="lux-image mt-3" />}
            {item.note && <div className="rich-content body-secondary mt-3" dangerouslySetInnerHTML={{ __html: item.note }} />}
          </article>
        ))}
      </div>
    </section>
  )
}

function DreamBoardSection({ dreams, setDreams }) {
  const [form, setForm] = useState({ title: '', target: '', progress: 10 })
  const add = (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.target) return
    setDreams((items) => [...items, { id: createId('dream'), ...form }])
    setForm({ title: '', target: '', progress: 10 })
  }

  return (
    <section className="lux-grid two-col scroll-anchor">
      <form className="lux-card" onSubmit={add}>
        <h3>Add Shared Dream</h3>
        <input className="input-field" placeholder="Couple trip to Santorini" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
        <input type="datetime-local" className="input-field mt-3" value={form.target} onChange={(e) => setForm((v) => ({ ...v, target: e.target.value }))} />
        <label className="body-secondary mt-3 block text-sm">Progress {form.progress}%</label>
        <input type="range" className="mt-2 w-full" min={0} max={100} value={form.progress} onChange={(e) => setForm((v) => ({ ...v, progress: Number(e.target.value) }))} />
        <button className="primary-button mt-4 w-full" type="submit"><Plus className="h-4 w-4" /> Save milestone</button>
      </form>
      <div className="lux-stack">
        {sortByDateAsc(dreams, (item) => item.target).map((item) => {
          const parts = getCountdownParts(item.target, new Date())
          return (
            <article key={item.id} className="lux-card">
              <h3>{item.title}</h3>
              <p className="body-muted mt-2">{formatDateTime(item.target)}</p>
              <div className="lux-progress mt-3">
                <span style={{ width: `${item.progress}%` }} />
              </div>
              <p className="lux-count mt-3">
                {parts.days}d {parts.hours}h {parts.minutes}m {parts.seconds}s
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function VaultSection({ vault, setVault }) {
  const [form, setForm] = useState({ subject: '', message: '', photo: '', locked: true })
  const add = (event) => {
    event.preventDefault()
    if (!form.subject.trim() || !form.message.replace(/<[^>]+>/g, '').trim()) return
    setVault((items) => [{ id: createId('vault'), ...form, createdAt: new Date().toISOString() }, ...items])
    setForm({ subject: '', message: '', photo: '', locked: true })
  }

  return (
    <section className="lux-grid two-col scroll-anchor">
      <form className="lux-card" onSubmit={add}>
        <h3>Write Secret Letter</h3>
        <input className="input-field" placeholder="Subject" value={form.subject} onChange={(e) => setForm((v) => ({ ...v, subject: e.target.value }))} />
        <label className="mt-3 inline-flex items-center gap-2 body-secondary text-sm">
          <input type="checkbox" checked={form.locked} onChange={(e) => setForm((v) => ({ ...v, locked: e.target.checked }))} />
          Lock until opened
        </label>
        <div className="mt-3">
          <RichTextEditor label="Message" value={form.message} onChange={(value) => setForm((v) => ({ ...v, message: value }))} placeholder="Write from your heart..." />
        </div>
        <div className="mt-3">
          <ImageUploadField label="Attachment" value={form.photo} onChange={(value) => setForm((v) => ({ ...v, photo: value }))} />
        </div>
        <button className="primary-button mt-4 w-full" type="submit"><Plus className="h-4 w-4" /> Send</button>
      </form>
      <div className="lux-stack">
        {vault.map((item) => (
          <article key={item.id} className="lux-card">
            <p className="section-label">{formatDateTime(item.createdAt)}</p>
            <h3 className="mt-2">{item.subject}</h3>
            {item.photo && <img src={item.photo} alt={item.subject} className="lux-image mt-3" />}
            {item.locked ? (
              <button type="button" onClick={() => setVault((list) => list.map((row) => row.id === item.id ? { ...row, locked: false } : row))} className="secondary-button mt-3">
                <MessageSquareHeart className="h-4 w-4" /> Open letter
              </button>
            ) : (
              <div className="rich-content body-secondary mt-3" dangerouslySetInnerHTML={{ __html: item.message }} />
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function PlaylistSection({ playlist, setPlaylist, now }) {
  const [form, setForm] = useState({ title: '', artist: '', link: '' })
  const add = (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.artist.trim()) return
    setPlaylist((items) => [{ id: createId('track'), ...form, createdAt: now.toISOString() }, ...items])
    setForm({ title: '', artist: '', link: '' })
  }
  return (
    <section className="lux-grid two-col scroll-anchor">
      <form className="lux-card" onSubmit={add}>
        <h3>Add Song To Your Story</h3>
        <input className="input-field" placeholder="Song title" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
        <input className="input-field mt-3" placeholder="Artist" value={form.artist} onChange={(e) => setForm((v) => ({ ...v, artist: e.target.value }))} />
        <input className="input-field mt-3" placeholder="Spotify/YouTube link (optional)" value={form.link} onChange={(e) => setForm((v) => ({ ...v, link: e.target.value }))} />
        <button className="primary-button mt-4 w-full" type="submit"><Plus className="h-4 w-4" /> Add track</button>
      </form>
      <div className="lux-stack">
        {playlist.map((item) => (
          <article key={item.id} className="lux-card">
            <h3>{item.title}</h3>
            <p className="body-muted mt-2">{item.artist}</p>
            <p className="section-label mt-3">{formatDateTime(item.createdAt)}</p>
            {item.link && (
              <a className="lux-link mt-3 inline-block" href={item.link} target="_blank" rel="noreferrer">
                Open song link
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default App
