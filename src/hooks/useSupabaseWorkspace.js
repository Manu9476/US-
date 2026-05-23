import { useEffect, useRef, useState } from 'react'
import { createSafeImagePath, readImageAsDataUrl } from '../lib/imageFiles'
import { isSupabaseConfigured, supabase, SUPABASE_PHOTOS_BUCKET } from '../lib/supabaseClient'

const WORKSPACE_TABLE = 'us_plus_workspaces'
const SYNC_DELAY_MS = 700

const asArray = (value) => (Array.isArray(value) ? value : [])
const asProfile = (value, fallback) => ({ ...fallback, ...(value && typeof value === 'object' ? value : {}) })

export function useSupabaseWorkspace({
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
    notes,
    playlist,
  })
  const hasHydratedRemoteRef = useRef(false)
  const saveTimerRef = useRef(null)

  useEffect(() => {
    latestWorkspaceRef.current = {
      profile,
      timeline,
      dates,
      dreams,
      notes,
      playlist,
    }
  }, [dates, dreams, notes, playlist, profile, timeline])

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

      const { data, error } = await supabase
        .from(WORKSPACE_TABLE)
        .select('profile,timeline,dates,dreams,notes,playlist')
        .eq('user_id', session.user.id)
        .maybeSingle()

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
        setNotes(asArray(data.notes))
        setPlaylist(asArray(data.playlist))
      } else {
        const initialWorkspace = latestWorkspaceRef.current
        const { error: createError } = await supabase.from(WORKSPACE_TABLE).upsert({
          user_id: session.user.id,
          ...initialWorkspace,
        })

        if (createError) {
          setSyncStatus('error')
          setSyncMessage(createError.message)
          return
        }
      }

      hasHydratedRemoteRef.current = true
      setRemoteReady(true)
      setSyncStatus('synced')
      setSyncMessage('Cloud sync is active.')
    }

    loadWorkspace()

    return () => {
      isCancelled = true
    }
  }, [authReady, session?.user, setDates, setDreams, setNotes, setPlaylist, setProfile, setTimeline])

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
      const { error } = await supabase.from(WORKSPACE_TABLE).upsert({
        user_id: session.user.id,
        ...latestWorkspaceRef.current,
      })

      if (error) {
        setSyncStatus('error')
        setSyncMessage(error.message)
        return
      }

      setSyncStatus('synced')
      setSyncMessage('All changes are synced.')
    }, SYNC_DELAY_MS)

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [dates, dreams, notes, playlist, profile, remoteReady, session?.user, timeline])

  const signIn = async ({ email, password }) => {
    if (!isSupabaseConfigured) return { error: new Error('Supabase is not configured yet.') }

    setAuthMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setAuthMessage(error.message)
    }

    return { error }
  }

  const signUp = async ({ email, password }) => {
    if (!isSupabaseConfigured) return { error: new Error('Supabase is not configured yet.') }

    setAuthMessage('')
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setAuthMessage(error.message)
      return { error }
    }

    setAuthMessage('Account created. If email confirmation is enabled, confirm your email before signing in.')
    return { error: null }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) return
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
    syncMessage,
    syncStatus,
    uploadImage,
  }
}
