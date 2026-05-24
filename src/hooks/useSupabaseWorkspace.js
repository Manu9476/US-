import { useCallback, useEffect, useRef, useState } from 'react'
import { createSafeImagePath, readImageAsDataUrl } from '../lib/imageFiles'
import { isSupabaseConfigured, supabase, SUPABASE_PHOTOS_BUCKET } from '../lib/supabaseClient'

const WORKSPACE_TABLE = 'us_plus_workspaces'
const ACTIVITY_TABLE = 'us_plus_activity_logs'
const SYNC_DELAY_MS = 700

const asArray = (value) => (Array.isArray(value) ? value : [])
const asProfile = (value, fallback) => ({ ...fallback, ...(value && typeof value === 'object' ? value : {}) })
const getWorkspaceCounts = (workspace) => ({
  dates: asArray(workspace.dates).length,
  gallery: asArray(workspace.gallery).length,
  goals: asArray(workspace.dreams).length,
  memories: asArray(workspace.timeline).length,
  notes: asArray(workspace.notes).length,
  songs: asArray(workspace.playlist).length,
})

export function useSupabaseWorkspace({
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
}) {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [remoteReady, setRemoteReady] = useState(!isSupabaseConfigured)
  const [syncStatus, setSyncStatus] = useState(isSupabaseConfigured ? 'checking' : 'local')
  const [syncMessage, setSyncMessage] = useState(
    isSupabaseConfigured ? 'Checking cloud session...' : 'Local mode until Supabase keys are added.',
  )
  const [authMessage, setAuthMessage] = useState('')
  const latestWorkspaceRef = useRef({
    profile,
    timeline,
    dates,
    dreams,
    gallery,
    notes,
    playlist,
  })
  const hasHydratedRemoteRef = useRef(false)
  const supportsGalleryRef = useRef(true)
  const supportsActivityLogsRef = useRef(true)
  const hasLoggedAppOpenRef = useRef(false)
  const saveTimerRef = useRef(null)

  useEffect(() => {
    latestWorkspaceRef.current = {
      profile,
      timeline,
      dates,
      dreams,
      gallery,
      notes,
      playlist,
    }
  }, [dates, dreams, gallery, notes, playlist, profile, timeline])

  const logActivity = useCallback(
    async (eventType, metadata = {}, userId = session?.user?.id ?? null) => {
      if (!isSupabaseConfigured || !supportsActivityLogsRef.current) {
        return
      }

      try {
        const { error } = await supabase.from(ACTIVITY_TABLE).insert({
          user_id: userId,
          event_type: eventType,
          event_label: metadata.label ?? null,
          metadata: {
            ...metadata,
            active_email: session?.user?.email ?? metadata.email ?? null,
            screen: typeof window !== 'undefined'
              ? `${window.screen.width}x${window.screen.height}`
              : null,
          },
          page_path: typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.hash}`
            : null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        })

        if (error) {
          supportsActivityLogsRef.current = false
          console.warn('Us+ activity logging is disabled:', error.message)
        }
      } catch (error) {
        supportsActivityLogsRef.current = false
        console.warn('Us+ activity logging is disabled:', error)
      }
    },
    [session?.user?.email, session?.user?.id],
  )

  useEffect(() => {
    if (!isSupabaseConfigured || !authReady || hasLoggedAppOpenRef.current) {
      return
    }

    hasLoggedAppOpenRef.current = true
    void logActivity('app_open', {
      auth_state: session?.user ? 'signed_in' : 'signed_out',
      label: 'Website opened',
    })
  }, [authReady, logActivity, session?.user])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined
    }

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setAuthReady(true)
      if (!data.session) {
        setSyncStatus('signed-out')
        setSyncMessage('Sign in to sync this couple space across devices.')
      }
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthReady(true)
      setRemoteReady(false)
      hasHydratedRemoteRef.current = false

      if (!nextSession) {
        setSyncStatus('signed-out')
        setSyncMessage('Signed out. New edits are saved on this device only.')
      }
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !authReady) {
      return undefined
    }

    if (!session?.user) {
      return undefined
    }

    let isCancelled = false

    async function loadWorkspace() {
      setSyncStatus('loading')
      setSyncMessage('Loading your shared couple space...')

      let { data, error } = await supabase
        .from(WORKSPACE_TABLE)
        .select('profile,timeline,dates,dreams,gallery,notes,playlist')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error && error.message.toLowerCase().includes('gallery')) {
        supportsGalleryRef.current = false
        const fallback = await supabase
          .from(WORKSPACE_TABLE)
          .select('profile,timeline,dates,dreams,notes,playlist')
          .eq('user_id', session.user.id)
          .maybeSingle()

        data = fallback.data ? { ...fallback.data, gallery: latestWorkspaceRef.current.gallery } : fallback.data
        error = fallback.error
      } else {
        supportsGalleryRef.current = true
      }

      if (isCancelled) return

      if (error) {
        setSyncStatus('error')
        setSyncMessage(error.message)
        return
      }

      if (data) {
        const currentWorkspace = latestWorkspaceRef.current
        setProfile(asProfile(data.profile, currentWorkspace.profile))
        setTimeline(asArray(data.timeline))
        setDates(asArray(data.dates))
        setDreams(asArray(data.dreams))
        setGallery(asArray(data.gallery))
        setNotes(asArray(data.notes))
        setPlaylist(asArray(data.playlist))
        void logActivity('workspace_loaded', {
          counts: getWorkspaceCounts(data),
          label: 'Workspace loaded',
        })
      } else {
        const initialWorkspace = { ...latestWorkspaceRef.current }

        if (!supportsGalleryRef.current) {
          delete initialWorkspace.gallery
        }

        const { error: createError } = await supabase.from(WORKSPACE_TABLE).upsert({
          user_id: session.user.id,
          ...initialWorkspace,
        })

        if (createError) {
          setSyncStatus('error')
          setSyncMessage(createError.message)
          return
        }

        void logActivity('workspace_created', {
          counts: getWorkspaceCounts(latestWorkspaceRef.current),
          label: 'Workspace created',
        })
      }

      hasHydratedRemoteRef.current = true
      setRemoteReady(true)
      setSyncStatus(supportsGalleryRef.current ? 'synced' : 'error')
      setSyncMessage(
        supportsGalleryRef.current
          ? 'Cloud sync is active.'
          : 'Cloud sync is active, but the gallery database column needs the Supabase schema update.',
      )
    }

    loadWorkspace()

    return () => {
      isCancelled = true
    }
  }, [authReady, logActivity, session?.user, setDates, setDreams, setGallery, setNotes, setPlaylist, setProfile, setTimeline])

  useEffect(() => {
    if (!isSupabaseConfigured || !session?.user || !remoteReady || !hasHydratedRemoteRef.current) {
      return undefined
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }

    setSyncStatus('saving')
    setSyncMessage('Saving latest changes...')

    saveTimerRef.current = window.setTimeout(async () => {
      const workspace = { ...latestWorkspaceRef.current }

      if (!supportsGalleryRef.current) {
        delete workspace.gallery
      }

      const { error } = await supabase.from(WORKSPACE_TABLE).upsert({
        user_id: session.user.id,
        ...workspace,
      })

      if (error) {
        setSyncStatus('error')
        setSyncMessage(error.message)
        return
      }

      setSyncStatus(supportsGalleryRef.current ? 'synced' : 'error')
      setSyncMessage(
        supportsGalleryRef.current
          ? 'All changes are synced.'
          : 'Most changes are synced. Run the Supabase schema update to sync gallery photos.',
      )
      void logActivity('workspace_saved', {
        counts: getWorkspaceCounts(workspace),
        label: 'Workspace saved',
      })
    }, SYNC_DELAY_MS)

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [dates, dreams, gallery, logActivity, notes, playlist, profile, remoteReady, session?.user, timeline])

  const signIn = async ({ email, password }) => {
    if (!isSupabaseConfigured) return { error: new Error('Supabase is not configured yet.') }

    setAuthMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setAuthMessage(error.message)
      void logActivity('sign_in_failed', {
        email,
        error_message: error.message,
        label: 'Sign in failed',
      }, null)
    } else {
      void logActivity('sign_in_success', {
        email,
        label: 'Sign in succeeded',
      }, null)
    }

    return { error }
  }

  const signUp = async ({ email, password }) => {
    if (!isSupabaseConfigured) return { error: new Error('Supabase is not configured yet.') }

    setAuthMessage('')
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setAuthMessage(error.message)
      void logActivity('sign_up_failed', {
        email,
        error_message: error.message,
        label: 'Sign up failed',
      }, null)
      return { error }
    }

    setAuthMessage('Account created. If email confirmation is enabled, confirm your email before signing in.')
    void logActivity('sign_up_success', {
      email,
      label: 'Account created',
    }, null)
    return { error: null }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) return
    void logActivity('sign_out', {
      email: session?.user?.email ?? null,
      label: 'User signed out',
    })
    await supabase.auth.signOut()
  }

  const uploadImage = async (file) => {
    if (!isSupabaseConfigured || !session?.user) {
      return readImageAsDataUrl(file)
    }

    const path = createSafeImagePath(session.user.id, file)
    const { error } = await supabase.storage
      .from(SUPABASE_PHOTOS_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      throw error
    }

    const { data } = supabase.storage.from(SUPABASE_PHOTOS_BUCKET).getPublicUrl(path)
    void logActivity('photo_uploaded', {
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      label: 'Photo uploaded',
      storage_path: path,
    })
    return data.publicUrl
  }

  return {
    authMessage,
    authReady,
    isConfigured: isSupabaseConfigured,
    remoteReady,
    session,
    signIn,
    signOut,
    signUp,
    logActivity,
    syncMessage,
    syncStatus,
    uploadImage,
  }
}
