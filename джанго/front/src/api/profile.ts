import type { UserPublic } from '../types/auth'
import type {
	GroupDetail,
	GroupMemberDetail,
	GroupProject,
	NewGroupArticleInput,
	NewGroupProjectInput,
	UpdateGroupArticleInput,
	UpdateGroupProjectInput,
} from '../types/group'
import type {
	GroupMember,
	NewArticleInput,
	NewGroupInput,
	ProfileArticle,
	ProfileDetail,
	ProfileGroup,
	UpdateArticleInput,
} from '../types/profile'
import { getAccessToken } from './http'

// In-memory mock state (replace with real API later)
// Added optional avatar property (data URL) to user objects for mock purposes.
interface MockUser extends UserPublic {
	avatar?: string
}

let users: MockUser[] = [
	{
		id: 1,
		first_name: 'Иван',
		last_name: 'Иванов',
		email: 'ivan@example.com',
		full_name: 'Иван Иванов',
		phone: '+79990000001',
		avatar: undefined,
	},
	{
		id: 2,
		first_name: 'Пётр',
		last_name: 'Петров',
		email: 'petr@example.com',
		full_name: 'Пётр Петров',
		phone: '+79990000002',
		avatar: undefined,
	},
	{
		id: 3,
		first_name: 'Анна',
		last_name: 'Сидорова',
		email: 'anna@example.com',
		full_name: 'Анна Сидорова',
		phone: '+79990000003',
		avatar: undefined,
	},
]

let articles: ProfileArticle[] = [
	{
		id: 1,
		title: 'Исследование алгоритмов',
		authors: [
			{ id: 1, full_name: 'Иван Иванов' },
			{ id: 2, full_name: 'Пётр Петров' },
		],
	},
	{
		id: 2,
		title: 'Применение ИИ',
		authors: [{ id: 2, full_name: 'Пётр Петров' }],
	},
]
let nextArticleId = 3

let groups: ProfileGroup[] = [
	{
		id: 1,
		name: 'Группа Алгоритмов',
		description: 'Алг. и структуры',
		members_count: 2,
		leader_id: 1,
		leader_name: 'Иван Иванов',
	},
	{
		id: 2,
		name: 'Группа ИИ',
		description: 'ML & AI',
		members_count: 3,
		leader_id: 2,
		leader_name: 'Пётр Петров',
	},
]
let nextGroupId = 3

// group membership: map group -> member ids, first one is leader
let groupMembers: Record<number, number[]> = {
	1: [1, 2],
	2: [2, 1, 3],
}

// Group articles (per group) store only article ids referencing global articles for simplicity.
// For group-only articles we will create separate entries (still in articles array) flagged by group mapping.
let groupArticles: Record<number, number[]> = {
	1: [1], // group 1 includes article 1
	2: [2],
}

// Simple in-memory projects storage
let groupProjects: Record<number, GroupProject[]> = {
	1: [
		{
			id: 1,
			title: 'Система анализа данных',
			status: 'in_progress',
			start_date: '2025-01-10',
			supervisor_id: 1,
			supervisor_name: 'Иван Иванов',
			can_edit: true,
		},
	],
	2: [],
}
let nextProjectId = 2

function buildMembersArray(groupId: number): GroupMember[] {
	const memberIds = groupMembers[groupId] || []
	return memberIds.map((id, idx) => {
		const u = users.find(u => u.id === id)
		return {
			id,
			full_name: u?.full_name || `user#${id}`,
			is_leader: idx === 0,
		}
	})
}

function computeGroupsForUser(userId: number): ProfileGroup[] {
	const res: ProfileGroup[] = []
	for (const g of groups) {
		const members = groupMembers[g.id] || []
		if (members.includes(userId)) {
			const leader = members[0]
			res.push({
				...g,
				role: leader === userId ? 'Руководитель' : 'Участник',
				is_leader: leader === userId,
				members_count: members.length,
				leader_id: g.leader_id ?? leader,
				leader_name:
					g.leader_name || users.find(u => u.id === leader)?.full_name || '—',
				can_manage: leader === userId,
				members: buildMembersArray(g.id),
			})
		}
	}
	return res
}

function buildGroupDetail(
	groupId: number,
	currentUserId: number
): GroupDetail | null {
	const base = groups.find(g => g.id === groupId)
	if (!base) return null
	const membersIds = groupMembers[groupId] || []
	const leader = membersIds[0]
	const members: GroupMemberDetail[] = buildMembersArray(groupId).map(m => ({
		id: m.id,
		full_name: m.full_name,
		is_leader: m.is_leader,
	}))
	const articlesForGroup: ProfileArticle[] = (groupArticles[groupId] || [])
		.map(aid => articles.find(a => a.id === aid))
		.filter(Boolean)
		.map(a => ({
			...a!,
			can_edit: a!.authors.some(au => au.id === currentUserId),
		}))
	const projects: GroupProject[] = (groupProjects[groupId] || []).map(p => ({
		...p,
		can_edit: leader === currentUserId,
	}))
	return {
		id: base.id,
		name: base.name,
		description: base.description,
		leader_id: base.leader_id ?? leader,
		leader_name: base.leader_name,
		members,
		articles: articlesForGroup,
		projects,
		members_count: membersIds.length,
		can_manage: leader === currentUserId,
		is_member: membersIds.includes(currentUserId),
		is_leader: leader === currentUserId,
	}
}

export async function getGroupDetail(
	groupId: number,
	currentUserId: number
): Promise<GroupDetail | null> {
	await delay()
	return buildGroupDetail(groupId, currentUserId)
}

export async function addGroupArticle(
	groupId: number,
	currentUserId: number,
	input: NewGroupArticleInput
): Promise<ProfileArticle> {
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
	await delay()
	const leader = groupMembers[groupId]?.[0]
	if (leader !== currentUserId) throw new Error('Нет прав')
	const project: GroupProject = {
		id: nextProjectId++,
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
	await delay()
	const leader = groupMembers[groupId]?.[0]
	if (leader !== currentUserId) throw new Error('Нет прав')
	groupProjects[groupId] = (groupProjects[groupId] || []).filter(
		p => p.id !== projectId
	)
}

function computeArticlesForUser(userId: number): ProfileArticle[] {
	return articles
		.filter(a => a.authors.some(au => au.id === userId))
		.map(a => ({
			...a,
			can_edit: a.authors.some(au => au.id === userId),
		}))
}

export async function getProfileDetail(
	targetUserId: number,
	currentUserId: number
): Promise<ProfileDetail | null> {
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
	await delay()
	if (!input.title.trim()) throw new Error('Название обязательно')
	const authorIds = Array.from(new Set([currentUserId, ...input.co_author_ids]))
	const authorObjs = authorIds.map(id => {
		const u = users.find(u => u.id === id)
		return { id, full_name: u?.full_name || `user#${id}` }
	})
	const art: ProfileArticle = {
		id: nextArticleId++,
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
	await delay()
	if (!input.name.trim()) throw new Error('Название группы обязательно')
	const g: ProfileGroup = {
		id: nextGroupId++,
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
	await delay()
	const members = groupMembers[groupId]
	if (!members) return
	groupMembers[groupId] = members.filter(id => id !== currentUserId)
	// If leader left, assign new leader (first remaining) or delete group
	if (members[0] === currentUserId) {
		if (groupMembers[groupId].length === 0) {
			groups = groups.filter(g => g.id !== groupId)
			delete groupMembers[groupId]
		}
	}
}

export async function updateGroup(
	groupId: number,
	patch: Partial<{ name: string; description: string; leader_id: number }>
): Promise<ProfileGroup> {
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
	await delay()
	groups = groups.filter(g => g.id !== groupId)
	delete groupMembers[groupId]
}

export async function addGroupMember(groupId: number, userId: number) {
	await delay()
	const members = groupMembers[groupId]
	if (!members) throw new Error('Group not found')
	if (!members.includes(userId)) members.push(userId)
}

export async function removeGroupMember(groupId: number, userId: number) {
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
	await delay()
	return users.filter(u => !excludeIds.includes(u.id))
}

function delay(ms = 250) {
	return new Promise(r => setTimeout(r, ms))
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

void getAccessToken // placeholder for future auth header usage
