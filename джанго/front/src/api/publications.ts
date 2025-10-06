// Publications API abstraction (mock + HTTP branching)
import type { ProfileArticle } from '../types/profile'
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
