// Unified profile API facade.
// This file no longer содержит моковые данные. Логика mock вынесена в `profile.mockState.ts`.
// Переключение осуществляется через `API_USE_MOCK` (см. config.ts).
// В реальном режиме использует HTTP функции: profileHttp.ts, articles.ts, groups.ts.

import type { UserPublic } from '../types/auth'
import type {
	NewArticleInput,
	NewGroupInput,
	ProfileArticle,
	ProfileDetail,
	ProfileGroup,
	UpdateArticleInput,
} from '../types/profile'
import {
	createArticleApi,
	deleteArticleApi,
	updateArticleApi,
} from './articles'
import {
	addGroupMemberApi,
	createGroupApi,
	deleteGroupApi,
	leaveGroupApi,
	removeGroupMemberApi,
	updateGroupApi,
} from './groups'
import {
	getProfileDetailHttp,
	searchUsers,
	updateProfileHttp,
} from './profileHttp'

// NOTE: В режиме моков (API_USE_MOCK = true) динамически импортируем предыдущее содержимое (которое теперь разнесено между profile.mockState.ts и исторической логикой).
// Для совместимости оставляем те же имена экспорируемых функций.

const USE_MOCK = false
let mockModule: any | null = null
async function ensureMock() {
	if (!mockModule) {
		// Динамически импортируем старый модуль мок-реализации (используем отдельный адаптер).
		mockModule = await import('./profile.mockState')
		// Чтобы сохранить старые поведенческие функции (createArticle и т.п.), догрузим «расширение» из временного файла если нужно.
		// Т.к. логика мутаций (createArticle, updateGroup и т.д.) раньше была внутри этого файла,
		// перенести её можно в отдельный lightweight runtime модуль (пока оставим TODO):
		// TODO: вынести мутационные mock-функции в отдельный файл (profile.mockActions.ts) и импортировать здесь.
		mockModule = { ...mockModule, ...(await import('./profile')) }
	}
	return mockModule
}

// ------------------- PROFILE ------------------- //
export async function getProfileDetail(
	targetUserId: number,
	currentUserId: number
): Promise<ProfileDetail | null> {
	if (USE_MOCK) {
		// В мок-режиме: собираем вручную на основе mockState helper функций
		const m = await ensureMock()
		const users: any[] = m.users
		const u = users.find(u => u.id === targetUserId)
		if (!u) return null
		const articles = m.computeArticlesForUser(targetUserId)
		const groups = m.computeGroupsForUser(targetUserId)
		return {
			...u,
			articles,
			groups,
			can_edit: targetUserId === currentUserId,
			stats: { articles: articles.length, groups: groups.length },
		}
	}
	const detail = await getProfileDetailHttp(targetUserId)
	// Client-only дополнения (если бек их не вернёт):
	if (detail && typeof detail.can_edit === 'undefined') {
		detail.can_edit = detail.id === currentUserId // fallback heuristic
	}
	return detail
}

export async function updateProfile(
	userId: number,
	patch: Partial<ProfileDetail>
): Promise<ProfileDetail> {
	if (USE_MOCK) {
		const m = await ensureMock()
		const idx = m.users.findIndex((u: any) => u.id === userId)
		if (idx === -1) throw new Error('User not found')
		m.users[idx] = { ...m.users[idx], ...patch }
		const full = await getProfileDetail(userId, userId)
		return full as ProfileDetail
	}
	return updateProfileHttp(userId, patch)
}

// ------------------- ARTICLES ------------------- //
export async function createArticle(
	currentUserId: number,
	input: NewArticleInput
): Promise<ProfileArticle> {
	if (USE_MOCK) {
		const m = await ensureMock()
		if (!input.title?.trim()) throw new Error('Название обязательно')
		const id = m.allocArticleId()
		const authorIds = Array.from(
			new Set([currentUserId, ...input.co_author_ids])
		)
		const authors = authorIds.map((id: number) => {
			const u = m.users.find((u: any) => u.id === id)
			return { id, full_name: u?.full_name || `user#${id}` }
		})
		const article: ProfileArticle = {
			id,
			title: input.title.trim(),
			abstract: input.abstract?.trim() || undefined,
			link: input.link?.trim() || undefined,
			authors,
			can_edit: true,
		}
		m.articles.push(article)
		return article
	}
	return createArticleApi(currentUserId, input)
}

export async function updateArticle(
	articleId: number,
	currentUserId: number,
	patch: UpdateArticleInput
): Promise<ProfileArticle> {
	if (USE_MOCK) {
		const m = await ensureMock()
		const idx = m.articles.findIndex((a: any) => a.id === articleId)
		if (idx === -1) throw new Error('Article not found')
		const art = m.articles[idx]
		if (!art.authors.some((a: any) => a.id === currentUserId))
			throw new Error('Нет прав на редактирование')
		if (patch.title !== undefined) art.title = patch.title.trim()
		if (patch.abstract !== undefined)
			art.abstract = patch.abstract?.trim() || undefined
		if (patch.link !== undefined) art.link = patch.link?.trim() || undefined
		if (patch.co_author_ids) {
			const unique = Array.from(
				new Set([currentUserId, ...patch.co_author_ids])
			)
			art.authors = unique.map(id => {
				const u = m.users.find((u: any) => u.id === id)
				return { id, full_name: u?.full_name || `user#${id}` }
			})
		}
		return { ...art, can_edit: true }
	}
	return updateArticleApi(articleId, patch)
}

export async function deleteArticle(articleId: number, currentUserId: number) {
	if (USE_MOCK) {
		const m = await ensureMock()
		const idx = m.articles.findIndex((a: any) => a.id === articleId)
		if (idx === -1) return
		const art = m.articles[idx]
		if (!art.authors.some((a: any) => a.id === currentUserId))
			throw new Error('Нет прав')
		m.articles.splice(idx, 1)
		return
	}
	return deleteArticleApi(articleId)
}

export async function listCoAuthorCandidates(
	excludeIds: number[]
): Promise<UserPublic[]> {
	if (USE_MOCK) {
		const m = await ensureMock()
		return m.users.filter((u: any) => !excludeIds.includes(u.id))
	}
	// TODO: заменить на реальный поиск (сейчас – простая загрузка без фильтра кроме client-side)
	const all = await searchUsers('')
	return all.filter(u => !excludeIds.includes(u.id))
}

// ------------------- GROUPS ------------------- //
export async function createGroup(
	currentUserId: number,
	input: NewGroupInput
): Promise<ProfileGroup> {
	if (USE_MOCK) {
		const m = await ensureMock()
		if (!input.name?.trim()) throw new Error('Название группы обязательно')
		const id = m.allocGroupId()
		const group: ProfileGroup = {
			id,
			name: input.name.trim(),
			description: input.description?.trim(),
			members_count: 1 + input.member_ids.length,
			leader_id: currentUserId,
			leader_name: m.users.find((u: any) => u.id === currentUserId)?.full_name,
			role: 'Руководитель',
			is_leader: true,
			can_manage: true,
		}
		m.groups.push(group)
		m.groupMembers[id] = [
			currentUserId,
			...input.member_ids.filter(id2 => id2 !== currentUserId),
		]
		group.members_count = m.groupMembers[id].length
		return { ...group }
	}
	return createGroupApi(currentUserId, input)
}

export async function updateGroup(
	groupId: number,
	patch: Partial<{ name: string; description: string; leader_id: number }>
): Promise<ProfileGroup> {
	if (USE_MOCK) {
		const m = await ensureMock()
		const idx = m.groups.findIndex((g: any) => g.id === groupId)
		if (idx === -1) throw new Error('Group not found')
		const group = m.groups[idx]
		if (patch.name !== undefined) group.name = patch.name.trim()
		if (patch.description !== undefined)
			group.description = patch.description?.trim() || undefined
		if (patch.leader_id !== undefined) {
			const members = m.groupMembers[groupId] || []
			if (!members.includes(patch.leader_id))
				throw new Error('Новый руководитель не является участником')
			m.groupMembers[groupId] = [
				patch.leader_id,
				...members.filter((id: number) => id !== patch.leader_id),
			]
			group.leader_id = patch.leader_id
			group.leader_name = m.users.find(
				(u: any) => u.id === patch.leader_id
			)?.full_name
		}
		return { ...group }
	}
	return updateGroupApi(groupId, patch)
}

export async function deleteGroup(groupId: number): Promise<void> {
	if (USE_MOCK) {
		const m = await ensureMock()
		m.groups = m.groups.filter((g: any) => g.id !== groupId)
		delete m.groupMembers[groupId]
		return
	}
	return deleteGroupApi(groupId)
}

export async function leaveGroup(
	currentUserId: number,
	groupId: number
): Promise<void> {
	if (USE_MOCK) {
		const m = await ensureMock()
		const members = m.groupMembers[groupId]
		if (!members) return
		m.groupMembers[groupId] = members.filter(
			(id: number) => id !== currentUserId
		)
		if (members[0] === currentUserId && m.groupMembers[groupId].length === 0) {
			m.groups = m.groups.filter((g: any) => g.id !== groupId)
			delete m.groupMembers[groupId]
		}
		return
	}
	return leaveGroupApi(groupId)
}

export async function addGroupMember(groupId: number, userId: number) {
	if (USE_MOCK) {
		const m = await ensureMock()
		const members = m.groupMembers[groupId]
		if (!members) throw new Error('Group not found')
		if (!members.includes(userId)) members.push(userId)
		return
	}
	return addGroupMemberApi(groupId, userId)
}

export async function removeGroupMember(groupId: number, userId: number) {
	if (USE_MOCK) {
		const m = await ensureMock()
		const members = m.groupMembers[groupId]
		if (!members) throw new Error('Group not found')
		if (members[0] === userId) throw new Error('Нельзя удалить руководителя')
		m.groupMembers[groupId] = members.filter((id: number) => id !== userId)
		return
	}
	return removeGroupMemberApi(groupId, userId)
}

// ------------------- AVATAR UPLOAD ------------------- //
// Front-ready abstraction: in HTTP mode sends multipart PATCH to /users/{id}/
// In mock mode stores base64 data URL in mock user record.
export async function uploadAvatar(
	userId: number,
	file: File
): Promise<string> {
	if (USE_MOCK) {
		const m = await ensureMock()
		const toDataUrl = (f: File) =>
			new Promise<string>((resolve, reject) => {
				const reader = new FileReader()
				reader.onerror = () => reject(new Error('File read error'))
				reader.onload = () => resolve(reader.result as string)
				reader.readAsDataURL(f)
			})
		const dataUrl = await toDataUrl(file)
		const idx = m.users.findIndex((u: any) => u.id === userId)
		if (idx !== -1) m.users[idx].avatar = dataUrl
		return dataUrl
	}
	const fd = new FormData()
	fd.append('avatar', file)
	const resp = await fetch(`/api/users/${userId}/`, {
		method: 'PATCH',
		body: fd,
	})
	if (!resp.ok) throw new Error('Не удалось загрузить аватар')
	const json = await resp.json()
	return json.avatar
}

// ------------------- NOTES ------------------- //
// Когда реальный бек будет готов:
// 1. Поменять API_USE_MOCK = false (или читать из env VITE_API_USE_MOCK)
// 2. Удалить моковые ветки после стабилизации.
// 3. Уточнить какие поля (can_edit, can_manage, stats) возвращает сервер и убрать клиентские вычисления.
// 4. Аватар: реализовать upload через multipart/form-data или отдельный endpoint.

// Экспорт некоторых символов для других модулей, которые сейчас косвенно ожидали их (например, articles.ts/groupts.ts в mock режиме читали глобальные массивы через импорт profile):
// Для real режима эти экспорты не несут данных.
export const __mock = { USE_MOCK }
