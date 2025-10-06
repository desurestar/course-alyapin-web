import { attemptRefresh, http, parseJwtExp, setAccessToken } from './http'

export interface AuthUser {
	id: number
	first_name: string
	last_name: string
	email: string | null
	phone?: string | null
	full_name?: string
}

export interface LoginPayloadEmail {
	email: string
	password: string
}
export interface LoginPayloadPhone {
	phone: string
	password: string
}
export type LoginPayload = LoginPayloadEmail | LoginPayloadPhone

export interface RegisterPayload {
	full_name: string
	email?: string
	phone?: string
	password: string
}

export interface TokenResponse {
	access: string
}

export interface AuthState {
	user: AuthUser | null
	access: string | null
	accessExp: number | null
}

export async function apiLogin(payload: LoginPayload): Promise<AuthState> {
	const data = await http<{ access: string; user: AuthUser }>('auth/login/', {
		method: 'POST',
		body: JSON.stringify(payload),
		credentials: 'include',
	})
	applyAccess(data.access)
	return {
		user: enrichUser(data.user),
		access: data.access,
		accessExp: parseJwtExp(data.access),
	}
}

export async function apiRegister(
	payload: RegisterPayload
): Promise<AuthState> {
	const data = await http<{ access: string; user: AuthUser }>(
		'auth/register/',
		{
			method: 'POST',
			body: JSON.stringify(payload),
			credentials: 'include',
		}
	)
	applyAccess(data.access)
	return {
		user: enrichUser(data.user),
		access: data.access,
		accessExp: parseJwtExp(data.access),
	}
}

export async function apiMe(): Promise<AuthUser> {
	const data = await http<AuthUser>('auth/me/', {
		auth: true,
		credentials: 'include',
	})
	return enrichUser(data)
}

export async function apiLogout(): Promise<void> {
	try {
		await http('auth/logout/', { method: 'POST', credentials: 'include' })
	} catch {}
	applyAccess(null)
}

export async function apiEnsureRefreshed(): Promise<boolean> {
	const ok = await attemptRefresh()
	if (ok && getAccessToken()) return true
	return ok
}

function applyAccess(token: string | null) {
	setAccessToken(token)
}

function enrichUser(u: AuthUser): AuthUser {
	if (!u) return u
	if (!u.full_name) {
		const parts = [u.last_name, u.first_name].filter(Boolean)
		u.full_name = parts.join(' ')
	}
	return u
}

// Accessor from http module without circular (manual copy)
import { getAccessToken } from './http'
