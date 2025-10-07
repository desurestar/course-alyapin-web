// Shared project types for list & detail endpoints
// Backend internal 'on_hold' mapped to frontend 'paused' via serializer. Keep union without 'on_hold'.
export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'paused'

export interface ProjectSummary {
	id: number
	title: string
	status: ProjectStatus
	start_date: string
	end_date?: string
	supervisor_name: string
	group_id?: number | null // owning research group
}

export interface ProjectDetail extends ProjectSummary {
	description?: string
	budget?: number
	currency?: 'RUB' | 'USD' | 'EUR'
	tags?: string[]
	website?: string
	grant_id?: number | null
}

// Creation / update payloads (frontend to backend)
export interface NewProjectInput {
	title: string
	description?: string
	status?: ProjectStatus
	start_date?: string
	end_date?: string
	budget?: number
	currency?: 'RUB' | 'USD' | 'EUR'
	tags?: string[]
	website?: string
	grant_id?: number | null
	group_id?: number | null
}

export interface UpdateProjectInput extends Partial<NewProjectInput> {}
