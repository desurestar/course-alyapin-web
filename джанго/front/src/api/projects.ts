import type {
	NewProjectInput,
	ProjectDetail,
	ProjectSummary,
	UpdateProjectInput,
} from '../types/project'
import { adaptProjectDetail, adaptProjectSummary } from './adapters'
import { http } from './http'

// Intended backend endpoints:
//  GET    /projects/                 -> listProjects (?status=&search=&group=)
//  GET    /projects/{id}/            -> getProject
//  POST   /projects/                 -> createProject (auth, leader/admin)
//  PATCH  /projects/{id}/            -> updateProject (auth, owner)
//  DELETE /projects/{id}/            -> deleteProject
// Notes: Server should include group_id (or null) for navigation to group page.

const USE_MOCK = false

// --- Mock state --- //
interface MockProject extends ProjectDetail {}
let mockProjects: MockProject[] = [
	{
		id: 1,
		title: 'Интеллектуальная система анализа публикаций',
		description: 'Разработка сервиса тематического анализа.',
		start_date: '2024-02-01',
		status: 'in_progress',
		grant_id: 101,
		group_id: 1,
		supervisor_name: 'Иванов И.И.',
		website: 'https://example.com/projects/nlp-analytics',
	},
	{
		id: 2,
		title: 'Платформа управления научными коллективами',
		description: 'Учёт коллективов и ролей.',
		start_date: '2023-09-15',
		end_date: '2025-03-01',
		status: 'planned',
		grant_id: null,
		group_id: 2,
		supervisor_name: 'Петров П.П.',
	},
	{
		id: 3,
		title: 'Репозиторий данных по грантам и проектам',
		description: 'Хранилище и API для интеграции.',
		start_date: '2022-05-10',
		end_date: '2024-12-31',
		status: 'completed',
		grant_id: 77,
		group_id: 1,
		supervisor_name: 'Сидорова А.А.',
		website: 'https://example.com/projects/grants-repo',
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

// ---------------- Normalization (HTTP branch) --------------- //
function normalizeSummary(raw: any): ProjectSummary {
	return adaptProjectSummary ? adaptProjectSummary(raw) : raw
}
function normalizeDetail(raw: any): ProjectDetail {
	return adaptProjectDetail ? adaptProjectDetail(raw) : raw
}

// ---------------- Payload Helpers ---------------- //
export interface PrepareNewProjectInput {
	title: string
	description?: string
	status?: string
	start_date?: string
	end_date?: string
	website?: string
	grant_id?: number | null
	group_id?: number | null
}

export function prepareCreateProject(
	input: PrepareNewProjectInput
): NewProjectInput {
	return {
		title: input.title.trim(),
		description: input.description?.trim() || undefined,
		status: (input.status as any) || 'planned',
		start_date: input.start_date || new Date().toISOString().slice(0, 10),
		end_date: input.end_date || undefined,
		website: input.website?.trim() || undefined,
		grant_id: input.grant_id ?? null,
		group_id: input.group_id ?? null,
	}
}

export function buildProjectPatch(
	prev: ProjectDetail,
	next: Partial<ProjectDetail>
): UpdateProjectInput {
	const patch: any = {}
	if (next.title && next.title.trim() !== prev.title)
		patch.title = next.title.trim()
	if (
		next.description?.trim() !== undefined &&
		next.description.trim() !== (prev.description || '')
	)
		patch.description = next.description.trim() || undefined
	if (next.status && next.status !== prev.status) patch.status = next.status
	if (next.start_date && next.start_date !== prev.start_date)
		patch.start_date = next.start_date
	if (next.end_date !== undefined && next.end_date !== prev.end_date)
		patch.end_date = next.end_date || undefined
	if (
		next.website?.trim() !== undefined &&
		next.website?.trim() !== (prev.website || '')
	)
		patch.website = next.website.trim() || undefined
	if (next.grant_id !== undefined && next.grant_id !== prev.grant_id)
		patch.grant_id = next.grant_id
	if (next.group_id !== undefined && next.group_id !== prev.group_id)
		patch.group_id = next.group_id
	return patch
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
	const res = await http<ProjectSummary[]>(`/projects/?${query.toString()}`, {
		auth: true,
	})
	return res.map(normalizeSummary)
}

export async function getProject(id: number): Promise<ProjectDetail> {
	if (USE_MOCK) {
		await delay()
		const p = mockProjects.find(p => p.id === id)
		if (!p) throw new Error('Проект не найден')
		return { ...p }
	}
	const raw = await http<ProjectDetail>(`/projects/${id}/`, { auth: true })
	return normalizeDetail(raw)
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
			website: input.website,
			grant_id: input.grant_id ?? null,
			group_id: input.group_id ?? null,
			supervisor_name: 'Текущий пользователь',
		}
		mockProjects.unshift(p)
		return { ...p }
	}
	const created = await http<ProjectDetail>(`/projects/`, {
		method: 'POST',
		auth: true,
		body: JSON.stringify(input),
	})
	return normalizeDetail(created)
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
	const updated = await http<ProjectDetail>(`/projects/${id}/`, {
		method: 'PATCH',
		auth: true,
		body: JSON.stringify(patch),
	})
	return normalizeDetail(updated)
}

export async function deleteProject(id: number): Promise<void> {
	if (USE_MOCK) {
		await delay()
		mockProjects = mockProjects.filter(p => p.id !== id)
		return
	}
	await http(`/projects/${id}/`, { method: 'DELETE', auth: true })
}
