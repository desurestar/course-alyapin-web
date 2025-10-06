import type { UserPublic } from '../types/auth'
import type { ProfileDetail } from '../types/profile'
import { http } from './http'

// Backend mapping:
//  GET   /users/{id}/profile/   -> getProfileDetail (aggregated: user, groups, articles counts)
//  PATCH /users/{id}/           -> updateProfile (partial user fields, avatar via multipart later)
//  GET   /users/?search=...     -> searchUsers (list candidates for co-authors / members)
// Notes:
//  - Avatar upload: send multipart/form-data or pre-upload to file service then PATCH avatar URL.
//  - Extend getProfileDetail with pagination keys if article/group counts become large.

export async function getProfileDetailHttp(id: number): Promise<ProfileDetail> {
	return http<ProfileDetail>(`/users/${id}/profile/`, { auth: true })
}

export async function updateProfileHttp(
	id: number,
	patch: Partial<ProfileDetail>
) {
	const body: any = { ...patch }
	return http<ProfileDetail>(`/users/${id}/`, {
		method: 'PATCH',
		auth: true,
		body: JSON.stringify(body),
	})
}

export async function searchUsers(query: string): Promise<UserPublic[]> {
	const params = new URLSearchParams()
	if (query) params.set('search', query)
	return http<UserPublic[]>(`/users/?${params.toString()}`, { auth: true })
}
