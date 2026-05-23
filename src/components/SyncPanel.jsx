import { useState } from 'react'
import { Lock, LogOut, ShieldCheck, Wifi, WifiOff } from 'lucide-react'

function getStatusLabel(syncStatus) {
  if (syncStatus === 'saving') return 'Saving'
  if (syncStatus === 'synced') return 'Synced'
  if (syncStatus === 'loading' || syncStatus === 'checking') return 'Loading'
  if (syncStatus === 'error') return 'Needs attention'
  if (syncStatus === 'signed-out') return 'Local only'
  return 'Local'
}

export function SyncBadge({ isConfigured, session, syncStatus }) {
  const Icon = isConfigured && session ? Wifi : WifiOff

  return (
    <span className={`sync-badge ${syncStatus === 'error' ? 'sync-badge-error' : ''}`}>
      <Icon className="h-3.5 w-3.5" />
      {getStatusLabel(isConfigured ? syncStatus : 'local')}
    </span>
  )
}

export function SyncPanel({
  authMessage,
  isConfigured,
  session,
  signIn,
  signOut,
  signUp,
  syncMessage,
  syncStatus,
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email.trim() || password.length < 6) return

    setIsSubmitting(true)
    const action = mode === 'signup' ? signUp : signIn
    const { error } = await action({ email: email.trim(), password })
    setIsSubmitting(false)

    if (!error && mode === 'signin') {
      setPassword('')
    }
  }

  if (!isConfigured) {
    return (
      <article className="sync-panel">
        <div className="sync-icon">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <p className="eyebrow">Cloud setup</p>
          <h2>Ready for shared login</h2>
          <p className="body-muted">
            Add your Supabase URL and anon key to enable one couple account, cloud storage, and matching data on every device.
          </p>
        </div>
      </article>
    )
  }

  if (session?.user) {
    return (
      <article className="sync-panel sync-panel-active">
        <div className="sync-icon">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="sync-panel-copy">
          <p className="eyebrow">Shared account</p>
          <h2>Cloud sync is on</h2>
          <p className="body-muted">{session.user.email}</p>
          <p className={`sync-message ${syncStatus === 'error' ? 'sync-message-error' : ''}`}>{syncMessage}</p>
        </div>
        <button type="button" className="secondary-button" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </article>
    )
  }

  return (
    <article className="sync-panel">
      <div className="sync-icon">
        <Lock className="h-5 w-5" />
      </div>
      <form className="sync-form" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Shared login</p>
          <h2>{mode === 'signup' ? 'Create your couple account' : 'Sign in together'}</h2>
          <p className="body-muted">
            Use the same private email and password on both devices to see identical photos, notes, plans, and memories.
          </p>
        </div>
        <div className="sync-form-grid">
          <input
            className="input-field"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="input-field"
            type="password"
            placeholder="Password, 6+ characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {authMessage ? <p className="sync-message">{authMessage}</p> : null}
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setMode((currentMode) => (currentMode === 'signin' ? 'signup' : 'signin'))}
          >
            {mode === 'signin' ? 'Create account' : 'I already have one'}
          </button>
        </div>
      </form>
    </article>
  )
}
