import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactElement,
	type ReactNode,
} from 'react'
import { Navigate, useLocation } from 'react-router-dom'

type AuthContextType = {
	authed: boolean
	userId: number | null
	login: (userId: number) => void
	logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
	const [authed, setAuthed] = useState<boolean>(
		() => localStorage.getItem('auth') === '1'
	)
	const [userId, setUserId] = useState<number | null>(() => {
		const raw = localStorage.getItem('userId')
		return raw ? Number(raw) : null
	})

	useEffect(() => {
		localStorage.setItem('auth', authed ? '1' : '0')
	}, [authed])
	useEffect(() => {
		if (userId == null) localStorage.removeItem('userId')
		else localStorage.setItem('userId', String(userId))
	}, [userId])

	const value = useMemo(
		() => ({
			authed,
			userId,
			login: (id: number) => {
				setUserId(id)
				setAuthed(true)
			},
			logout: () => {
				setAuthed(false)
				setUserId(null)
			},
		}),
		[authed, userId]
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error('useAuth must be used within AuthProvider')
	return ctx
}

export function RequireAuth({ children }: { children: ReactElement }) {
	const { authed } = useAuth()
	const location = useLocation()
	if (!authed)
		return <Navigate to='/login' replace state={{ from: location }} />
	return children
}
