// Separated mock in-memory state for profile-related domain.
// This module is ONLY used when API_USE_MOCK = true. Real HTTP mode ignores it.
import type { UserPublic } from '../types/auth'
import type { GroupProject } from '../types/group'
import type {
	GroupMember,
	ProfileArticle,
	ProfileGroup,
} from '../types/profile'

// ----- Core mutable state ----- //
export interface MockUser extends UserPublic {
	avatar?: string
	position?: string
	bio?: string
	phone?: string | null
}

export let users: MockUser[] = [
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

export let articles: ProfileArticle[] = [
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

export let groups: ProfileGroup[] = [
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

export let groupMembers: Record<number, number[]> = {
	1: [1, 2],
	2: [2, 1, 3],
}

export let groupArticles: Record<number, number[]> = { 1: [1], 2: [2] }

export let groupProjects: Record<number, GroupProject[]> = {
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

let _nextArticleId = 3
let _nextGroupId = 3
let _nextProjectId = 2

export function allocArticleId() {
	return _nextArticleId++
}
export function allocGroupId() {
	return _nextGroupId++
}
export function allocProjectId() {
	return _nextProjectId++
}

// ----- Helpers ----- //
export function delay(ms = 250) {
	return new Promise(r => setTimeout(r, ms))
}

export function buildMembersArray(groupId: number): GroupMember[] {
	const memberIds = groupMembers[groupId] || []
	return memberIds.map((id, idx) => {
		const u = users.find(u => u.id === id)
		return { id, full_name: u?.full_name || `user#${id}`, is_leader: idx === 0 }
	})
}

export function computeGroupsForUser(userId: number): ProfileGroup[] {
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

export function computeArticlesForUser(userId: number): ProfileArticle[] {
	return articles
		.filter(a => a.authors.some(au => au.id === userId))
		.map(a => ({ ...a, can_edit: a.authors.some(au => au.id === userId) }))
}

export function buildGroupDetail(groupId: number, currentUserId: number) {
	const base = groups.find(g => g.id === groupId)
	if (!base) return null
	const membersIds = groupMembers[groupId] || []
	const leader = membersIds[0]
	const members = buildMembersArray(groupId).map(m => ({
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
