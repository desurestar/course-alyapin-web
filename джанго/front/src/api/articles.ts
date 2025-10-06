import type {
	NewArticleInput,
	ProfileArticle,
	UpdateArticleInput,
} from '../types/profile'
import { API_USE_MOCK } from './config'
import { http } from './http'

// Toggle to switch between mock profile.ts implementation and real HTTP later
const USE_MOCK = API_USE_MOCK
// Real backend endpoints documented below.

// Backend mapping (intended production endpoints):
//  GET    /articles/{id}/                 -> getArticle
//  GET    /users/{user_id}/articles/      -> listUserArticles
//  POST   /articles/                      -> createArticle (body: { title, abstract?, link?, co_author_ids[] })
//  PATCH  /articles/{id}/                 -> updateArticle (partial)
//  DELETE /articles/{id}/                 -> deleteArticle
// Notes:
//  - Auth required for POST/PATCH/DELETE.
//  - Current user is implicitly an author; backend should enforce.
//  - co_author_ids excludes current user (frontend strips it when editing).
//  - Add pagination & filtering later (?page=, ?search=, ?ordering=).
//  - Errors should return JSON { detail: "..." } for http.ts to surface.

// The mock implementation lives in profile.ts; import those when USE_MOCK.
let mock: any = null
async function loadMock() {
	if (!mock) {
		mock = await import('./profile')
	}
	return mock
}

export async function getArticle(id: number): Promise<ProfileArticle> {
	if (USE_MOCK) {
		const m = await loadMock()
		// derive by scanning global articles from mock module state
		const list = (m as any).articles as ProfileArticle[] | undefined
		const art = list?.find(a => a.id === id)
		if (!art) throw new Error('Not found')
		return art
	}
	return http<ProfileArticle>(`/articles/${id}/`, { auth: true })
}

export async function listUserArticles(
	userId: number
): Promise<ProfileArticle[]> {
	if (USE_MOCK) {
		const m = await loadMock()
		const p = await m.getProfileDetail(userId, userId)
		return p?.articles || []
	}
	return http<ProfileArticle[]>(`/users/${userId}/articles/`, { auth: true })
}

// Generic list with optional search & author filter (& naive pagination mapping to backend plan)
export async function listArticles(
	params: {
		search?: string
		author_id?: number
		page?: number
		page_size?: number
	} = {}
): Promise<{
	results: ProfileArticle[]
	count: number
	page: number
	page_size: number
}> {
	if (USE_MOCK) {
		const m = await loadMock()
		const { search, author_id, page = 1, page_size = 20 } = params
		let list: ProfileArticle[] = (m as any).articles.map(
			(a: ProfileArticle) => ({ ...a, can_edit: true })
		)
		if (author_id)
			list = list.filter(a => a.authors.some(au => au.id === author_id))
		if (search) {
			const q = search.toLowerCase()
			list = list.filter(a => a.title.toLowerCase().includes(q))
		}
		const start = (page - 1) * page_size
		return {
			results: list.slice(start, start + page_size),
			count: list.length,
			page,
			page_size,
		}
	}
	const query = new URLSearchParams()
	if (params.search) query.set('search', params.search)
	if (params.author_id) query.set('author_id', String(params.author_id))
	if (params.page) query.set('page', String(params.page))
	if (params.page_size) query.set('page_size', String(params.page_size))
	return http(`/articles/?${query.toString()}`, { auth: true })
}

export async function createArticleApi(
	currentUserId: number,
	input: NewArticleInput
) {
	if (USE_MOCK) {
		const m = await loadMock()
		return m.createArticle(currentUserId, input)
	}
	return http<ProfileArticle>(`/articles/`, {
		method: 'POST',
		auth: true,
		body: JSON.stringify(input),
	})
}

export async function updateArticleApi(
	articleId: number,
	input: UpdateArticleInput
) {
	if (USE_MOCK) {
		const m = await loadMock()
		return m.updateArticle(articleId, 1, input)
	}
	return http<ProfileArticle>(`/articles/${articleId}/`, {
		method: 'PATCH',
		auth: true,
		body: JSON.stringify(input),
	})
}

export async function deleteArticleApi(articleId: number) {
	if (USE_MOCK) {
		const m = await loadMock()
		return m.deleteArticle(articleId, 1)
	}
	await http(`/articles/${articleId}/`, { method: 'DELETE', auth: true })
}
