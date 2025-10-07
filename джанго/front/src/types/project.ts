// Shared project types for list & detail endpoints
// Project status values. "on_hold" retained (was previously mapped to a hypothetical "paused").
// If backend wants a different display label, map in UI layer instead of renaming the enum here.
export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold'

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
	website?: string
	grant_id?: number | null
	group_id?: number | null
}

export interface UpdateProjectInput extends Partial<NewProjectInput> {}
