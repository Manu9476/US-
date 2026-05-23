import { useEffect, useMemo, useState } from 'react'
import {
  BookOpenText,
  CalendarRange,
  CheckCircle2,
  Cloud,
  FileText,
  Heart,
  Images,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Menu,
  Moon,
  Music4,
  Pencil,
  Plus,
  Save,
  Settings as SettingsIcon,
  Shuffle,
  ShieldCheck,
  Sun,
  Target,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { ImageUploadField } from './components/ImageUploadField'
import { RichTextEditor } from './components/RichTextEditor'
import { SyncPanel } from './components/SyncPanel'
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
  { id: 'gallery', label: 'Gallery', icon: Images },
  { id: 'timeline', label: 'Story', icon: BookOpenText },
  { id: 'date-lab', label: 'Dates', icon: CalendarRange },
  { id: 'dream-board', label: 'Goals', icon: Target },
  { id: 'notes', label: 'Notes', icon: MessageSquareText },
  { id: 'playlist', label: 'Music', icon: Music4 },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

const legalNavItems = [
  { id: 'terms', label: 'Terms', icon: FileText },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
]

const initialProfile = { one: 'Partner One', two: 'Partner Two', since: '2024-01-01', photoUrl: '' }
const dateIdeas = [
  'Dinner at a new place nearby',
  'Coffee walk and a shared playlist',
  'Movie night with phones away',
  'Cook one new recipe together',
  'Morning walk and photo stop',
]

const URGENT_REMINDER_MS = 24 * 60 * 60 * 1000

function getFutureDifference(value, now) {
  const target = new Date(value)

  if (Number.isNaN(target.getTime())) {
    return null
  }

  const difference = target.getTime() - now.getTime()

  return difference >= 0 ? difference : null
}

function formatReminderCountdown(differenceMs) {
  const totalMinutes = Math.max(1, Math.ceil(differenceMs / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return hours ? `${hours}h ${minutes}m left` : `${minutes}m left`
}

const timelineMoodMap = {
  romantic: 'giddy',
  adventure: 'wild',
  cozy: 'cozy',
}

const legalDocuments = {
  terms: {
    eyebrow: 'Terms',
    title: 'Terms of Use',
    summary:
      'An intentionally long, formal, and slightly exhausting set of house rules for using Us+. This is product policy copy and not a replacement for lawyer-reviewed legal documents.',
    updated: 'May 23, 2026',
    sections: [
      {
        title: '1. Acceptance of these terms',
        body:
          'By opening, browsing, signing in to, storing information inside, uploading photos to, writing notes in, or otherwise using Us+, you agree to behave as though you have read every single sentence of these Terms, even the parts that feel like they were written by a committee trapped in a conference room with unlimited coffee. If you do not agree, your remedy is to stop using the application, close the tab, and maybe go drink water.',
      },
      {
        title: '2. Purpose of the service',
        body:
          'Us+ is intended to be a private digital space for a couple to organize memories, dates, notes, shared goals, photos, and small emotional artifacts. It is not a bank, therapist, lawyer, emergency service, medical tool, government registry, official relationship certification authority, or replacement for actually talking kindly to each other when something matters.',
      },
      {
        title: '3. Shared account responsibility',
        body:
          'A shared couple account means both people using the same login may access the same stored content. You are responsible for deciding who knows the email and password, who may open the account, who may upload or delete things, and whether sharing those credentials is emotionally wise, practically wise, or likely to cause a dramatic conversation at 1:17 AM.',
      },
      {
        title: '4. Content you add',
        body:
          'You keep ownership of the memories, notes, photos, plans, song links, and other content you add to Us+. By uploading or saving content, you give the app permission to store, display, sync, process, and retrieve that content for the limited purpose of making the product work across your signed-in devices.',
      },
      {
        title: '5. Content standards',
        body:
          'You agree not to upload content that is unlawful, abusive, harassing, invasive, malicious, exploitative, or intentionally harmful. You also agree not to use the app to store secrets that would create serious risk if viewed by the other account holder, because a shared love space is a charming idea but not a classified evidence locker.',
      },
      {
        title: '6. Photos and uploads',
        body:
          'Photos uploaded through Us+ may be stored through the configured backend storage service and displayed wherever the app expects that photo to appear, including the profile, gallery, memory cards, date plans, or notes. You are responsible for making sure you have the right to upload the photo and that the people in the photo would not be reasonably furious about it being stored there.',
      },
      {
        title: '7. Local and cloud behavior',
        body:
          'When cloud sync is configured and you are signed in, Us+ attempts to store and retrieve your workspace data from the backend so different devices can show matching information. When cloud sync is not available, interrupted, misconfigured, or otherwise having a tiny technological tantrum, some information may remain local to the device until sync works again.',
      },
      {
        title: '8. Availability',
        body:
          'Us+ may be unavailable, slow, interrupted, redesigned, redeployed, updated, or temporarily confused. We do not promise that the app will be available every second of every day, that all browser extensions will behave themselves, or that every network request will glide through the internet like a swan.',
      },
      {
        title: '9. No warranty',
        body:
          'The app is provided as is and as available, without warranties of perfection, romance, uptime, relationship success, permanent storage, flawless syncing, bug-free rendering, or universal emotional satisfaction. Use it because it is useful and lovely, not because a paragraph promised it would become legally magical.',
      },
      {
        title: '10. Limitation of liability',
        body:
          'To the fullest extent allowed by applicable law, Us+, its creator, maintainers, helpers, deployers, and enthusiastic future refactorers will not be responsible for indirect, incidental, consequential, special, exemplary, emotional, nostalgic, or unusually poetic damages arising from your use of the app.',
      },
      {
        title: '11. Account security',
        body:
          'You should use a strong password, avoid sharing it outside the intended couple account, and sign out on devices you do not control. If someone else gains access because credentials were shared, guessed, saved in a suspicious browser, photographed on a sticky note, or whispered to the wrong person, that is outside the app’s control.',
      },
      {
        title: '12. Changes to the service',
        body:
          'Features may be added, changed, renamed, moved into sidebars, polished, simplified, expanded, made prettier, or removed. The app may evolve from a tiny romantic dashboard into a more structured private workspace, and continued use after changes means you accept the updated experience.',
      },
      {
        title: '13. Termination and deletion',
        body:
          'You may stop using the app at any time. Depending on how the backend is configured, deleting stored data may require deleting entries inside the app, clearing local storage, removing uploaded files, or deleting the backend account or workspace data from the service provider dashboard.',
      },
      {
        title: '14. The very long clause about reasonable expectations',
        body:
          'You agree to use reasonable judgment when relying on a small web app built for memories and planning. If a date plan disappears, a note is edited, a song link fails, a photo loads slowly, or a counter seems emotionally dramatic, you agree that the correct first response is calm troubleshooting rather than declaring the entire internet ruined.',
      },
      {
        title: '15. Contact and creator credit',
        body:
          'Us+ was created by Manu. Any questions, improvement ideas, bug reports, compliments, suspiciously specific complaints, or requests for even longer policy language should be directed through the channel where the app is being built or maintained.',
      },
    ],
  },
  privacy: {
    eyebrow: 'Privacy',
    title: 'Privacy Policy',
    summary:
      'A very long explanation of what Us+ may store, why it stores it, and how the shared account model works. This is product policy copy and not jurisdiction-specific legal advice.',
    updated: 'May 23, 2026',
    sections: [
      {
        title: '1. Overview',
        body:
          'Us+ is designed to store private couple content such as names, relationship start date, memories, uploaded photos, date plans, goals, notes, and playlist links. The whole point is that both signed-in devices can see the same information, which means privacy depends on the shared account being used only by the intended people.',
      },
      {
        title: '2. Information you provide directly',
        body:
          'The app may store partner names, the relationship start date, written memory titles, memory dates, mood selections, rich text notes, date locations, goal progress, surprise note content, music titles, artists, external links, and any other text you type into fields that look like they are asking you to type something.',
      },
      {
        title: '3. Photos and media',
        body:
          'When you upload images, those images may be stored in the configured storage bucket and referenced by URL inside your workspace data. The app uses those images to display profile pictures, gallery entries, memory images, date photos, and note attachments, which is a fancy way of saying: if you upload it, the app may show it where you asked it to show it.',
      },
      {
        title: '4. Account information',
        body:
          'When Supabase authentication or another backend authentication provider is connected, your account email and authentication session information may be processed by that provider. Us+ displays the signed-in email in the sidebar so the current user can tell which shared account is active.',
      },
      {
        title: '5. Local storage',
        body:
          'The app may use browser localStorage to keep the interface responsive, preserve local fallback data, remember app preferences, or continue functioning when cloud sync is not configured. Local storage lives in the browser on the device, which means clearing browser data may remove local-only information.',
      },
      {
        title: '6. Cloud sync',
        body:
          'When cloud sync is configured, Us+ may save workspace data to a backend database so multiple devices signed into the same account can show identical information. This includes profile data, timeline entries, date plans, goals, notes, playlist entries, and URLs pointing to uploaded photos.',
      },
      {
        title: '7. Why information is used',
        body:
          'Information is used to operate the app, render the interface, sync data between devices, show the gallery, count days together, sort entries by date, display notes, manage uploads, and generally prevent the app from being an empty white rectangle with good intentions but no memory.',
      },
      {
        title: '8. Sharing model',
        body:
          'Us+ is not built around separate private inboxes for each partner unless that is later implemented. The current shared account model means anyone with access to the same account may be able to see, edit, open, delete, or otherwise interact with the same couple workspace content.',
      },
      {
        title: '9. Backend providers',
        body:
          'Data may be processed by the backend services configured for the deployment, such as authentication, database, hosting, and object storage providers. Those providers may maintain their own infrastructure, logs, security systems, retention practices, and policy documents that are much longer than this one, which is impressive and mildly alarming.',
      },
      {
        title: '10. Security',
        body:
          'The app uses access controls provided by the configured backend, such as authentication and row-level security policies, to keep each account’s workspace separate. No system is perfectly secure, so you should still use strong passwords, avoid suspicious devices, and refrain from uploading content that would cause major harm if exposed.',
      },
      {
        title: '11. Retention',
        body:
          'Content may remain stored until it is deleted through the app, removed from backend storage, overwritten by sync, cleared from local storage, or deleted by a project administrator. Backups, caches, logs, and provider-level retention systems may persist for some time depending on the backend provider’s configuration.',
      },
      {
        title: '12. Children and sensitive use',
        body:
          'Us+ is intended for people who can responsibly manage a private shared account. It should not be used to collect information from children, store regulated medical details, preserve government secrets, hold emergency plans as the only source of truth, or manage anything that requires a professional compliance department wearing serious shoes.',
      },
      {
        title: '13. Your choices',
        body:
          'You can choose what to add, edit, or remove. You can avoid uploading photos, use initials instead of full names, delete entries you no longer want, sign out from the sidebar, clear local browser data, or manage/delete backend data through the service provider dashboard if you control the project.',
      },
      {
        title: '14. Changes to this policy',
        body:
          'This Privacy Policy may change when features change, the backend changes, the app becomes more ambitious, or someone decides the current wording is not sufficiently exhausting. Continued use after updates means you understand the updated policy applies to future use.',
      },
      {
        title: '15. Created by Manu',
        body:
          'Us+ was created by Manu as a private, modern couple workspace. The creator credit appears in the app footer because products should have a little signature, and because hiding authorship after all this CSS would be rude.',
      },
    ],
  },
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

function getSyncLabel(syncStatus) {
  if (syncStatus === 'saving') return 'Saving changes'
  if (syncStatus === 'synced') return 'Synced'
  if (syncStatus === 'loading' || syncStatus === 'checking') return 'Loading sync'
  if (syncStatus === 'error') return 'Needs attention'
  if (syncStatus === 'signed-out') return 'Signed out'
  return 'Local mode'
}

function SidebarAccount({ profile, sync }) {
  const accountEmail = sync.session?.user?.email

  return (
    <div className="sidebar-account">
      <div className="sidebar-account-row">
        <div className="sidebar-avatar">
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt={`${profile.one} and ${profile.two}`} />
          ) : (
            <Heart className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="sidebar-account-name">{profile.one} + {profile.two}</p>
          <p className="sidebar-account-email">{accountEmail || 'Local workspace'}</p>
        </div>
      </div>

      <div className="sidebar-sync-card">
        <Cloud className="h-4 w-4" />
        <div>
          <span>{getSyncLabel(sync.syncStatus)}</span>
          <p>{sync.syncMessage}</p>
        </div>
      </div>

      {sync.session?.user ? (
        <button type="button" className="sidebar-signout" onClick={sync.signOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      ) : null}
    </div>
  )
}

function SidebarLegalFooter({ onSelect }) {
  const year = new Date().getFullYear()

  return (
    <div className="sidebar-legal-footer">
      <p>Copyright {year} Us+. Created by Manu.</p>
      <div className="sidebar-legal-links">
        {legalNavItems.map((item) => (
          <button key={item.id} type="button" onClick={() => onSelect(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
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
          aria-label="Light theme active"
          aria-pressed={isLightTheme}
          onClick={() => setTheme('light')}
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [profile, setProfile] = useLocalStorageState('us-plus-premium-profile', initialProfile)
  const [timeline, setTimeline] = useLocalStorageState('us-plus-premium-timeline', [])
  const [dates, setDates] = useLocalStorageState('us-plus-premium-dates', [])
  const [dreams, setDreams] = useLocalStorageState('us-plus-premium-dreams', [])
  const [gallery, setGallery] = useLocalStorageState('us-plus-premium-gallery', [])
  const [notes, setNotes] = useLocalStorageState('us-plus-premium-vault', [])
  const [playlist, setPlaylist] = useLocalStorageState('us-plus-premium-playlist', [])
  const [, setTheme] = useLocalStorageState('us-plus-theme', 'light')
  const [idea, setIdea] = useState(dateIdeas[0])
  const sync = useSupabaseWorkspace({
    profile,
    timeline,
    dates,
    dreams,
    gallery,
    notes,
    playlist,
    setProfile,
    setTimeline,
    setDates,
    setDreams,
    setGallery,
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
  const isLightTheme = true
  const activeLabel =
    navItems.find((item) => item.id === tab)?.label ||
    legalNavItems.find((item) => item.id === tab)?.label ||
    'Us+'
  const galleryItems = useMemo(() => {
    return [...gallery].sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime())
  }, [gallery])

  const dashboardReminders = useMemo(() => {
    const urgentDates = dates.flatMap((datePlan) => {
      const difference = getFutureDifference(datePlan.when, now)

      if (difference === null || difference > URGENT_REMINDER_MS) {
        return []
      }

      return [
        {
          id: `date-${datePlan.id}`,
          label: 'Event',
          title: datePlan.title || 'Upcoming plan',
          meta: `${formatReminderCountdown(difference)}${datePlan.place ? ` at ${datePlan.place}` : ''}`,
          targetTab: 'date-lab',
          sortTime: new Date(datePlan.when).getTime(),
        },
      ]
    })

    const urgentGoals = dreams.flatMap((goal) => {
      const difference = getFutureDifference(goal.target, now)

      if (difference === null || difference > URGENT_REMINDER_MS) {
        return []
      }

      return [
        {
          id: `goal-${goal.id}`,
          label: 'Goal',
          title: goal.title || 'Shared goal',
          meta: `${formatReminderCountdown(difference)} - ${goal.progress ?? 0}% complete`,
          targetTab: 'dream-board',
          sortTime: new Date(goal.target).getTime(),
        },
      ]
    })

    const noteReminders = notes.flatMap((note) => {
      const difference = getFutureDifference(note.reminderAt, now)
      const isDueSoon = difference !== null && difference <= URGENT_REMINDER_MS

      if (!note.locked && !isDueSoon) {
        return []
      }

      return [
        {
          id: `note-${note.id}`,
          label: note.locked ? 'Unread note' : 'Note',
          title: note.subject || 'Hidden note',
          meta: isDueSoon
            ? `${formatReminderCountdown(difference)}`
            : note.createdAt
              ? `Waiting since ${formatDateTime(note.createdAt)}`
              : 'Waiting to be opened',
          targetTab: 'notes',
          sortTime: isDueSoon ? new Date(note.reminderAt).getTime() : Number.MAX_SAFE_INTEGER - 1,
        },
      ]
    })

    const unopenedMusic = playlist
      .filter((track) => track.link && !track.openedAt)
      .map((track) => ({
        id: `track-${track.id}`,
        label: 'Unopened music',
        title: track.title || 'Song link',
        meta: track.artist ? `From ${track.artist}` : 'A link is waiting',
        targetTab: 'playlist',
        sortTime: Number.MAX_SAFE_INTEGER,
      }))

    return [...urgentDates, ...urgentGoals, ...noteReminders, ...unopenedMusic]
      .sort((left, right) => left.sortTime - right.sortTime)
      .slice(0, 8)
  }, [dates, dreams, notes, now, playlist])

  const selectTab = (nextTab) => {
    setTab(nextTab)
    setIsSidebarOpen(false)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = 'light'
  }, [])

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
    <div className="app-ui app-frame">
      <button
        type="button"
        className={`sidebar-scrim ${isSidebarOpen ? 'sidebar-scrim-open' : ''}`}
        aria-label="Close navigation"
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside className={`app-sidebar ${isSidebarOpen ? 'app-sidebar-open' : ''}`} aria-label="Main sidebar">
        <div className="sidebar-head">
          <button type="button" className="brand-mark" onClick={() => selectTab('home')}>
            <span className="brand-icon">
              <Heart className="h-4 w-4" />
            </span>
            <span>Us+</span>
          </button>
          <button type="button" className="icon-action" aria-label="Close sidebar" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = tab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer-stack">
          <SidebarAccount profile={profile} sync={sync} />
          <SidebarLegalFooter onSelect={selectTab} />
        </div>
      </aside>

      <div className="app-content">
        <header className="app-topbar">
          <button type="button" className="menu-button" aria-label="Open navigation" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          <div className="topbar-title">
            <p className="eyebrow">Private space</p>
            <h2>{activeLabel}</h2>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className={`theme-toggle ${isLightTheme ? 'theme-toggle-light' : ''}`}
              aria-label="Light theme active"
              aria-pressed={isLightTheme}
              onClick={() => setTheme('light')}
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
            reminders={dashboardReminders}
            onOpenTab={selectTab}
          />
        )}

        {tab === 'gallery' && (
          <GallerySection
            items={galleryItems}
            setGallery={setGallery}
            onUploadPhoto={sync.uploadImage}
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
        {tab === 'profile' && (
          <ProfileSection
            profile={profile}
            setProfile={setProfile}
            sync={sync}
            uploadImage={sync.uploadImage}
          />
        )}
        {tab === 'settings' && (
          <SettingsSection
            counts={{
              dates: dates.length,
              gallery: galleryItems.length,
              goals: dreams.length,
              memories: timeline.length,
              notes: notes.length,
              songs: playlist.length,
            }}
            isLightTheme={isLightTheme}
            setTheme={setTheme}
            sync={sync}
          />
        )}
        {tab === 'terms' && <LegalSection document={legalDocuments.terms} />}
        {tab === 'privacy' && <LegalSection document={legalDocuments.privacy} />}
        </main>
      </div>
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
  reminders,
  onOpenTab,
}) {
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
        </div>
        <div className="couple-names">
          <h1>{profile.one} + {profile.two}</h1>
          <p className="body-muted">Together since {formatDate(profile.since)}</p>
        </div>
      </article>

      <PageHeader
        eyebrow="Dashboard"
        title="A simple place for both of you"
        summary="Update your shared details, check what is next, and keep the important pieces organized."
      />

      <ReminderPanel reminders={reminders} onOpenTab={onOpenTab} />

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

function ReminderPanel({ reminders, onOpenTab }) {
  if (!reminders.length) {
    return (
      <article className="reminder-panel">
        <div>
          <span className="metric-label">Reminders</span>
          <h2>Nothing urgent right now</h2>
        </div>
        <p className="body-muted">Dates and goals within 24 hours, hidden notes, and unopened music links will appear here.</p>
      </article>
    )
  }

  return (
    <article className="reminder-panel reminder-panel-active" aria-label="Urgent reminders">
      <div className="reminder-panel-head">
        <div>
          <span className="metric-label">Needs attention</span>
          <h2>{reminders.length} red-tag reminder{reminders.length === 1 ? '' : 's'}</h2>
        </div>
        <span className="reminder-count">{reminders.length}</span>
      </div>

      <div className="reminder-list">
        {reminders.map((item) => (
          <button
            key={item.id}
            type="button"
            className="reminder-item"
            onClick={() => onOpenTab(item.targetTab)}
          >
            <span className="reminder-tag">{item.label}</span>
            <span className="reminder-copy">
              <strong>{item.title}</strong>
              <small>{item.meta}</small>
            </span>
            <span className="reminder-action">Open</span>
          </button>
        ))}
      </div>
    </article>
  )
}

function GallerySection({ items, setGallery, onUploadPhoto }) {
  const [form, setForm] = useState({ title: '', date: '', caption: '', photoUrl: '' })
  const [editingId, setEditingId] = useState(null)

  const resetForm = () => {
    setForm({ title: '', date: '', caption: '', photoUrl: '' })
    setEditingId(null)
  }

  const savePhoto = (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.photoUrl.trim()) return

    const nextPhoto = {
      title: form.title.trim(),
      date: form.date,
      caption: form.caption.trim(),
      photoUrl: form.photoUrl.trim(),
    }

    if (editingId) {
      setGallery((photos) =>
        photos.map((photo) =>
          photo.id === editingId
            ? { ...photo, ...nextPhoto, updatedAt: new Date().toISOString() }
            : photo,
        ),
      )
    } else {
      setGallery((photos) => [
        {
          id: createId('gallery'),
          ...nextPhoto,
          createdAt: new Date().toISOString(),
        },
        ...photos,
      ])
    }

    resetForm()
  }

  const editPhoto = (photo) => {
    setEditingId(photo.id)
    setForm({
      title: photo.title ?? '',
      date: photo.date ?? '',
      caption: photo.caption ?? '',
      photoUrl: photo.photoUrl ?? '',
    })
  }

  return (
    <section className="app-page">
      <PageHeader
        eyebrow="Gallery"
        title="Our photo gallery"
        summary="Upload, arrange, edit, and revisit the photos that belong to your shared space."
      />

      <div className="gallery-workspace">
        <form className="tool-panel gallery-uploader" onSubmit={savePhoto}>
          <div className="panel-head">
            <div>
              <p className="eyebrow">{editingId ? 'Editing photo' : 'New photo'}</p>
              <h2>{editingId ? 'Update gallery photo' : 'Add to gallery'}</h2>
            </div>
            <Images className="h-5 w-5 accent-text" />
          </div>

          <div className="field-grid">
            <label>
              <span>Photo title</span>
              <input
                className="input-field"
                placeholder="Beach afternoon"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label>
              <span>Photo date</span>
              <input
                type="date"
                className="input-field"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              />
            </label>
            <label>
              <span>Caption</span>
              <textarea
                className="input-field gallery-caption-input"
                placeholder="What should this photo always remind you of?"
                value={form.caption}
                onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))}
              />
            </label>
          </div>

          <ImageUploadField
            label="Upload photo"
            value={form.photoUrl}
            onChange={(value) => setForm((current) => ({ ...current, photoUrl: value }))}
            onUploadFile={onUploadPhoto}
          />

          <div className="form-actions">
            <button className="primary-button" type="submit">
              {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? 'Save photo' : 'Add photo'}
            </button>
            {editingId ? (
              <button type="button" className="secondary-button" onClick={resetForm}>
                <X className="h-4 w-4" /> Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="list-panel gallery-wall-panel">
          <div className="gallery-wall-head">
            <div>
              <p className="eyebrow">Arranged album</p>
              <h2>{items.length} {items.length === 1 ? 'photo' : 'photos'}</h2>
            </div>
            <span className="status-pill">Newest first</span>
          </div>

          {items.length ? (
            <div className="gallery-grid">
              {items.map((item, index) => (
                <article key={item.id} className={`gallery-card ${index === 0 ? 'gallery-card-featured' : ''}`}>
                  <img src={item.photoUrl} alt={item.title} className="gallery-image" loading="lazy" />
                  <div className="gallery-card-meta">
                    <span className="status-pill">{item.date ? formatDate(item.date) : 'Undated'}</span>
                    <div>
                      <h3>{item.title}</h3>
                      {item.caption ? <p className="body-muted">{item.caption}</p> : null}
                    </div>
                    <div className="card-actions">
                      <button type="button" className="icon-action" aria-label={`Edit ${item.title}`} onClick={() => editPhoto(item)}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="icon-action destructive-action"
                        aria-label={`Delete ${item.title}`}
                        onClick={() => {
                          setGallery((photos) => photos.filter((photo) => photo.id !== item.id))
                          if (editingId === item.id) resetForm()
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No gallery photos yet"
              text="Upload your first photo using the form. Your album will stay arranged newest first."
            />
          )}
        </div>
      </div>
    </section>
  )
}
function ProfileSection({ profile, setProfile, sync, uploadImage }) {
  return (
    <section className="app-page">
      <PageHeader
        eyebrow="Profile"
        title="Couple profile"
        summary="Manage the names, relationship date, cover photo, and shared account status for this private space."
      />

      <div className="profile-layout">
        <article className="profile-hero-card">
          <div className="profile-photo-large">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt={`${profile.one} and ${profile.two}`} />
            ) : (
              <Heart className="h-12 w-12" />
            )}
          </div>
          <div>
            <p className="eyebrow">Together</p>
            <h2>{profile.one} + {profile.two}</h2>
            <p className="body-muted">Started {formatDate(profile.since)}</p>
          </div>
        </article>

        <article className="tool-panel">
          <h2>Edit details</h2>
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
              <span>Relationship start date</span>
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

        <article className="profile-account-card">
          <div className="sync-icon">
            <Cloud className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow">Shared account</p>
            <h2>{getSyncLabel(sync.syncStatus)}</h2>
            <p className="body-muted">{sync.session?.user?.email || 'Local workspace'}</p>
            <p className={`sync-message ${sync.syncStatus === 'error' ? 'sync-message-error' : ''}`}>
              {sync.syncMessage}
            </p>
          </div>
        </article>
      </div>
    </section>
  )
}

function SettingsSection({ counts, isLightTheme, setTheme, sync }) {
  const countItems = [
    ['Memories', counts.memories],
    ['Gallery photos', counts.gallery],
    ['Dates', counts.dates],
    ['Goals', counts.goals],
    ['Notes', counts.notes],
    ['Songs', counts.songs],
  ]

  return (
    <section className="app-page">
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        summary="A calm control room for appearance, sync health, and the shape of your shared space."
      />

      <div className="settings-grid">
        <article className="settings-card">
          <div className="settings-card-head">
            <div className="settings-icon">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <p className="eyebrow">Appearance</p>
              <h2>Clean light interface</h2>
              <p className="body-muted">The product is tuned for the current premium white, purple, and cyan identity.</p>
            </div>
          </div>
          <button
            type="button"
            className={`theme-toggle settings-toggle ${isLightTheme ? 'theme-toggle-light' : ''}`}
            onClick={() => setTheme('light')}
          >
            <span className="theme-toggle-icon">
              {isLightTheme ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </span>
            Light theme
          </button>
        </article>

        <article className="settings-card">
          <div className="settings-card-head">
            <div className="settings-icon">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <p className="eyebrow">Sync</p>
              <h2>{getSyncLabel(sync.syncStatus)}</h2>
              <p className="body-muted">{sync.syncMessage}</p>
            </div>
          </div>
          <span className="status-pill">{sync.session?.user?.email || 'Local only'}</span>
        </article>

        <article className="settings-card settings-card-wide">
          <p className="eyebrow">Workspace content</p>
          <div className="settings-stat-grid">
            {countItems.map(([label, value]) => (
              <div key={label} className="settings-stat">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}

function LegalSection({ document }) {
  return (
    <section className="app-page legal-page">
      <PageHeader
        eyebrow={document.eyebrow}
        title={document.title}
        summary={document.summary}
      />

      <article className="legal-document">
        <div className="legal-document-head">
          <div>
            <p className="eyebrow">Last updated</p>
            <h2>{document.updated}</h2>
          </div>
          <span className="status-pill">Annoyingly long</span>
        </div>

        <p className="legal-intro">
          Please enjoy this deliberately extensive policy page. It is written to feel like the long, formal pages people
          click past on websites, except it is still readable enough that nobody has to call a translator.
        </p>

        <div className="legal-section-list">
          {document.sections.map((section) => (
            <section key={section.title} className="legal-clause">
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </article>
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
  const [form, setForm] = useState({ subject: '', message: '', photo: '', locked: true, reminderAt: '' })
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

    setForm({ subject: '', message: '', photo: '', locked: true, reminderAt: '' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ subject: '', message: '', photo: '', locked: true, reminderAt: '' })
  }

  const editNote = (note) => {
    setEditingId(note.id)
    setForm({
      subject: note.subject ?? '',
      message: note.message ?? '',
      photo: note.photo ?? '',
      locked: note.locked ?? false,
      reminderAt: note.reminderAt ?? '',
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
          <label className="field-block">
            <span>Reminder time optional</span>
            <input
              type="datetime-local"
              className="input-field"
              value={form.reminderAt}
              onChange={(event) => setForm((value) => ({ ...value, reminderAt: event.target.value }))}
            />
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
                    <p className="body-muted">
                      {formatDateTime(item.createdAt)}
                      {item.reminderAt ? ` - Reminder ${formatDateTime(item.reminderAt)}` : ''}
                    </p>
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
          item.id === editingId
            ? {
                ...item,
                ...form,
                openedAt: item.link === form.link ? item.openedAt : '',
                updatedAt: now.toISOString(),
              }
            : item,
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
                    {item.link ? (
                      <span className={item.openedAt ? 'status-pill status-pill-open' : 'status-pill status-pill-alert'}>
                        {item.openedAt ? 'Opened' : 'Unopened'}
                      </span>
                    ) : null}
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
                  <a
                    className="app-link"
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      setPlaylist((list) =>
                        list.map((track) =>
                          track.id === item.id
                            ? { ...track, openedAt: track.openedAt || now.toISOString() }
                            : track,
                        ),
                      )
                    }
                  >
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
