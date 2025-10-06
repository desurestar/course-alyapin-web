import type { UserPublic } from './auth'

export interface Department {
	id: number
	name: string
	short_name?: string
	code?: string
	description?: string
	head_id?: number | null
	head?: UserPublic | null
	/** Заместитель заведующего кафедрой (frontend only for now, optional). */
	deputy_id?: number | null
	deputy?: UserPublic | null
	updated_at?: string
	created_at?: string
}

export interface DepartmentInput {
	name: string
	short_name?: string
	code?: string
	description?: string
	head_id?: number | null
	/** Optional deputy on create/update (mock mode only until backend supports). */
	deputy_id?: number | null
}

export interface DepartmentInfo {
	department_id: number
	history?: string
	mission?: string
	educational_activities?: string
	scientific_activities?: string
	achievements?: string
	equipment?: string
	contacts?: string
}

export interface EmployeeOption {
	id: number
	full_name: string
	first_name?: string
	last_name?: string
}

export interface DepartmentEmployee {
	id: number
	full_name: string
	position?: string
	email?: string
	phone?: string
}

export interface ResearchGroup {
	id: number
	name: string
	description?: string
	leader_id?: number | null
	leader_name?: string
	members_count?: number
}

export interface DepartmentDetail extends Department {
	info?: DepartmentInfo
	employees: DepartmentEmployee[]
	groups: ResearchGroup[]
}

export function buildDepartmentPayload(
	raw: Partial<DepartmentInput>
): DepartmentInput {
	return {
		name: (raw.name || '').trim(),
		short_name: raw.short_name?.trim() || undefined,
		code: raw.code?.trim() || undefined,
		description: raw.description?.trim() || undefined,
		head_id: raw.head_id ?? undefined,
		deputy_id: raw.deputy_id ?? undefined,
	}
}

/**
 * Пример использования при переходе на реальный backend:
 * const payload = buildDepartmentPayload(formState)
 * await http('departments/', { method:'POST', body: JSON.stringify(payload), auth:true })
 */
