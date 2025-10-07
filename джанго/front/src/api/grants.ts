import { API_USE_MOCK } from './config'
import { http } from './http'

export interface GrantSummary {
	id: number
	title: string
	code?: string
	agency?: string
	start_date?: string
	end_date?: string
}

const USE_MOCK = API_USE_MOCK

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

// Placeholder for future expansion (getGrant, createGrant, etc.)
