import { http } from './http'

export interface GrantSummary {
	id: number
	title: string
	code?: string
	agency?: string
	start_date?: string
	end_date?: string
}

export interface GrantDetail extends GrantSummary {
	description?: string
}

export interface NewGrantInput {
	title: string
	code?: string
	agency?: string
	start_date?: string
	end_date?: string
	description?: string
}

export interface UpdateGrantInput {
	title?: string
	code?: string
	agency?: string
	start_date?: string | null
	end_date?: string | null
	description?: string | null
}

const USE_MOCK = false

// Simple in-memory mock dataset
let mockGrants: GrantSummary[] = [
	{
		id: 1,
		title: 'AI Research Initiative 2025',
		code: 'AI-25-01',
		agency: 'ScienceFund',
		start_date: '2025-01-01',
		end_date: '2025-12-31',
	},
	{
		id: 2,
		title: 'Health Data Grant',
		code: 'HD-2025',
		agency: 'HealthGov',
		start_date: '2025-03-01',
		end_date: '2026-02-28',
	},
	{
		id: 3,
		title: 'Образовательный грант',
		code: 'EDU-77',
		agency: 'Минобр',
		start_date: '2024-09-01',
		end_date: '2025-08-31',
	},
]

function delay(ms = 250) {
	return new Promise(r => setTimeout(r, ms))
}

export async function listGrants(): Promise<GrantSummary[]> {
	if (USE_MOCK) {
		await delay()
		return mockGrants.map(g => ({ ...g }))
	}
	const data = await http<GrantSummary[]>('/grants/', { auth: true })
	return data
}

export async function getGrant(id: number): Promise<GrantDetail> {
	if (USE_MOCK) {
		await delay()
		const g = mockGrants.find(x => x.id === id)
		if (!g) throw new Error('Grant not found')
		return { ...g, description: 'Mock description' }
	}
	return http<GrantDetail>(`/grants/${id}/`, { auth: true })
}

export async function createGrant(
	payload: NewGrantInput,
	options?: { link_project_id?: number }
): Promise<GrantDetail> {
	if (USE_MOCK) {
		await delay()
		const id = Math.max(0, ...mockGrants.map(g => g.id)) + 1
		const base: GrantDetail = { id, ...payload }
		mockGrants.unshift(base)
		// Simulate linking to a project by calling a future project update (noop here)
		return { ...base }
	}
	const created = await http<GrantDetail>('/grants/', {
		method: 'POST',
		body: JSON.stringify(payload),
		auth: true,
	})
	if (options?.link_project_id) {
		try {
			await http(`/projects/${options.link_project_id}/`, {
				method: 'PATCH',
				body: JSON.stringify({ grant_id: created.id }),
				auth: true,
			})
		} catch (e) {
			console.warn('Failed to link project to grant', e)
		}
	}
	return created
}

export async function updateGrant(
	id: number,
	patch: UpdateGrantInput,
	options?: { link_project_id?: number | null }
): Promise<GrantDetail> {
	if (USE_MOCK) {
		await delay()
		const idx = mockGrants.findIndex(g => g.id === id)
		if (idx === -1) throw new Error('Grant not found')
		const current = mockGrants[idx]
		mockGrants[idx] = {
			...current,
			...(patch.title !== undefined ? { title: patch.title } : {}),
			...(patch.code !== undefined ? { code: patch.code } : {}),
			...(patch.agency !== undefined ? { agency: patch.agency } : {}),
			...(patch.start_date !== undefined
				? { start_date: patch.start_date || undefined }
				: {}),
			...(patch.end_date !== undefined
				? { end_date: patch.end_date || undefined }
				: {}),
		}
		return { ...mockGrants[idx], description: 'Mock description' }
	}
	const updated = await http<GrantDetail>(`/grants/${id}/`, {
		method: 'PATCH',
		body: JSON.stringify(patch),
		auth: true,
	})
	if (options) {
		if (options.link_project_id) {
			try {
				await http(`/projects/${options.link_project_id}/`, {
					method: 'PATCH',
					body: JSON.stringify({ grant_id: updated.id }),
					auth: true,
				})
			} catch (e) {
				console.warn('Failed to link project to grant', e)
			}
		} else if (options.link_project_id === null) {
			// unlink scenario
			try {
				// assuming backend accepts grant_id: null
				await http(`/projects/${id}/`, {
					method: 'PATCH',
					body: JSON.stringify({ grant_id: null }),
					auth: true,
				})
			} catch {}
		}
	}
	return updated
}

export async function deleteGrant(id: number): Promise<void> {
	if (USE_MOCK) {
		await delay()
		mockGrants = mockGrants.filter(g => g.id !== id)
		return
	}
	await http(`/grants/${id}/`, { method: 'DELETE', auth: true })
}
