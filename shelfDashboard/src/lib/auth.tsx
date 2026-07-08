import {
  createContext,
  use,
  useEffect,
  useReducer,
} from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getDashboardPublicOrigin } from '#/lib/dashboard-origin'
import { getSupabase, supabaseConfigured } from '#/lib/supabase'
import { clearPersistedDashboardCache } from '#/lib/clear-dashboard-cache'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

interface AuthSlice {
  user: User | null
  session: Session | null
  loading: boolean
}

type AuthSliceAction =
  | { type: 'ready'; session: Session | null }
  | { type: 'unconfigured' }

const AuthContext = createContext<AuthState | null>(null)

function authSliceReducer(
  state: AuthSlice,
  action: AuthSliceAction,
): AuthSlice {
  switch (action.type) {
    case 'unconfigured':
      return { user: null, session: null, loading: false }
    case 'ready':
      return {
        user: action.session?.user ?? null,
        session: action.session,
        loading: false,
      }
  }
}

async function signIn(email: string, password: string) {
  const { error } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  })
  return { error: error?.message ?? null }
}

async function signUp(email: string, password: string) {
  const origin = getDashboardPublicOrigin()
  const { error } = await getSupabase().auth.signUp({
    email,
    password,
    options: origin ? { emailRedirectTo: `${origin}/dashboard` } : undefined,
  })
  return { error: error?.message ?? null }
}

async function signOut() {
  clearPersistedDashboardCache()
  await getSupabase().auth.signOut()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = supabaseConfigured()
  const [slice, dispatch] = useReducer(authSliceReducer, {
    user: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    if (!configured) {
      dispatch({ type: 'unconfigured' })
      return
    }
    const sb = getSupabase()
    const prevUserIdRef = { current: null as string | null }
    void sb.auth.getSession().then(({ data }) => {
      prevUserIdRef.current = data.session ? data.session.user.id : null
      dispatch({ type: 'ready', session: data.session })
    })
    const { data: sub } = sb.auth.onAuthStateChange((event, next) => {
      const nextUserId = next ? next.user.id : null
      if (!next && event === 'SIGNED_OUT') {
        clearPersistedDashboardCache()
        prevUserIdRef.current = null
      } else if (
        nextUserId &&
        prevUserIdRef.current &&
        nextUserId !== prevUserIdRef.current
      ) {
        clearPersistedDashboardCache()
      }
      prevUserIdRef.current = nextUserId
      dispatch({ type: 'ready', session: next })
    })
    return () => sub.subscription.unsubscribe()
  }, [configured])

  const value = {
    user: slice.user,
    session: slice.session,
    loading: slice.loading,
    configured,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
