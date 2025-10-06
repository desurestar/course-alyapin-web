import type {
	ArticleRef,
	Employee,
	GroupMember,
	ResearchGroup,
	UserRef,
} from '../components/list/list'
import {
	articles as baseArticles,
	employees as baseEmployees,
	groups as baseGroups,
	users as baseUsers,
} from './list.mocks'

// Связка пользователь ↔ сотрудник (если у аккаунта есть карточка сотрудника)
export type UserEmployeeLink = { userId: number; employeeId: number }
export const userEmployeeLinks: UserEmployeeLink[] = [
	{ userId: 1, employeeId: 1 },
	{ userId: 2, employeeId: 2 },
]

export type GroupMembership = { userId: number; groupId: number; role: string }
export const groupMemberships: GroupMembership[] = [
	{ userId: 1, groupId: 1, role: 'Руководитель' },
	{ userId: 1, groupId: 2, role: 'Участник' },
	{ userId: 2, groupId: 2, role: 'Участник' },
	{ userId: 2, groupId: 3, role: 'Участник' },
]

export type ArticleAuthor = { articleId: number; userId: number }
export const articleAuthors: ArticleAuthor[] = [
	{ articleId: 1, userId: 1 },
	{ articleId: 1, userId: 2 },
	{ articleId: 2, userId: 2 },
]

export function getUserById(id: number): UserRef | undefined {
	return baseUsers.find(u => u.id === id)
}

export function getEmployeeByUserId(userId: number): Employee | undefined {
	const link = userEmployeeLinks.find(l => l.userId === userId)
	if (!link) return undefined
	return baseEmployees.find(e => e.id === link.employeeId)
}

export function getUserIdByEmployeeId(employeeId: number): number | undefined {
	return userEmployeeLinks.find(l => l.employeeId === employeeId)?.userId
}

// NEW: группы пользователя с ролью участия
export function getGroupsByUserId(
	userId: number
): (ResearchGroup & { membershipRole: string })[] {
	const memberships = groupMemberships.filter(m => m.userId === userId)
	return memberships
		.map(m => {
			const g = baseGroups.find(bg => bg.id === m.groupId)
			if (!g) return undefined
			return { ...g, membershipRole: m.role }
		})
		.filter(Boolean) as (ResearchGroup & { membershipRole: string })[]
}

export function getGroupById(id: number): ResearchGroup | undefined {
	return baseGroups.find(g => g.id === id)
}

export function getGroupMembersByGroupId(groupId: number): GroupMember[] {
	const memberships = groupMemberships.filter(m => m.groupId === groupId)
	return memberships.map(m => {
		const empId = userEmployeeLinks.find(l => l.userId === m.userId)?.employeeId
		const fullName =
			(empId && baseEmployees.find(e => e.id === empId)?.fullName) ||
			baseUsers.find(u => u.id === m.userId)?.username ||
			`user#${m.userId}`
		return { id: m.userId, fullName, role: m.role }
	})
}

// Статьи пользователя
export function getArticlesByUserId(userId: number): ArticleRef[] {
	const ids = new Set(
		articleAuthors.filter(a => a.userId === userId).map(a => a.articleId)
	)
	return baseArticles.filter(a => ids.has(a.id))
}

// Статьи сотрудника (через связь employee -> user)
export function getArticlesByEmployeeId(employeeId: number): ArticleRef[] {
	const userId = getUserIdByEmployeeId(employeeId)
	if (!userId) return []
	return getArticlesByUserId(userId)
}

export function getArticlesByGroupId(groupId: number): ArticleRef[] {
	const userIds = new Set(
		groupMemberships.filter(m => m.groupId === groupId).map(m => m.userId)
	)
	const articleIds = new Set(
		articleAuthors.filter(a => userIds.has(a.userId)).map(a => a.articleId)
	)
	return baseArticles.filter(a => articleIds.has(a.id))
}
