import type { UserPublic } from '../types/auth'
import type {
	NewArticleInput,
	NewGroupInput,
	ProfileArticle,
	ProfileDetail,
	ProfileGroup,
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
	},
	{ id: 2, name: 'Группа ИИ', description: 'ML & AI', members_count: 3 },
]
let nextGroupId = 3

// group membership: map group -> member ids, first one is leader
let groupMembers: Record<number, number[]> = {
	1: [1, 2],
	2: [2, 1, 3],
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
			})
		}
	}
	return res
}

function computeArticlesForUser(userId: number): ProfileArticle[] {
	return articles.filter(a => a.authors.some(au => au.id === userId))
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
	return { ...art }
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
	}
	groups.push(g)
	groupMembers[g.id] = [
		currentUserId,
		...input.member_ids.filter(id => id !== currentUserId),
	]
	g.members_count = groupMembers[g.id].length
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
// createGroup -> POST /groups/ { name, description, member_ids }
// leaveGroup -> POST /groups/{id}/leave/ OR DELETE /group-memberships/{id}/
// listCoAuthorCandidates -> GET /users/?search=... (filter on server)

void getAccessToken // placeholder for future auth header usage
