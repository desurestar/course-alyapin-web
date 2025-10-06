// Profile API facade with mock + HTTP branching.
import type { UserPublic } from '../types/auth'
import type {
	GroupDetail,
	GroupProject,
	NewGroupArticleInput,
	NewGroupProjectInput,
	UpdateGroupArticleInput,
	UpdateGroupProjectInput,
} from '../types/group'
import type {
	NewArticleInput,
	NewGroupInput,
	ProfileArticle,
	ProfileDetail,
	ProfileGroup,
	UpdateArticleInput,
} from '../types/profile'
import { adaptArticle, adaptGroupDetail, adaptProfileDetail } from './adapters'
import { API_USE_MOCK } from './config'
import { http } from './http'
import {
	allocArticleId,
	allocGroupId,
	allocProjectId,
	articles,
	buildGroupDetail,
	buildMembersArray,
	computeArticlesForUser,
	computeGroupsForUser,
	delay,
	groupArticles,
	groupMembers,
	groupProjects,
	groups,
	users,
	type MockUser,
} from './profile.mockState'

// (Mock state definitions moved to profile.mockState.ts)

export async function getGroupDetail(
	groupId: number,
	currentUserId: number
): Promise<GroupDetail | null> {
	if (!API_USE_MOCK) {
		const data = await http<any>(`/groups/${groupId}/detail/`, { auth: true })
		return adaptGroupDetail(data)
	}
	await delay()
	return buildGroupDetail(groupId, currentUserId)
}

export async function addGroupArticle(
	groupId: number,
	currentUserId: number,
	input: NewGroupArticleInput
): Promise<ProfileArticle> {
	if (!API_USE_MOCK) {
		const raw = await http<any>(`/groups/${groupId}/articles/`, {
			method: 'POST',
			auth: true,
			body: JSON.stringify({ ...input }),
		})
		return adaptArticle(raw)
	}
	await delay()
	const art = await createArticle(currentUserId, input)
	groupArticles[groupId] = groupArticles[groupId] || []
	groupArticles[groupId].unshift(art.id)
	return art
}

export async function updateGroupArticle(
	groupId: number,
	articleId: number,
	currentUserId: number,
	patch: UpdateGroupArticleInput
): Promise<ProfileArticle> {
	if (!API_USE_MOCK) {
		const raw = await http<any>(`/groups/${groupId}/articles/${articleId}/`, {
			method: 'PATCH',
			auth: true,
			body: JSON.stringify(patch),
		})
		return adaptArticle(raw)
	}
	await delay()
	// Ensure user is member of the group for editing context (light check)
	const members = groupMembers[groupId] || []
	if (!members.includes(currentUserId)) throw new Error('Нет прав')
	const upd = await updateArticle(articleId, currentUserId, patch)
	return upd
}

export async function deleteGroupArticle(
	groupId: number,
	articleId: number,
	currentUserId: number
): Promise<void> {
	if (!API_USE_MOCK) {
		await http<void>(`/groups/${groupId}/articles/${articleId}/`, {
			method: 'DELETE',
			auth: true,
		})
		return
	}
	await delay()
	await deleteArticle(articleId, currentUserId)
	groupArticles[groupId] = (groupArticles[groupId] || []).filter(
		id => id !== articleId
	)
}

export async function createGroupProject(
	groupId: number,
	currentUserId: number,
	input: NewGroupProjectInput
): Promise<GroupProject> {
	if (!API_USE_MOCK) {
		return http<GroupProject>(`/groups/${groupId}/projects/`, {
			method: 'POST',
			auth: true,
			body: JSON.stringify(input),
		})
	}
	await delay()
	const leader = groupMembers[groupId]?.[0]
	if (leader !== currentUserId) throw new Error('Нет прав')
	const project: GroupProject = {
		id: allocProjectId(),
		title: input.title.trim(),
		description: input.description?.trim() || undefined,
		status: input.status || 'planned',
		start_date: input.start_date,
		end_date: input.end_date,
		supervisor_id: currentUserId,
		supervisor_name: users.find(u => u.id === currentUserId)?.full_name,
		can_edit: true,
	}
	groupProjects[groupId] = groupProjects[groupId] || []
	groupProjects[groupId].unshift(project)
	return project
}

export async function updateGroupProject(
	groupId: number,
	projectId: number,
	currentUserId: number,
	patch: UpdateGroupProjectInput
): Promise<GroupProject> {
	if (!API_USE_MOCK) {
		return http<GroupProject>(`/groups/${groupId}/projects/${projectId}/`, {
			method: 'PATCH',
			auth: true,
			body: JSON.stringify(patch),
		})
	}
	await delay()
	const arr = groupProjects[groupId] || []
	const idx = arr.findIndex(p => p.id === projectId)
	if (idx === -1) throw new Error('Project not found')
	const leader = groupMembers[groupId]?.[0]
	if (leader !== currentUserId) throw new Error('Нет прав')
	if (patch.title !== undefined) arr[idx].title = patch.title.trim()
	if (patch.description !== undefined)
		arr[idx].description = patch.description.trim() || undefined
	if (patch.status !== undefined) arr[idx].status = patch.status
	if (patch.start_date !== undefined) arr[idx].start_date = patch.start_date
	if (patch.end_date !== undefined) arr[idx].end_date = patch.end_date
	return { ...arr[idx], can_edit: true }
}

export async function deleteGroupProject(
	groupId: number,
	projectId: number,
	currentUserId: number
): Promise<void> {
	if (!API_USE_MOCK) {
		await http<void>(`/groups/${groupId}/projects/${projectId}/`, {
			method: 'DELETE',
			auth: true,
		})
		return
	}
	await delay()
	const leader = groupMembers[groupId]?.[0]
	if (leader !== currentUserId) throw new Error('Нет прав')
	groupProjects[groupId] = (groupProjects[groupId] || []).filter(
		p => p.id !== projectId
	)
}

export async function getProfileDetail(
	targetUserId: number,
	currentUserId: number
): Promise<ProfileDetail | null> {
	if (!API_USE_MOCK) {
		const raw = await http<any>(`/users/${targetUserId}/profile/`, {
			auth: true,
		})
		return adaptProfileDetail(raw)
	}
	await delay()
	const u = users.find(u => u.id === targetUserId)
	if (!u) return null
	const detail: ProfileDetail = {
		...u,
		articles: computeArticlesForUser(targetUserId),
		groups: computeGroupsForUser(targetUserId),
		can_edit: currentUserId === targetUserId,
		stats: {
			articles: computeArticlesForUser(targetUserId).length,
			groups: computeGroupsForUser(targetUserId).length,
		},
	}
	return detail
}

export async function updateProfile(
	userId: number,
	patch: Partial<
		MockUser & {
			position?: string
			bio?: string
			phone?: string
			avatar?: string
		}
	>
): Promise<MockUser> {
	if (!API_USE_MOCK) {
		return http<MockUser>(`/users/${userId}/`, {
			method: 'PATCH',
			auth: true,
			body: JSON.stringify(patch),
		})
	}
	await delay()
	const idx = users.findIndex(u => u.id === userId)
	if (idx === -1) throw new Error('User not found')
	users[idx] = { ...users[idx], ...patch }
	return { ...users[idx] }
}

export async function createArticle(
	currentUserId: number,
	input: NewArticleInput
): Promise<ProfileArticle> {
	if (!API_USE_MOCK) {
		return http<ProfileArticle>('/articles/', {
			method: 'POST',
			body: JSON.stringify({ ...input }),
			auth: true,
		})
	}
	await delay()
	if (!input.title.trim()) throw new Error('Название обязательно')
	const authorIds = Array.from(new Set([currentUserId, ...input.co_author_ids]))
	const authorObjs = authorIds.map(id => {
		const u = users.find(u => u.id === id)
		return { id, full_name: u?.full_name || `user#${id}` }
	})
	const art: ProfileArticle = {
		id: allocArticleId(),
		title: input.title.trim(),
		abstract: input.abstract?.trim() || undefined,
		link: input.link?.trim() || undefined,
		authors: authorObjs,
	}
	articles.push(art)
	return { ...art, can_edit: true }
}

export async function updateArticle(
	articleId: number,
	currentUserId: number,
	patch: UpdateArticleInput
): Promise<ProfileArticle> {
	if (!API_USE_MOCK) {
		return http<ProfileArticle>(`/articles/${articleId}/`, {
			method: 'PATCH',
			body: JSON.stringify(patch),
			auth: true,
		})
	}
	await delay()
	const idx = articles.findIndex(a => a.id === articleId)
	if (idx === -1) throw new Error('Article not found')
	// Ensure current user is an author
	if (!articles[idx].authors.some(a => a.id === currentUserId)) {
		throw new Error('Нет прав на редактирование')
	}
	if (patch.title !== undefined) articles[idx].title = patch.title.trim()
	if (patch.abstract !== undefined)
		articles[idx].abstract = patch.abstract.trim() || undefined
	if (patch.link !== undefined)
		articles[idx].link = patch.link.trim() || undefined
	if (patch.co_author_ids) {
		const unique = Array.from(new Set([currentUserId, ...patch.co_author_ids]))
		articles[idx].authors = unique.map(id => {
			const u = users.find(u => u.id === id)
			return { id, full_name: u?.full_name || `user#${id}` }
		})
	}
	return { ...articles[idx], can_edit: true }
}

export async function deleteArticle(articleId: number, currentUserId: number) {
	if (!API_USE_MOCK) {
		await http<void>(`/articles/${articleId}/`, {
			method: 'DELETE',
			auth: true,
		})
		return
	}
	await delay()
	const idx = articles.findIndex(a => a.id === articleId)
	if (idx === -1) return
	if (!articles[idx].authors.some(a => a.id === currentUserId)) {
		throw new Error('Нет прав')
	}
	articles.splice(idx, 1)
}

export async function createGroup(
	currentUserId: number,
	input: NewGroupInput
): Promise<ProfileGroup> {
	if (!API_USE_MOCK) {
		return http<ProfileGroup>('/groups/', {
			method: 'POST',
			body: JSON.stringify(input),
			auth: true,
		})
	}
	await delay()
	if (!input.name.trim()) throw new Error('Название группы обязательно')
	const g: ProfileGroup = {
		id: allocGroupId(),
		name: input.name.trim(),
		description: input.description?.trim(),
		members_count: 1,
		is_leader: true,
		role: 'Руководитель',
		leader_id: currentUserId,
		leader_name: users.find(u => u.id === currentUserId)?.full_name,
		can_manage: true,
	}
	groups.push(g)
	groupMembers[g.id] = [
		currentUserId,
		...input.member_ids.filter(id => id !== currentUserId),
	]
	g.members_count = groupMembers[g.id].length
	g.members = buildMembersArray(g.id)
	return { ...g }
}

export async function leaveGroup(
	currentUserId: number,
	groupId: number
): Promise<void> {
	if (!API_USE_MOCK) {
		await http<void>(`/groups/${groupId}/leave/`, {
			method: 'POST',
			auth: true,
		})
		return
	}
	await delay()
	const members = groupMembers[groupId]
	if (!members) return
	groupMembers[groupId] = members.filter(id => id !== currentUserId)
	// If leader left, assign new leader (first remaining) or delete group
	if (members[0] === currentUserId) {
		if (groupMembers[groupId].length === 0) {
			const idx = groups.findIndex(g => g.id === groupId)
			if (idx !== -1) groups.splice(idx, 1)
			delete groupMembers[groupId]
		}
	}
}

export async function updateGroup(
	groupId: number,
	patch: Partial<{ name: string; description: string; leader_id: number }>
): Promise<ProfileGroup> {
	if (!API_USE_MOCK) {
		return http<ProfileGroup>(`/groups/${groupId}/`, {
			method: 'PATCH',
			body: JSON.stringify(patch),
			auth: true,
		})
	}
	await delay()
	const idx = groups.findIndex(g => g.id === groupId)
	if (idx === -1) throw new Error('Group not found')
	// leader change if provided and exists in members
	if (patch.leader_id !== undefined) {
		const members = groupMembers[groupId]
		if (!members.includes(patch.leader_id)) {
			throw new Error('Новый руководитель не является участником')
		}
		// move new leader to front
		groupMembers[groupId] = [
			patch.leader_id,
			...members.filter(id => id !== patch.leader_id),
		]
		groups[idx].leader_id = patch.leader_id
		groups[idx].leader_name =
			users.find(u => u.id === patch.leader_id)?.full_name || '—'
	}
	if (patch.name !== undefined) groups[idx].name = patch.name.trim()
	if (patch.description !== undefined)
		groups[idx].description = patch.description.trim() || undefined
	const leader = groupMembers[groupId][0]
	const updated: ProfileGroup = {
		...groups[idx],
		members_count: groupMembers[groupId].length,
		is_leader: true,
		role: 'Руководитель',
		can_manage: true,
		members: buildMembersArray(groupId),
		leader_id: leader,
		leader_name:
			groups[idx].leader_name || users.find(u => u.id === leader)?.full_name,
	}
	return { ...updated }
}

export async function deleteGroup(groupId: number): Promise<void> {
	if (!API_USE_MOCK) {
		await http<void>(`/groups/${groupId}/`, { method: 'DELETE', auth: true })
		return
	}
	await delay()
	const idx = groups.findIndex(g => g.id === groupId)
	if (idx !== -1) groups.splice(idx, 1)
	delete groupMembers[groupId]
}

export async function addGroupMember(groupId: number, userId: number) {
	if (!API_USE_MOCK) {
		await http(`/groups/${groupId}/add_member/`, {
			method: 'POST',
			body: JSON.stringify({ user_id: userId }),
			auth: true,
		})
		return
	}
	await delay()
	const members = groupMembers[groupId]
	if (!members) throw new Error('Group not found')
	if (!members.includes(userId)) members.push(userId)
}

export async function removeGroupMember(groupId: number, userId: number) {
	if (!API_USE_MOCK) {
		await http(`/groups/${groupId}/remove_member/`, {
			method: 'POST',
			body: JSON.stringify({ user_id: userId }),
			auth: true,
		})
		return
	}
	await delay()
	const members = groupMembers[groupId]
	if (!members) throw new Error('Group not found')
	// Don't remove leader here
	if (members[0] === userId) throw new Error('Нельзя удалить руководителя')
	groupMembers[groupId] = members.filter(id => id !== userId)
}

export async function listCoAuthorCandidates(
	excludeIds: number[]
): Promise<UserPublic[]> {
	if (!API_USE_MOCK) {
		// GET /users/?exclude=1,2   (или /users/?search=... в реальности)
		const qs = excludeIds.length
			? `?exclude=${encodeURIComponent(excludeIds.join(','))}`
			: ''
		return http<UserPublic[]>(`/users/${qs}`, { auth: true })
	}
	await delay()
	return users.filter(u => !excludeIds.includes(u.id))
}

// delay moved to mockState; kept import-based.

// Avatar upload (multipart) for HTTP mode; mock just inlines base64 string
export async function uploadAvatar(
	userId: number,
	file: File
): Promise<string> {
	if (!API_USE_MOCK) {
		const fd = new FormData()
		fd.append('avatar', file)
		const raw = await fetch(`/api/users/${userId}/`, {
			method: 'PATCH',
			body: fd,
			headers: {},
		})
		if (!raw.ok) throw new Error('Upload failed')
		const data = await raw.json()
		return data.avatar
	}
	// Mock: convert to data URL
	const dataUrl = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader()
		reader.onerror = () => reject(new Error('File read error'))
		reader.onload = () => resolve(reader.result as string)
		reader.readAsDataURL(file)
	})
	const u = users.find(u => u.id === userId)
	if (u) u.avatar = dataUrl
	return dataUrl
}

// Backend examples:
// getProfileDetail -> GET /users/{id}/profile/ (includes groups, articles)
// updateProfile -> PATCH /users/{id}/
// createArticle -> POST /articles/ { title, abstract, link, co_author_ids }
// updateArticle -> PATCH /articles/{id}/ { title?, abstract?, link?, co_author_ids? }
// deleteArticle -> DELETE /articles/{id}/
// createGroup -> POST /groups/ { name, description, member_ids }
// leaveGroup -> POST /groups/{id}/leave/ OR DELETE /group-memberships/{id}/
// listCoAuthorCandidates -> GET /users/?search=... (filter on server)
// updateGroup -> PATCH /groups/{id}/ { name?, description?, leader_id? }
// deleteGroup -> DELETE /groups/{id}/
// change leader also via PATCH /groups/{id}/ with leader_id
// addGroupMember -> POST /groups/{id}/add_member/ { user_id }
// removeGroupMember -> POST /groups/{id}/remove_member/ { user_id }
// getGroupDetail -> GET /groups/{id}/detail/ (members, articles, projects)
// addGroupArticle -> POST /groups/{id}/articles/
// updateGroupArticle -> PATCH /groups/{id}/articles/{article_id}/
// deleteGroupArticle -> DELETE /groups/{id}/articles/{article_id}/
// createGroupProject -> POST /groups/{id}/projects/
// updateGroupProject -> PATCH /groups/{id}/projects/{project_id}/
// deleteGroupProject -> DELETE /groups/{id}/projects/{project_id}/

// end
