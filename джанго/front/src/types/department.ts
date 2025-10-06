import type { UserPublic } from './auth'

export interface Department {
	id: number
	name: string
	short_name?: string
	code?: string
	description?: string
	head_id?: number | null
	head?: UserPublic | null
	updated_at?: string
	created_at?: string
}

export interface DepartmentInput {
	name: string
	short_name?: string
	code?: string
	description?: string
	head_id?: number | null
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

export function buildDepartmentPayload(
	raw: Partial<DepartmentInput>
): DepartmentInput {
	return {
		name: (raw.name || '').trim(),
		short_name: raw.short_name?.trim() || undefined,
		code: raw.code?.trim() || undefined,
		description: raw.description?.trim() || undefined,
		head_id: raw.head_id ?? undefined,
	}
}

/**
 * Пример использования при переходе на реальный backend:
 * const payload = buildDepartmentPayload(formState)
 * await http('departments/', { method:'POST', body: JSON.stringify(payload), auth:true })
 */
