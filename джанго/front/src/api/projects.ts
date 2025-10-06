import type {
	NewProjectInput,
	ProjectDetail,
	ProjectSummary,
	UpdateProjectInput,
} from '../types/project'
import { API_USE_MOCK } from './config'
import { http } from './http'

// Intended backend endpoints:
//  GET    /projects/                 -> listProjects (?status=&search=&group=)
//  GET    /projects/{id}/            -> getProject
//  POST   /projects/                 -> createProject (auth, leader/admin)
//  PATCH  /projects/{id}/            -> updateProject (auth, owner)
//  DELETE /projects/{id}/            -> deleteProject
// Notes: Server should include group_id (or null) for navigation to group page.

const USE_MOCK = API_USE_MOCK

// --- Mock state --- //
interface MockProject extends ProjectDetail {}
let mockProjects: MockProject[] = [
	{
		id: 1,
		title: 'Интеллектуальная система анализа публикаций',
		description: 'Разработка сервиса тематического анализа.',
		start_date: '2024-02-01',
		status: 'in_progress',
		budget: 2500000,
		currency: 'RUB',
		grant_id: 101,
		group_id: 1,
		supervisor_name: 'Иванов И.И.',
		tags: ['NLP', 'Visualization'],
		website: 'https://example.com/projects/nlp-analytics',
	},
	{
		id: 2,
		title: 'Платформа управления научными коллективами',
		description: 'Учёт коллективов и ролей.',
		start_date: '2023-09-15',
		end_date: '2025-03-01',
		status: 'planned',
		budget: 1200000,
		currency: 'RUB',
		grant_id: null,
		group_id: 2,
		supervisor_name: 'Петров П.П.',
		tags: ['Django', 'PostgreSQL', 'RBAC'],
	},
	{
		id: 3,
		title: 'Репозиторий данных по грантам и проектам',
		description: 'Хранилище и API для интеграции.',
		start_date: '2022-05-10',
		end_date: '2024-12-31',
		status: 'completed',
		budget: 900000,
		currency: 'RUB',
		grant_id: 77,
		group_id: 1,
		supervisor_name: 'Сидорова А.А.',
		tags: ['REST', 'ETL', 'Data Lake'],
		website: 'https://example.com/projects/grants-repo',
	},
	{
		id: 4,
		title: 'Автоматизация отчётности по публикациям',
		description: 'Формирование отчётов по публикационной активности.',
		start_date: '2025-01-20',
		status: 'on_hold',
		group_id: 2,
		supervisor_name: 'Кузнецов Д.Д.',
		tags: ['Reporting', 'Scheduler'],
	},
]
let nextProjectId = 5

function delay(ms = 200) {
	return new Promise(r => setTimeout(r, ms))
}

function toSummary(p: MockProject): ProjectSummary {
	return {
		id: p.id,
		title: p.title,
		status: p.status,
		start_date: p.start_date,
		end_date: p.end_date,
		supervisor_name: p.supervisor_name,
		group_id: p.group_id ?? null,
	}
}

// --- Public API (mock or http) --- //
export async function listProjects(params?: {
	status?: string
	search?: string
	group_id?: number
}): Promise<ProjectSummary[]> {
	if (USE_MOCK) {
		await delay()
		let data = [...mockProjects]
		if (params?.status) data = data.filter(p => p.status === params.status)
		if (params?.group_id)
			data = data.filter(p => p.group_id === params.group_id)
		if (params?.search) {
			const q = params.search.toLowerCase()
			data = data.filter(p => p.title.toLowerCase().includes(q))
		}
		return data.map(toSummary)
	}
	const query = new URLSearchParams()
	if (params?.status) query.set('status', params.status)
	if (params?.search) query.set('search', params.search)
	if (params?.group_id) query.set('group', String(params.group_id))
	return http<ProjectSummary[]>(`/projects/?${query.toString()}`, {
		auth: true,
	})
}

export async function getProject(id: number): Promise<ProjectDetail> {
	if (USE_MOCK) {
		await delay()
		const p = mockProjects.find(p => p.id === id)
		if (!p) throw new Error('Проект не найден')
		return { ...p }
	}
	return http<ProjectDetail>(`/projects/${id}/`, { auth: true })
}

export async function createProject(
	input: NewProjectInput
): Promise<ProjectDetail> {
	if (USE_MOCK) {
		await delay()
		const p: MockProject = {
			id: nextProjectId++,
			title: input.title.trim(),
			description: input.description?.trim(),
			status: input.status || 'planned',
			start_date: input.start_date || new Date().toISOString().slice(0, 10),
			end_date: input.end_date,
			budget: input.budget,
			currency: input.currency,
			tags: input.tags,
			website: input.website,
			grant_id: input.grant_id ?? null,
			group_id: input.group_id ?? null,
			supervisor_name: 'Текущий пользователь',
		}
		mockProjects.unshift(p)
		return { ...p }
	}
	return http<ProjectDetail>(`/projects/`, {
		method: 'POST',
		auth: true,
		body: JSON.stringify(input),
	})
}

export async function updateProject(
	id: number,
	patch: UpdateProjectInput
): Promise<ProjectDetail> {
	if (USE_MOCK) {
		await delay()
		const idx = mockProjects.findIndex(p => p.id === id)
		if (idx === -1) throw new Error('Not found')
		const cur = mockProjects[idx]
		mockProjects[idx] = {
			...cur,
			...patch,
			title: patch.title ? patch.title.trim() : cur.title,
		}
		return { ...mockProjects[idx] }
	}
	return http<ProjectDetail>(`/projects/${id}/`, {
		method: 'PATCH',
		auth: true,
		body: JSON.stringify(patch),
	})
}

export async function deleteProject(id: number): Promise<void> {
	if (USE_MOCK) {
		await delay()
		mockProjects = mockProjects.filter(p => p.id !== id)
		return
	}
	await http(`/projects/${id}/`, { method: 'DELETE', auth: true })
}
