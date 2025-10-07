import type { GroupMember, ProfileGroup } from '../types/profile'
import { camelizeResponse } from '../utils/case'
import { http } from './http'

const USE_MOCK = false
let mock: any = null
async function loadMock() {
	if (!mock) mock = await import('./profile')
	return mock
}

// Admin / global listing (for management UI)
// Backend endpoint assumption: GET /groups/?page=&page_size=&search=
// For now returns full array (no pagination) in mock mode.
export async function listAllGroups(
	params: { page?: number; page_size?: number; search?: string } = {}
): Promise<ProfileGroup[]> {
	if (USE_MOCK) {
		const m = await loadMock()
		return (m as any).groups?.map((g: ProfileGroup) => ({ ...g })) || []
	}
	const q = new URLSearchParams()
	if (params.page) q.set('page', String(params.page))
	if (params.page_size) q.set('page_size', String(params.page_size))
	if (params.search) q.set('search', params.search)
	const raw = await http(`/groups/${q.toString() ? `?${q.toString()}` : ''}`, {
		auth: true,
	})
	return camelizeResponse<ProfileGroup[]>(raw)
}

// Backend mapping (intended production endpoints):
//  GET    /groups/{id}/                          -> getGroup
//  GET    /users/{user_id}/groups/               -> listUserGroups
//  POST   /groups/                               -> createGroup { name, description?, member_ids[] }
//  PATCH  /groups/{id}/                          -> updateGroup { name?, description?, leader_id? }
//  DELETE /groups/{id}/                          -> deleteGroup
//  POST   /groups/{id}/leave/                    -> leaveGroup
//  POST   /groups/{id}/add_member/               -> addGroupMember { user_id }
//  POST   /groups/{id}/remove_member/            -> removeGroupMember { user_id }
// Notes:
//  - Only leader can update group (name/description/leader change) or add/remove members.
//  - Leader change via PATCH leader_id.
//  - Leaving group: if leader leaves, backend should auto-assign a new leader or archive group.
//  - Consider using DELETE /group-memberships/{id}/ for leave/remove in RESTful alternative.

export async function getGroup(id: number): Promise<ProfileGroup> {
	if (USE_MOCK) {
		const m = await loadMock()
		// derive from any user's perspective (take leader or first member)
		const base = (m as any).groups?.find?.((g: ProfileGroup) => g.id === id)
		if (!base) throw new Error('Not found')
		const membersMap = (m as any).groupMembers as Record<number, number[]>
		const users = (m as any).users as any[]
		const memberIds = membersMap[id] || []
		const members: GroupMember[] = memberIds.map((uid, idx) => ({
			id: uid,
			full_name: users.find(u => u.id === uid)?.full_name || 'user#' + uid,
			is_leader: idx === 0,
		}))
		return {
			...base,
			members_count: memberIds.length,
			members,
			is_leader: false,
			can_manage: false,
		}
	}
	const rawResp: any = await http(`/groups/${id}/`, { auth: true })
	const raw: any = camelizeResponse<ProfileGroup & { memberships?: any[] }>(
		rawResp
	)
	// Backend returns 'memberships' (each with user + role). Map to frontend 'members'.
	if (!raw.members && Array.isArray((raw as any).memberships)) {
		const members: GroupMember[] = raw.memberships.map((m: any) => ({
			id: m.user?.id ?? m.userId ?? m.id,
			full_name:
				m.user?.fullName ||
				(m.user
					? `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() ||
					  m.user.username
					: 'user#' + (m.user?.id ?? '')),
			is_leader: m.role === 'leader',
		}))
		raw.members = members
		if (typeof raw.members_count === 'undefined')
			raw.members_count = members.length
	}
	return raw as ProfileGroup
}

export async function listUserGroups(userId: number): Promise<ProfileGroup[]> {
	if (USE_MOCK) {
		const m = await loadMock()
		const p = await m.getProfileDetail(userId, userId)
		return p?.groups || []
	}
	const raw = await http(`/users/${userId}/groups/`, { auth: true })
	return camelizeResponse<ProfileGroup[]>(raw)
}

export async function createGroupApi(
	currentUserId: number,
	input: { name: string; description?: string; member_ids: number[] }
) {
	if (USE_MOCK) {
		const m = await loadMock()
		return m.createGroup(currentUserId, input)
	}
	const raw = await http(`/groups/`, {
		method: 'POST',
		auth: true,
		body: JSON.stringify(input),
	})
	return camelizeResponse<ProfileGroup>(raw)
}

export async function updateGroupApi(
	groupId: number,
	patch: Partial<{ name: string; description: string; leader_id: number }>
) {
	if (USE_MOCK) {
		const m = await loadMock()
		return m.updateGroup(groupId, patch)
	}
	const raw = await http(`/groups/${groupId}/`, {
		method: 'PATCH',
		auth: true,
		body: JSON.stringify(patch),
	})
	return camelizeResponse<ProfileGroup>(raw)
}

export async function deleteGroupApi(groupId: number) {
	if (USE_MOCK) {
		const m = await loadMock()
		return m.deleteGroup(groupId)
	}
	await http(`/groups/${groupId}/`, { method: 'DELETE', auth: true })
}

export async function leaveGroupApi(groupId: number) {
	if (USE_MOCK) {
		const m = await loadMock()
		return m.leaveGroup(1, groupId)
	}
	await http(`/groups/${groupId}/leave/`, { method: 'POST', auth: true })
}

export async function addGroupMemberApi(groupId: number, userId: number) {
	if (USE_MOCK) {
		const m = await loadMock()
		return m.addGroupMember(groupId, userId)
	}
	await http(`/groups/${groupId}/add_member/`, {
		method: 'POST',
		auth: true,
		body: JSON.stringify({ user_id: userId }),
	})
}

export async function removeGroupMemberApi(groupId: number, userId: number) {
	if (USE_MOCK) {
		const m = await loadMock()
		return m.removeGroupMember(groupId, userId)
	}
	await http(`/groups/${groupId}/remove_member/`, {
		method: 'POST',
		auth: true,
		body: JSON.stringify({ user_id: userId }),
	})
}
