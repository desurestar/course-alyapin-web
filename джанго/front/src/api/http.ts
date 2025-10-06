/* Centralized HTTP helper with JWT access token support and cookie utilities.
 * Assumptions:
 *  - Backend sets refresh token HttpOnly cookie (e.g. refresh_token) on login/refresh
 *  - Access token returned in JSON { access: string, refresh?: string }
 *  - API base url from VITE_API_BASE (fallback to /api)
 */

export const API_BASE = import.meta.env.VITE_API_BASE || '/api'

// Cookie helpers (non-HttpOnly only). For HttpOnly the server must set them.
export function getCookie(name: string): string | null {
	const m = document.cookie.match(
		new RegExp(
			'(?:^|; )' +
				name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') +
				'=([^;]*)'
		)
	)
	return m ? decodeURIComponent(m[1]) : null
}

export function setCookie(
	name: string,
	value: string,
	opts: { days?: number; path?: string } = {}
) {
	const { days = 7, path = '/' } = opts
	const expires = new Date(Date.now() + days * 864e5).toUTCString()
	document.cookie = `${name}=${encodeURIComponent(
		value
	)}; path=${path}; expires=${expires}`
}

export function deleteCookie(name: string) {
	document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export interface HttpOptions extends RequestInit {
	auth?: boolean // attach Authorization header if access token exists
	retryRefresh?: boolean // internal flag
}

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
	accessToken = token
}
export function getAccessToken() {
	return accessToken
}

export async function http<T = any>(
	path: string,
	options: HttpOptions = {}
): Promise<T> {
	const url = path.startsWith('http')
		? path
		: API_BASE.replace(/\/$/, '') + '/' + path.replace(/^\//, '')
	const headers: Record<string, string> = {
		Accept: 'application/json',
		...(options.body && !(options.body instanceof FormData)
			? { 'Content-Type': 'application/json' }
			: {}),
		...((options.headers as any) || {}),
	}
	if (options.auth && accessToken) {
		headers['Authorization'] = `Bearer ${accessToken}`
	}
	const resp = await fetch(url, { ...options, headers })

	if (resp.status === 204) return undefined as any

	const text = await resp.text()
	let data: any
	try {
		data = text ? JSON.parse(text) : {}
	} catch {
		data = text
	}

	if (!resp.ok) {
		// Attempt refresh once on 401 if not already retried
		if (resp.status === 401 && options.auth && !options.retryRefresh) {
			const refreshed = await attemptRefresh()
			if (refreshed) {
				return http<T>(path, { ...options, retryRefresh: true })
			}
		}
		const message =
			(data && (data.detail || data.message || data.error)) ||
			`HTTP ${resp.status}`
		throw new HttpError(message, resp.status, data)
	}
	return data as T
}

export class HttpError extends Error {
	status: number
	payload: any
	constructor(message: string, status: number, payload: any) {
		super(message)
		this.status = status
		this.payload = payload
	}
}

// Decode JWT exp (seconds) without verifying signature
export function parseJwtExp(token: string): number | null {
	try {
		const payload = JSON.parse(atob(token.split('.')[1]))
		if (typeof payload.exp === 'number') return payload.exp
		return null
	} catch {
		return null
	}
}

export async function attemptRefresh(): Promise<boolean> {
	try {
		const data = await fetch(API_BASE.replace(/\/$/, '') + '/auth/refresh/', {
			method: 'POST',
			credentials: 'include',
		})
		if (!data.ok) return false
		const json = await data.json()
		if (json.access) {
			setAccessToken(json.access)
			return true
		}
		return false
	} catch {
		return false
	}
}
