import type { UserPublic } from '../types/auth'
// (Global API_USE_MOCK ignored here; using domain-specific env instead)
import { http } from './http'

// Types specific for admin user management
export interface AdminUser extends UserPublic {
	is_active?: boolean
	date_joined?: string
}

export interface NewAdminUserInput {
	first_name: string
	last_name: string
	email: string
	phone?: string | null
	password: string
	is_superuser?: boolean
	is_staff?: boolean
}

export interface UpdateAdminUserInput {
	first_name?: string
	last_name?: string
	email?: string | null
	phone?: string | null
	password?: string // optional: only if changing
	is_superuser?: boolean
	is_staff?: boolean
	is_active?: boolean
}

export interface AdminUserListParams {
	search?: string
	is_superuser?: boolean
	is_staff?: boolean
	page?: number
	page_size?: number
}

export interface PaginatedUsers {
	results: AdminUser[]
	count: number
	page: number
	page_size: number
}

// Domain-specific override: set VITE_API_USE_MOCK_ADMIN_USERS explicitly to 'true' to keep mocks.
// Otherwise admin users API will go to real backend even if global API_USE_MOCK = true.
const domainEnv = import.meta.env.VITE_API_USE_MOCK_ADMIN_USERS
const USE_MOCK =
	domainEnv === 'true' ? true : domainEnv === 'false' ? false : false

// --- Mock state --- //
let mockUsers: AdminUser[] = [
	{
		id: 1,
		first_name: 'Иван',
		last_name: 'Иванов',
		email: 'ivan@example.com',
		full_name: 'Иван Иванов',
		is_superuser: true,
		is_staff: true,
	},
	{
		id: 2,
		first_name: 'Пётр',
		last_name: 'Петров',
		email: 'petr@example.com',
		full_name: 'Пётр Петров',
		is_superuser: false,
		is_staff: true,
	},
	{
		id: 3,
		first_name: 'Анна',
		last_name: 'Сидорова',
		email: 'anna@example.com',
		full_name: 'Анна Сидорова',
		is_superuser: false,
		is_staff: false,
	},
]
let nextUserId = 4

function delay(ms = 250) {
	return new Promise(r => setTimeout(r, ms))
}
function matches(u: AdminUser, p: AdminUserListParams) {
	if (p.is_superuser !== undefined && !!u.is_superuser !== p.is_superuser)
		return false
	if (p.is_staff !== undefined && !!u.is_staff !== p.is_staff) return false
	if (p.search) {
		const q = p.search.toLowerCase()
		const blob = `${u.first_name} ${u.last_name} ${u.email || ''}`.toLowerCase()
		if (!blob.includes(q)) return false
	}
	return true
}

function paginate<T>(
	arr: T[],
	page = 1,
	page_size = 20
): { results: T[]; count: number; page: number; page_size: number } {
	const start = (page - 1) * page_size
	return {
		results: arr.slice(start, start + page_size),
		count: arr.length,
		page,
		page_size,
	}
}

export async function listAdminUsers(
	params: AdminUserListParams = {}
): Promise<PaginatedUsers> {
	if (USE_MOCK) {
		await delay()
		const { page = 1, page_size = 20 } = params
		const filtered = mockUsers.filter(u => matches(u, params))
		const pg = paginate(filtered, page, page_size)
		return { ...pg, results: pg.results.map(normalizeAdminUser) }
	}
	const q = new URLSearchParams()
	if (params.page) q.set('page', String(params.page))
	if (params.page_size) q.set('page_size', String(params.page_size))
	if (params.search) q.set('search', params.search)
	if (params.is_superuser !== undefined)
		q.set('is_superuser', String(params.is_superuser))
	if (params.is_staff !== undefined) q.set('is_staff', String(params.is_staff))
	const data = await http<PaginatedUsers>(`/admin/users/?${q.toString()}`, {
		auth: true,
	})
	return { ...data, results: data.results.map(normalizeAdminUser) }
}

export async function getAdminUser(id: number): Promise<AdminUser> {
	if (USE_MOCK) {
		await delay()
		const u = mockUsers.find(u => u.id === id)
		if (!u) throw new Error('Пользователь не найден')
		return normalizeAdminUser(u)
	}
	const data = await http<AdminUser>(`/admin/users/${id}/`, { auth: true })
	return normalizeAdminUser(data)
}

export async function createAdminUser(
	input: NewAdminUserInput
): Promise<AdminUser> {
	if (USE_MOCK) {
		await delay()
		if (!input.first_name?.trim() || !input.last_name?.trim())
			throw new Error('Имя и фамилия обязательны')
		if (!input.email?.trim()) throw new Error('Email обязателен')
		if (!input.password?.trim()) throw new Error('Пароль обязателен')
		const u: AdminUser = {
			id: nextUserId++,
			first_name: input.first_name.trim(),
			last_name: input.last_name.trim(),
			email: input.email.trim(),
			phone: input.phone?.trim() || null,
			full_name: `${input.first_name.trim()} ${input.last_name.trim()}`.trim(),
			is_superuser: !!input.is_superuser,
			is_staff: input.is_staff ?? true,
		}
		mockUsers.unshift(u)
		return normalizeAdminUser(u)
	}
	const payload = prepareCreateAdminUserInput(input)
	const data = await http<AdminUser>(`/admin/users/`, {
		method: 'POST',
		auth: true,
		body: JSON.stringify(payload),
	})
	return normalizeAdminUser(data)
}

export async function updateAdminUser(
	id: number,
	patch: UpdateAdminUserInput
): Promise<AdminUser> {
	if (USE_MOCK) {
		await delay()
		const idx = mockUsers.findIndex(u => u.id === id)
		if (idx === -1) throw new Error('Не найдено')
		const cur = mockUsers[idx]
		const next: AdminUser = {
			...cur,
			...patch,
			first_name:
				patch.first_name !== undefined ? patch.first_name : cur.first_name,
			last_name:
				patch.last_name !== undefined ? patch.last_name : cur.last_name,
			email: patch.email !== undefined ? patch.email || '' : cur.email,
			phone: patch.phone !== undefined ? patch.phone : cur.phone,
			full_name: `${patch.first_name ?? cur.first_name} ${
				patch.last_name ?? cur.last_name
			}`.trim(),
			is_superuser:
				patch.is_superuser !== undefined
					? patch.is_superuser
					: cur.is_superuser,
			is_staff: patch.is_staff !== undefined ? patch.is_staff : cur.is_staff,
		}
		mockUsers[idx] = next
		return normalizeAdminUser(next)
	}
	const clean = prepareUpdateAdminUserInput(patch)
	const data = await http<AdminUser>(`/admin/users/${id}/`, {
		method: 'PATCH',
		auth: true,
		body: JSON.stringify(clean),
	})
	return normalizeAdminUser(data)
}

export async function deleteAdminUser(id: number): Promise<void> {
	if (USE_MOCK) {
		await delay()
		mockUsers = mockUsers.filter(u => u.id !== id)
		return
	}
	await http(`/admin/users/${id}/`, { method: 'DELETE', auth: true })
}

// ------------------ Helpers / Adapters ------------------ //

/** Normalize API user object to AdminUser (adds full_name fallback) */
export function normalizeAdminUser(raw: any): AdminUser {
	return {
		...raw,
		full_name:
			raw.full_name || `${raw.first_name || ''} ${raw.last_name || ''}`.trim(),
	}
}

/** Trim & sanitize create payload */
export function prepareCreateAdminUserInput(
	input: NewAdminUserInput
): NewAdminUserInput {
	return {
		first_name: input.first_name.trim(),
		last_name: input.last_name.trim(),
		email: input.email.trim(),
		phone: input.phone?.trim() || undefined,
		password: input.password, // do not trim passwords internally except edges
		is_superuser: !!input.is_superuser,
		is_staff: input.is_staff ?? true,
	}
}

/** Remove undefined + trim values for update payload */
export function prepareUpdateAdminUserInput(
	patch: UpdateAdminUserInput
): UpdateAdminUserInput {
	const out: UpdateAdminUserInput = {}
	if (patch.first_name !== undefined) out.first_name = patch.first_name.trim()
	if (patch.last_name !== undefined) out.last_name = patch.last_name.trim()
	if (patch.email !== undefined) out.email = patch.email?.trim() || ''
	if (patch.phone !== undefined) out.phone = patch.phone?.trim() || null
	if (patch.password) out.password = patch.password
	if (patch.is_superuser !== undefined) out.is_superuser = patch.is_superuser
	if (patch.is_staff !== undefined) out.is_staff = patch.is_staff
	if (patch.is_active !== undefined) out.is_active = patch.is_active
	return out
}

/** Build a minimal diff patch from original & edited objects */
export function buildAdminUserPatch(
	original: AdminUser,
	edited: Partial<AdminUser & { password?: string }>
): UpdateAdminUserInput {
	const patch: UpdateAdminUserInput = {}
	if (
		edited.first_name !== undefined &&
		edited.first_name !== original.first_name
	)
		patch.first_name = edited.first_name
	if (edited.last_name !== undefined && edited.last_name !== original.last_name)
		patch.last_name = edited.last_name
	if (edited.email !== undefined && edited.email !== original.email)
		patch.email = edited.email
	if (edited.phone !== undefined && edited.phone !== original.phone)
		patch.phone = edited.phone
	if (edited.password && edited.password.trim())
		patch.password = edited.password
	if (
		edited.is_superuser !== undefined &&
		edited.is_superuser !== original.is_superuser
	)
		patch.is_superuser = edited.is_superuser
	if (edited.is_staff !== undefined && edited.is_staff !== original.is_staff)
		patch.is_staff = edited.is_staff
	if (edited.is_active !== undefined && edited.is_active !== original.is_active)
		patch.is_active = edited.is_active
	return patch
}
