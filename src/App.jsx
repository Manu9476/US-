import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpenText,
  CalendarRange,
  CheckCircle2,
  Heart,
  LayoutDashboard,
  MessageSquareText,
  Moon,
  Music4,
  Pencil,
  Plus,
  Save,
  Shuffle,
  Sun,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import { ImageUploadField } from './components/ImageUploadField'
import { RichTextEditor } from './components/RichTextEditor'
import { SyncBadge, SyncPanel } from './components/SyncPanel'
import { LOVE_QUOTES } from './data/constants'
import { useLocalStorageState } from './hooks/useLocalStorageState'
import { useNow } from './hooks/useNow'
import { useSupabaseWorkspace } from './hooks/useSupabaseWorkspace'
import {
  createId,
  formatDate,
  formatDateTime,
  getCountdownParts,
  getDaysTogether,
  sortByDateAsc,
} from './lib/utils'
import { MemoriesSection } from './sections/MemoriesSection'

const navItems = [
  { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'timeline', label: 'Story', icon: BookOpenText },
  { id: 'date-lab', label: 'Dates', icon: CalendarRange },
  { id: 'dream-board', label: 'Goals', icon: Target },
  { id: 'notes', label: 'Notes', icon: MessageSquareText },
  { id: 'playlist', label: 'Music', icon: Music4 },
]

const initialProfile = { one: 'Partner One', two: 'Partner Two', since: '2024-01-01', photoUrl: '' }
const dateIdeas = [
  'Dinner at a new place nearby',
  'Coffee walk and a shared playlist',
  'Movie night with phones away',
  'Cook one new recipe together',
  'Morning walk and photo stop',
]

const timelineMoodMap = {
  romantic: 'giddy',
  adventure: 'wild',
  cozy: 'cozy',
}

function PageHeader({ eyebrow, title, summary }) {
  return (
    <div className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {summary ? <p className="page-summary">{summary}</p> : null}
    </div>
  )
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      <p className="body-muted">{text}</p>
    </div>
  )
}

function AuthAccessPage({ isLightTheme, isLoading = false, setTheme, sync }) {
  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-orange" />
      <div className="auth-orb auth-orb-purple" />

      <header className="auth-header">
        <div className="brand-mark auth-brand">
          <span className="brand-icon">
            <Heart className="h-4 w-4" />
          </span>
          <span>Us+</span>
        </div>

        <button
          type="button"
          className={`theme-toggle ${isLightTheme ? 'theme-toggle-light' : ''}`}
          aria-label={`Switch to ${isLightTheme ? 'dark' : 'light'} theme`}
          aria-pressed={isLightTheme}
          onClick={() => setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))}
        >
          <span className="theme-toggle-icon">
            {isLightTheme ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </span>
          <span>Light</span>
        </button>
      </header>

      <main className="auth-shell">
        <section className="auth-copy">
          <p className="eyebrow">Private couple space</p>
          <h1>Sign in to open your shared Us+ world.</h1>
          <p className="page-summary">
            Your memories, photos, notes, dates, goals, and playlist stay behind one shared account so both devices show the same story.
          </p>

          <div className="auth-feature-grid">
            <div className="auth-feature-card">
              <span>01</span>
              <p>One couple account for both of you.</p>
            </div>
            <div className="auth-feature-card">
              <span>02</span>
              <p>Cloud photos stored through Supabase.</p>
            </div>
            <div className="auth-feature-card">
              <span>03</span>
              <p>Identical updates across every device.</p>
            </div>
          </div>
        </section>

        {isLoading ? (
          <article className="sync-panel auth-panel-card">
            <div className="sync-icon">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="eyebrow">Opening</p>
              <h2>Checking your private session</h2>
              <p className="body-muted">One tiny second while Us+ finds out if you are already signed in.</p>
            </div>
          </article>
        ) : (
          <div className="auth-panel-card">
            <SyncPanel
              authMessage={sync.authMessage}
              isConfigured={sync.isConfigured}
              session={sync.session}
              signIn={sync.signIn}
              signOut={sync.signOut}
              signUp={sync.signUp}
              syncMessage={sync.syncMessage}
              syncStatus={sync.syncStatus}
            />
          </div>
        )}
      </main>
    </div>
  )
}

function App() {
  const now = useNow(1000)
  const [tab, setTab] = useState('home')
  const [profile, setProfile] = useLocalStorageState('us-plus-premium-profile', initialProfile)
  const [timeline, setTimeline] = useLocalStorageState('us-plus-premium-timeline', [])
  const [dates, setDates] = useLocalStorageState('us-plus-premium-dates', [])
  const [dreams, setDreams] = useLocalStorageState('us-plus-premium-dreams', [])
  const [notes, setNotes] = useLocalStorageState('us-plus-premium-vault', [])
  const [playlist, setPlaylist] = useLocalStorageState('us-plus-premium-playlist', [])
  const [theme, setTheme] = useLocalStorageState('us-plus-theme', 'dark')
  const [idea, setIdea] = useState(dateIdeas[0])
  const sync = useSupabaseWorkspace({
    profile,
    timeline,
    dates,
    dreams,
    notes,
    playlist,
    setProfile,
    setTimeline,
    setDates,
    setDreams,
    setNotes,
    setPlaylist,
  })

  const days = getDaysTogether(profile.since, now)
  const quote = LOVE_QUOTES[now.getDate() % LOVE_QUOTES.length]

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

  const topDream = useMemo(() => [...dreams].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))[0], [dreams])
  const isLightTheme = theme === 'light'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  if (sync.isConfigured && !sync.authReady) {
    return (
      <AuthAccessPage
        isLightTheme={isLightTheme}
        isLoading
        setTheme={setTheme}
        sync={sync}
      />
    )
  }

  if (sync.isConfigured && !sync.session) {
    return (
      <AuthAccessPage
        isLightTheme={isLightTheme}
        setTheme={setTheme}
        sync={sync}
      />
    )
  }

  return (
    <div className="app-ui">
      <header className="app-header">
        <button type="button" className="brand-mark" onClick={() => setTab('home')}>
          <span className="brand-icon">
            <Heart className="h-4 w-4" />
          </span>
          <span>Us+</span>
        </button>

        <nav className="app-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = tab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`nav-tab ${isActive ? 'nav-tab-active' : ''}`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="header-actions">
          <SyncBadge
            isConfigured={sync.isConfigured}
            session={sync.session}
            syncStatus={sync.syncStatus}
          />

          <button
            type="button"
            className={`theme-toggle ${isLightTheme ? 'theme-toggle-light' : ''}`}
            aria-label={`Switch to ${isLightTheme ? 'dark' : 'light'} theme`}
            aria-pressed={isLightTheme}
            onClick={() => setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))}
          >
            <span className="theme-toggle-icon">
              {isLightTheme ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </span>
            <span>Light</span>
          </button>

          <div className="partner-chip">
            {profile.one} + {profile.two}
          </div>
        </div>
      </header>

      <main className="app-main">
        {tab === 'home' && (
          <DashboardSection
            days={days}
            profile={profile}
            quote={quote}
            upcomingDate={upcomingDates[0]}
            topDream={topDream}
            timelineCount={timeline.length}
            notesCount={notes.length}
            setProfile={setProfile}
            sync={sync}
            uploadImage={sync.uploadImage}
          />
        )}

        {tab === 'timeline' && (
          <MemoriesSection
            id="timeline"
            memories={timelineMemories}
            partners={{ partnerOne: profile.one, partnerTwo: profile.two }}
            onUploadPhoto={sync.uploadImage}
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
            onDeleteMemory={(memoryId) =>
              setTimeline((items) => items.filter((item) => item.id !== memoryId))
            }
            onUpdateMemory={(memoryId, memory) =>
              setTimeline((items) =>
                items.map((item) =>
                  item.id === memoryId
                    ? {
                        ...item,
                        ...memory,
                        photo: memory.photoUrl,
                        photoUrl: memory.photoUrl,
                        updatedAt: new Date().toISOString(),
                      }
                    : item,
                ),
              )
            }
          />
        )}

        {tab === 'date-lab' && (
          <DateSection
            dates={dates}
            idea={idea}
            onShuffleIdea={() => setIdea(dateIdeas[Math.floor(Math.random() * dateIdeas.length)])}
            setDates={setDates}
            onUploadPhoto={sync.uploadImage}
          />
        )}

        {tab === 'dream-board' && <GoalsSection dreams={dreams} setDreams={setDreams} />}
        {tab === 'notes' && <NotesSection notes={notes} setNotes={setNotes} onUploadPhoto={sync.uploadImage} />}
        {tab === 'playlist' && <MusicSection now={now} playlist={playlist} setPlaylist={setPlaylist} />}
      </main>
    </div>
  )
}

function DashboardSection({
  days,
  profile,
  quote,
  upcomingDate,
  topDream,
  timelineCount,
  notesCount,
  setProfile,
  sync,
  uploadImage,
}) {
  const couplePhotoInputRef = useRef(null)
  const [photoStatus, setPhotoStatus] = useState('')

  const handleCouplePhotoChange = async (event) => {
    const [file] = event.target.files || []

    if (!file || !file.type.startsWith('image/')) {
      return
    }

    try {
      setPhotoStatus('Uploading picture...')
      const photoUrl = await uploadImage(file)
      setProfile((currentProfile) => ({ ...currentProfile, photoUrl }))
      setPhotoStatus('')
    } catch (error) {
      setPhotoStatus(error.message || 'Picture upload failed.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <section className="app-page dashboard-page">
      <article className="couple-card">
        <div className="couple-photo-frame">
          {profile.photoUrl ? (
            <img
              className="couple-photo"
              src={profile.photoUrl}
              alt={`${profile.one} and ${profile.two}`}
            />
          ) : (
            <div className="couple-photo-placeholder">
              <Heart className="h-10 w-10" />
            </div>
          )}
          <button
            type="button"
            className="couple-upload-button"
            disabled={photoStatus === 'Uploading picture...'}
            onClick={() => couplePhotoInputRef.current?.click()}
          >
            {photoStatus === 'Uploading picture...' ? 'Uploading' : profile.photoUrl ? 'Change picture' : 'Add picture'}
          </button>
          <input
            ref={couplePhotoInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleCouplePhotoChange}
          />
        </div>
        <div className="couple-names">
          <h1>{profile.one} + {profile.two}</h1>
          <p className="body-muted">Together since {formatDate(profile.since)}</p>
          {photoStatus && photoStatus !== 'Uploading picture...' ? <p className="field-error">{photoStatus}</p> : null}
        </div>
      </article>

      <SyncPanel
        authMessage={sync.authMessage}
        isConfigured={sync.isConfigured}
        session={sync.session}
        signIn={sync.signIn}
        signOut={sync.signOut}
        signUp={sync.signUp}
        syncMessage={sync.syncMessage}
        syncStatus={sync.syncStatus}
      />

      <PageHeader
        eyebrow="Dashboard"
        title="A simple place for both of you"
        summary="Update your shared details, check what is next, and keep the important pieces organized."
      />

      <div className="dashboard-grid">
        <article className="metric-card metric-card-large">
          <span className="metric-label">Days together</span>
          <strong>{days}</strong>
          <p className="body-muted">Since {formatDate(profile.since)}</p>
        </article>

        <article className="metric-card">
          <span className="metric-label">Story entries</span>
          <strong>{timelineCount}</strong>
        </article>

        <article className="metric-card">
          <span className="metric-label">Notes</span>
          <strong>{notesCount}</strong>
        </article>

        <article className="tool-panel profile-panel">
          <h2>Profile</h2>
          <div className="field-grid">
            <label>
              <span>First partner</span>
              <input
                className="input-field"
                value={profile.one}
                onChange={(event) => setProfile((value) => ({ ...value, one: event.target.value }))}
              />
            </label>
            <label>
              <span>Second partner</span>
              <input
                className="input-field"
                value={profile.two}
                onChange={(event) => setProfile((value) => ({ ...value, two: event.target.value }))}
              />
            </label>
            <label>
              <span>Start date</span>
              <input
                type="date"
                className="input-field"
                value={profile.since}
                onChange={(event) => setProfile((value) => ({ ...value, since: event.target.value }))}
              />
            </label>
          </div>
          <ImageUploadField
            label="Couple picture"
            value={profile.photoUrl ?? ''}
            onChange={(value) => setProfile((currentProfile) => ({ ...currentProfile, photoUrl: value }))}
            onUploadFile={uploadImage}
          />
        </article>

        <article className="info-panel">
          <span className="metric-label">Next date</span>
          {upcomingDate ? (
            <>
              <h2>{upcomingDate.title}</h2>
              <p className="body-muted">{formatDateTime(upcomingDate.when)}</p>
            </>
          ) : (
            <p className="body-muted">No date is planned yet.</p>
          )}
        </article>

        <article className="info-panel">
          <span className="metric-label">Top goal</span>
          {topDream ? (
            <>
              <h2>{topDream.title}</h2>
              <div className="progress-track mt-3">
                <span style={{ width: `${topDream.progress}%` }} />
              </div>
            </>
          ) : (
            <p className="body-muted">No goal has been added yet.</p>
          )}
        </article>

        <article className="quote-panel">
          <span className="metric-label">Today</span>
          <p>"{quote}"</p>
        </article>
      </div>
    </section>
  )
}

function DateSection({ dates, setDates, idea, onShuffleIdea, onUploadPhoto }) {
  const [form, setForm] = useState({ title: '', when: '', place: '', note: '', photo: '' })
  const [editingId, setEditingId] = useState(null)
  const ordered = sortByDateAsc(dates, (item) => item.when)

  const add = (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.when || !form.place.trim()) return

    if (editingId) {
      setDates((items) =>
        items.map((item) =>
          item.id === editingId ? { ...item, ...form, updatedAt: new Date().toISOString() } : item,
        ),
      )
      setEditingId(null)
    } else {
      setDates((items) => [...items, { id: createId('date'), ...form }])
    }

    setForm({ title: '', when: '', place: '', note: '', photo: '' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ title: '', when: '', place: '', note: '', photo: '' })
  }

  const editDate = (datePlan) => {
    setEditingId(datePlan.id)
    setForm({
      title: datePlan.title ?? '',
      when: datePlan.when ?? '',
      place: datePlan.place ?? '',
      note: datePlan.note ?? '',
      photo: datePlan.photo ?? '',
    })
  }

  return (
    <section className="app-page">
      <PageHeader eyebrow="Dates" title="Plans" summary="Keep upcoming plans clear and easy to revisit." />

      <div className="workspace-grid">
        <form className="tool-panel" onSubmit={add}>
          <div className="panel-head">
            <h2>{editingId ? 'Edit plan' : 'New plan'}</h2>
            <button type="button" onClick={onShuffleIdea} className="secondary-button icon-button" aria-label="Suggest idea">
              <Shuffle className="h-4 w-4" />
            </button>
          </div>
          <p className="body-muted">Idea: {idea}</p>
          <div className="field-grid">
            <input className="input-field" placeholder="Date title" value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} />
            <input type="datetime-local" className="input-field" value={form.when} onChange={(event) => setForm((value) => ({ ...value, when: event.target.value }))} />
            <input className="input-field" placeholder="Location" value={form.place} onChange={(event) => setForm((value) => ({ ...value, place: event.target.value }))} />
          </div>
          <RichTextEditor label="Notes" value={form.note} onChange={(value) => setForm((current) => ({ ...current, note: value }))} placeholder="Details, timing, reservation info..." />
          <ImageUploadField
            label="Photo"
            value={form.photo}
            onChange={(value) => setForm((current) => ({ ...current, photo: value }))}
            onUploadFile={onUploadPhoto}
          />
          <div className="form-actions">
            <button className="primary-button" type="submit">
              {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? 'Save changes' : 'Save plan'}
            </button>
            {editingId ? (
              <button type="button" className="secondary-button" onClick={cancelEdit}>
                <X className="h-4 w-4" /> Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="list-panel">
          {ordered.length ? (
            ordered.map((item) => (
              <article key={item.id} className="item-card">
                <div className="item-card-header">
                  <div>
                    <h3>{item.title}</h3>
                    <p className="body-muted">{formatDateTime(item.when)} - {item.place}</p>
                  </div>
                  <div className="card-actions">
                    <CheckCircle2 className="h-5 w-5 accent-text" />
                    <button type="button" className="icon-action" aria-label={`Edit ${item.title}`} onClick={() => editDate(item)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="icon-action destructive-action"
                      aria-label={`Delete ${item.title}`}
                      onClick={() => {
                        setDates((list) => list.filter((datePlan) => datePlan.id !== item.id))
                        if (editingId === item.id) cancelEdit()
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {item.photo ? <img src={item.photo} alt={item.title} className="item-image" /> : null}
                {item.note ? <div className="rich-content body-secondary" dangerouslySetInnerHTML={{ __html: item.note }} /> : null}
              </article>
            ))
          ) : (
            <EmptyState title="No plans yet" text="Add the next date when you are ready." />
          )}
        </div>
      </div>
    </section>
  )
}

function GoalsSection({ dreams, setDreams }) {
  const [form, setForm] = useState({ title: '', target: '', progress: 10 })
  const [editingId, setEditingId] = useState(null)
  const orderedGoals = sortByDateAsc(dreams, (item) => item.target)

  const add = (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.target) return

    if (editingId) {
      setDreams((items) =>
        items.map((item) =>
          item.id === editingId ? { ...item, ...form, updatedAt: new Date().toISOString() } : item,
        ),
      )
      setEditingId(null)
    } else {
      setDreams((items) => [...items, { id: createId('dream'), ...form }])
    }

    setForm({ title: '', target: '', progress: 10 })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ title: '', target: '', progress: 10 })
  }

  const editGoal = (goal) => {
    setEditingId(goal.id)
    setForm({
      title: goal.title ?? '',
      target: goal.target ?? '',
      progress: goal.progress ?? 0,
    })
  }

  return (
    <section className="app-page">
      <PageHeader eyebrow="Goals" title="Shared goals" summary="Track trips, milestones, and things you are building toward." />

      <div className="workspace-grid">
        <form className="tool-panel" onSubmit={add}>
          <h2>{editingId ? 'Edit goal' : 'New goal'}</h2>
          <div className="field-grid">
            <input className="input-field" placeholder="Weekend trip" value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} />
            <input type="datetime-local" className="input-field" value={form.target} onChange={(event) => setForm((value) => ({ ...value, target: event.target.value }))} />
            <label className="range-field">
              <span>Progress {form.progress}%</span>
              <input type="range" min={0} max={100} value={form.progress} onChange={(event) => setForm((value) => ({ ...value, progress: Number(event.target.value) }))} />
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit">
              {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? 'Save changes' : 'Save goal'}
            </button>
            {editingId ? (
              <button type="button" className="secondary-button" onClick={cancelEdit}>
                <X className="h-4 w-4" /> Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="list-panel">
          {orderedGoals.length ? (
            orderedGoals.map((item) => {
              const parts = getCountdownParts(item.target, new Date())

              return (
                <article key={item.id} className="item-card">
                  <div className="item-card-header">
                    <div>
                      <h3>{item.title}</h3>
                      <p className="body-muted">{formatDateTime(item.target)}</p>
                    </div>
                    <div className="card-actions">
                      <span className="count-pill">{parts.days}d</span>
                      <button type="button" className="icon-action" aria-label={`Edit ${item.title}`} onClick={() => editGoal(item)}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="icon-action destructive-action"
                        aria-label={`Delete ${item.title}`}
                        onClick={() => {
                          setDreams((list) => list.filter((goal) => goal.id !== item.id))
                          if (editingId === item.id) cancelEdit()
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${item.progress}%` }} />
                  </div>
                  <p className="body-muted">{parts.days} days, {parts.hours} hours, {parts.minutes} minutes</p>
                </article>
              )
            })
          ) : (
            <EmptyState title="No goals yet" text="Add a goal to start tracking progress." />
          )}
        </div>
      </div>
    </section>
  )
}

function NotesSection({ notes, setNotes, onUploadPhoto }) {
  const [form, setForm] = useState({ subject: '', message: '', photo: '', locked: true })
  const [editingId, setEditingId] = useState(null)

  const add = (event) => {
    event.preventDefault()
    if (!form.subject.trim() || !form.message.replace(/<[^>]+>/g, '').trim()) return

    if (editingId) {
      setNotes((items) =>
        items.map((item) =>
          item.id === editingId ? { ...item, ...form, updatedAt: new Date().toISOString() } : item,
        ),
      )
      setEditingId(null)
    } else {
      setNotes((items) => [{ id: createId('note'), ...form, createdAt: new Date().toISOString() }, ...items])
    }

    setForm({ subject: '', message: '', photo: '', locked: true })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ subject: '', message: '', photo: '', locked: true })
  }

  const editNote = (note) => {
    setEditingId(note.id)
    setForm({
      subject: note.subject ?? '',
      message: note.message ?? '',
      photo: note.photo ?? '',
      locked: note.locked ?? false,
    })
  }

  return (
    <section className="app-page">
      <PageHeader eyebrow="Notes" title="Shared notes" summary="Leave messages and choose whether they appear now or stay hidden until opened." />

      <div className="workspace-grid">
        <form className="tool-panel" onSubmit={add}>
          <h2>{editingId ? 'Edit note' : 'New note'}</h2>
          <input className="input-field" placeholder="Subject" value={form.subject} onChange={(event) => setForm((value) => ({ ...value, subject: event.target.value }))} />
          <label className="check-field">
            <input type="checkbox" checked={form.locked} onChange={(event) => setForm((value) => ({ ...value, locked: event.target.checked }))} />
            <span>Keep hidden until opened</span>
          </label>
          <RichTextEditor label="Message" value={form.message} onChange={(value) => setForm((current) => ({ ...current, message: value }))} placeholder="Write the note..." />
          <ImageUploadField
            label="Attachment"
            value={form.photo}
            onChange={(value) => setForm((current) => ({ ...current, photo: value }))}
            onUploadFile={onUploadPhoto}
          />
          <div className="form-actions">
            <button className="primary-button" type="submit">
              {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? 'Save changes' : 'Save note'}
            </button>
            {editingId ? (
              <button type="button" className="secondary-button" onClick={cancelEdit}>
                <X className="h-4 w-4" /> Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="list-panel">
          {notes.length ? (
            notes.map((item) => (
              <article key={item.id} className="item-card">
                <div className="item-card-header">
                  <div>
                    <h3>{item.subject}</h3>
                    <p className="body-muted">{formatDateTime(item.createdAt)}</p>
                  </div>
                  <div className="card-actions">
                    <span className={item.locked ? 'status-pill' : 'status-pill status-pill-open'}>{item.locked ? 'Hidden' : 'Open'}</span>
                    <button type="button" className="icon-action" aria-label={`Edit ${item.subject}`} onClick={() => editNote(item)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="icon-action destructive-action"
                      aria-label={`Delete ${item.subject}`}
                      onClick={() => {
                        setNotes((list) => list.filter((note) => note.id !== item.id))
                        if (editingId === item.id) cancelEdit()
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {item.photo ? <img src={item.photo} alt={item.subject} className="item-image" /> : null}
                {item.locked ? (
                  <button type="button" onClick={() => setNotes((list) => list.map((row) => row.id === item.id ? { ...row, locked: false } : row))} className="secondary-button">
                    <MessageSquareText className="h-4 w-4" /> Open note
                  </button>
                ) : (
                  <div className="rich-content body-secondary" dangerouslySetInnerHTML={{ __html: item.message }} />
                )}
              </article>
            ))
          ) : (
            <EmptyState title="No notes yet" text="Add the first note from the form." />
          )}
        </div>
      </div>
    </section>
  )
}

function MusicSection({ playlist, setPlaylist, now }) {
  const [form, setForm] = useState({ title: '', artist: '', link: '' })
  const [editingId, setEditingId] = useState(null)

  const add = (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.artist.trim()) return

    if (editingId) {
      setPlaylist((items) =>
        items.map((item) =>
          item.id === editingId ? { ...item, ...form, updatedAt: now.toISOString() } : item,
        ),
      )
      setEditingId(null)
    } else {
      setPlaylist((items) => [{ id: createId('track'), ...form, createdAt: now.toISOString() }, ...items])
    }

    setForm({ title: '', artist: '', link: '' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ title: '', artist: '', link: '' })
  }

  const editTrack = (track) => {
    setEditingId(track.id)
    setForm({
      title: track.title ?? '',
      artist: track.artist ?? '',
      link: track.link ?? '',
    })
  }

  return (
    <section className="app-page">
      <PageHeader eyebrow="Music" title="Playlist" summary="Collect songs attached to your memories and plans." />

      <div className="workspace-grid">
        <form className="tool-panel" onSubmit={add}>
          <h2>{editingId ? 'Edit song' : 'New song'}</h2>
          <div className="field-grid">
            <input className="input-field" placeholder="Song title" value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} />
            <input className="input-field" placeholder="Artist" value={form.artist} onChange={(event) => setForm((value) => ({ ...value, artist: event.target.value }))} />
            <input className="input-field" placeholder="Spotify or YouTube link" value={form.link} onChange={(event) => setForm((value) => ({ ...value, link: event.target.value }))} />
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit">
              {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? 'Save changes' : 'Add song'}
            </button>
            {editingId ? (
              <button type="button" className="secondary-button" onClick={cancelEdit}>
                <X className="h-4 w-4" /> Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="list-panel">
          {playlist.length ? (
            playlist.map((item) => (
              <article key={item.id} className="item-card">
                <div className="item-card-header">
                  <div>
                    <h3>{item.title}</h3>
                    <p className="body-muted">{item.artist}</p>
                  </div>
                  <div className="card-actions">
                    <Music4 className="h-5 w-5 accent-text" />
                    <button type="button" className="icon-action" aria-label={`Edit ${item.title}`} onClick={() => editTrack(item)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="icon-action destructive-action"
                      aria-label={`Delete ${item.title}`}
                      onClick={() => {
                        setPlaylist((list) => list.filter((track) => track.id !== item.id))
                        if (editingId === item.id) cancelEdit()
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="body-muted">{formatDateTime(item.createdAt)}</p>
                {item.link ? (
                  <a className="app-link" href={item.link} target="_blank" rel="noreferrer">
                    Open link
                  </a>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState title="No songs yet" text="Add songs you want to keep together." />
          )}
        </div>
      </div>
    </section>
  )
}

export default App
