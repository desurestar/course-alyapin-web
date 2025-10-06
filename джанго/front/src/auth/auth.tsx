import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactElement,
	type ReactNode,
} from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { apiLogin, apiLogout, apiMe, apiRegister } from '../api/auth'
import {
	attemptRefresh,
	getAccessToken,
	parseJwtExp,
	setAccessToken,
} from '../api/http'
import type { AuthContextValue, UserPublic } from '../types/auth'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<UserPublic | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const refreshTimer = useRef<number | null>(null)

	const scheduleRefresh = useCallback((access?: string | null) => {
		if (refreshTimer.current) window.clearTimeout(refreshTimer.current)
		const token = access ?? getAccessToken()
		if (!token) return
		const exp = parseJwtExp(token)
		if (!exp) return
		const msUntil = exp * 1000 - Date.now() - 30_000 // 30s before expiry
		if (msUntil <= 0) {
			void doRefresh()
			return
		}
		refreshTimer.current = window.setTimeout(() => {
			void doRefresh()
		}, msUntil)
	}, [])

	const bootstrap = useCallback(async () => {
		try {
			// Try refresh to get access token silently
			await attemptRefresh()
			if (getAccessToken()) {
				const me = await apiMe()
				setUser(me)
				scheduleRefresh()
			}
		} catch (e: any) {
			console.warn('Auth bootstrap failed', e)
		} finally {
			setLoading(false)
		}
	}, [scheduleRefresh])

	useEffect(() => {
		bootstrap()
	}, [bootstrap])
	useEffect(
		() => () => {
			if (refreshTimer.current) window.clearTimeout(refreshTimer.current)
		},
		[]
	)

	const doLogin = useCallback(
		async (payload: { email?: string; phone?: string; password: string }) => {
			setError(null)
			setLoading(true)
			try {
				const { user, access } = await apiLogin(payload as any)
				setUser(user)
				scheduleRefresh(access)
			} catch (e: any) {
				setError(e.message || 'Не удалось войти')
				throw e
			} finally {
				setLoading(false)
			}
		},
		[scheduleRefresh]
	)

	const doRegister = useCallback(
		async (payload: {
			full_name: string
			email?: string
			phone?: string
			password: string
		}) => {
			setError(null)
			setLoading(true)
			try {
				const { user, access } = await apiRegister(payload as any)
				setUser(user)
				scheduleRefresh(access)
			} catch (e: any) {
				setError(e.message || 'Не удалось зарегистрироваться')
				throw e
			} finally {
				setLoading(false)
			}
		},
		[scheduleRefresh]
	)

	const doLogout = useCallback(async () => {
		setLoading(true)
		try {
			await apiLogout()
		} finally {
			setUser(null)
			setAccessToken(null)
			if (refreshTimer.current) window.clearTimeout(refreshTimer.current)
			setLoading(false)
		}
	}, [])

	const doRefresh = useCallback(async () => {
		try {
			const ok = await attemptRefresh()
			if (ok) {
				scheduleRefresh()
				if (!user) {
					const me = await apiMe()
					setUser(me)
				}
			} else {
				// refresh failed -> logout state only
				setUser(null)
				setAccessToken(null)
			}
		} catch (e) {
			setUser(null)
			setAccessToken(null)
		}
	}, [scheduleRefresh, user])

	const loggedIn = !!user

	const value: AuthContextValue = {
		user,
		loading,
		error,
		loggedIn,
		authed: loggedIn, // backward compat
		loginEmail: async (email, password) => doLogin({ email, password }),
		loginPhone: async (phone, password) => doLogin({ phone, password }),
		register: doRegister,
		logout: doLogout,
		refresh: async () => {
			await doRefresh()
		},
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error('useAuth must be used within AuthProvider')
	return ctx
}

export function RequireAuth({ children }: { children: ReactElement }) {
	const { loggedIn, loading } = useAuth()
	const location = useLocation()
	if (loading) return null
	if (!loggedIn)
		return <Navigate to='/login' replace state={{ from: location }} />
	return children
}
