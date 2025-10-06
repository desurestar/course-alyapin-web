import type {
	Department,
	DepartmentDetail,
	DepartmentInput,
	EmployeeOption,
} from '../types/department'
import { http } from './http'

// =============================
// Department & Staff API (real backend)
// Backend endpoints (see academic app):
// GET    /api/departments/
// POST   /api/departments/
// GET    /api/departments/:id/
// PUT    /api/departments/:id/
// PATCH  /api/departments/:id/
// DELETE /api/departments/:id/
// POST   /api/departments/:id/upsert_info/
// GET    /api/departments/:id/employees/
// POST   /api/departments/:id/add_employee/   { user_id, position? }
// POST   /api/departments/:id/remove-employee/ { user_id }
// GET    /api/employees/
// =============================

/** Список кафедр (без detail-полей). */
export function listDepartments(): Promise<Department[]> {
	return http<Department[]>('departments/', { auth: false })
}

/** Создание кафедры (требует staff права). */
export function createDepartment(data: DepartmentInput): Promise<Department> {
	return http<Department>('departments/', {
		method: 'POST',
		body: JSON.stringify(data),
		auth: true,
	})
}

/** Обновление кафедры. Используем PATCH чтобы отправлять только изменённые поля. */
export function updateDepartment(
	id: number,
	data: Partial<DepartmentInput>
): Promise<Department> {
	return http<Department>(`departments/${id}/`, {
		method: 'PATCH',
		body: JSON.stringify(data),
		auth: true,
	})
}

/** Удаление кафедры. */
export function deleteDepartment(id: number): Promise<void> {
	return http<void>(`departments/${id}/`, { method: 'DELETE', auth: true })
}

/** Детальная информация (включает info, groups, employees). */
export function getDepartmentDetail(id: number): Promise<DepartmentDetail> {
	return http<DepartmentDetail>(`departments/${id}/`, { auth: false })
}

/** Upsert дополнительной информации о кафедре (history, mission, ...). */
export function upsertDepartmentInfo(
	id: number,
	payload: Record<string, any>
): Promise<any> {
	return http<any>(`departments/${id}/upsert_info/`, {
		method: 'POST',
		body: JSON.stringify(payload),
		auth: true,
	})
}

/** Список пользователей (для выбора заведующего и сотрудников). */
export function listEmployees(): Promise<EmployeeOption[]> {
	return http<EmployeeOption[]>('employees/', { auth: false })
}

/** Список сотрудников конкретной кафедры (если нужен отдельно от detail). */
export function listDepartmentEmployees(id: number) {
	return http(`departments/${id}/employees/`, { auth: false })
}

/** Добавить сотрудника кафедры. */
export function addDepartmentEmployee(
	departmentId: number,
	user_id: number,
	position?: string
) {
	return http(`departments/${departmentId}/add_employee/`, {
		method: 'POST',
		body: JSON.stringify({ user_id, position }),
		auth: true,
	})
}

/** Удалить сотрудника кафедры. */
export function removeDepartmentEmployee(
	departmentId: number,
	user_id: number
) {
	return http(`departments/${departmentId}/remove-employee/`, {
		method: 'POST',
		body: JSON.stringify({ user_id }),
		auth: true,
	})
}

// Utility: нормализовать payload перед отправкой (обрезка пробелов, undefined вместо пустых строк)
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
