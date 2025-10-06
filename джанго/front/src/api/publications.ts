// Publications API abstraction (mock + HTTP branching)
import type {
	NewArticleInput,
	ProfileArticle,
	UpdateArticleInput,
} from '../types/profile'
import { API_USE_MOCK } from './config'
import { http } from './http'
import { articles, delay, users } from './profile.mockState'

export interface PublicationListParams {
	page?: number
	page_size?: number
	search?: string
	author_id?: number // filter by author (for "mine")
}

export interface PaginatedPublications {
	results: ProfileArticle[]
	count: number
	page: number
	page_size: number
}

function paginate<T>(
	arr: T[],
	page = 1,
	page_size = 20
): PaginatedPublications & { results: T[] } {
	const start = (page - 1) * page_size
	const slice = arr.slice(start, start + page_size)
	return { results: slice as any, count: arr.length, page, page_size }
}

export async function listPublications(
	params: PublicationListParams = {}
): Promise<PaginatedPublications> {
	const { page = 1, page_size = 20, search, author_id } = params
	if (!API_USE_MOCK) {
		const query = new URLSearchParams()
		query.set('page', String(page))
		query.set('page_size', String(page_size))
		if (search) query.set('search', search)
		if (author_id) query.set('author_id', String(author_id))
		const data = await http<PaginatedPublications>(
			`/articles/?${query.toString()}`,
			{ auth: true }
		)
		return data
	}
	await delay()
	let list = articles.map(a => ({ ...a, can_edit: true })) // mock: assume editable when author
	if (author_id)
		list = list.filter(a => a.authors.some(au => au.id === author_id))
	if (search) {
		const s = search.toLowerCase()
		list = list.filter(a => a.title.toLowerCase().includes(s))
	}
	// Enrich authors names from users if missing
	list = list.map(a => ({
		...a,
		authors: a.authors.map(au => ({
			...au,
			full_name:
				au.full_name ||
				users.find(u => u.id === au.id)?.full_name ||
				`user#${au.id}`,
		})),
	}))
	return paginate(list, page, page_size)
}

// Single publication retrieval (detail)
export async function getPublication(id: number): Promise<ProfileArticle> {
	if (!API_USE_MOCK) {
		return http<ProfileArticle>(`/articles/${id}/`, { auth: true })
	}
	await delay()
	const art = articles.find(a => a.id === id)
	if (!art) throw new Error('Публикация не найдена')
	return {
		...art,
		authors: art.authors.map(au => ({
			...au,
			full_name:
				au.full_name ||
				users.find(u => u.id === au.id)?.full_name ||
				`user#${au.id}`,
		})),
		can_edit: true,
	}
}

// List publications for specific user
export async function listUserPublications(
	userId: number
): Promise<ProfileArticle[]> {
	if (!API_USE_MOCK) {
		return http<ProfileArticle[]>(`/users/${userId}/articles/`, { auth: true })
	}
	await delay()
	return articles
		.filter(a => a.authors.some(au => au.id === userId))
		.map(a => ({
			...a,
			authors: a.authors.map(au => ({
				...au,
				full_name:
					au.full_name ||
					users.find(u => u.id === au.id)?.full_name ||
					`user#${au.id}`,
			})),
			can_edit: true,
		}))
}

// Create publication
export async function createPublication(
	currentUserId: number,
	input: NewArticleInput
): Promise<ProfileArticle> {
	if (!API_USE_MOCK) {
		return http<ProfileArticle>(`/articles/`, {
			method: 'POST',
			auth: true,
			body: JSON.stringify(input),
		})
	}
	await delay()
	if (!input.title?.trim()) throw new Error('Название обязательно')
	const nextId = articles.reduce((m, a) => Math.max(m, a.id), 0) + 1
	const authorIds = Array.from(new Set([currentUserId, ...input.co_author_ids]))
	const authors = authorIds.map(id => {
		const u = users.find(u => u.id === id)
		return { id, full_name: u?.full_name || `user#${id}` }
	})
	const art: ProfileArticle = {
		id: nextId,
		title: input.title.trim(),
		abstract: input.abstract?.trim() || undefined,
		link: input.link?.trim() || undefined,
		authors,
		can_edit: true,
	}
	articles.push(art)
	return art
}

// Update publication
export async function updatePublication(
	id: number,
	input: UpdateArticleInput
): Promise<ProfileArticle> {
	if (!API_USE_MOCK) {
		return http<ProfileArticle>(`/articles/${id}/`, {
			method: 'PATCH',
			auth: true,
			body: JSON.stringify(input),
		})
	}
	await delay()
	const idx = articles.findIndex(a => a.id === id)
	if (idx === -1) throw new Error('Не найдено')
	const cur = articles[idx]
	if (input.title !== undefined) cur.title = input.title.trim()
	if (input.abstract !== undefined)
		cur.abstract = input.abstract?.trim() || undefined
	if (input.link !== undefined) cur.link = input.link?.trim() || undefined
	if (input.co_author_ids) {
		cur.authors = input.co_author_ids.map(uid => {
			const u = users.find(u => u.id === uid)
			return { id: uid, full_name: u?.full_name || `user#${uid}` }
		})
	}
	return { ...cur, can_edit: true }
}

// Delete publication
export async function deletePublication(id: number): Promise<void> {
	if (!API_USE_MOCK) {
		await http(`/articles/${id}/`, { method: 'DELETE', auth: true })
		return
	}
	await delay()
	const idx = articles.findIndex(a => a.id === id)
	if (idx !== -1) articles.splice(idx, 1)
}
