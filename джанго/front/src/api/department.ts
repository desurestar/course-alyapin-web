import type {
	Department,
	DepartmentDetail,
	DepartmentInput,
	EmployeeOption,
} from '../types/department'
import { http } from './http'
// Lazy mock imports to avoid bundling when not needed
let mock: any

async function ensureMock() {
	if (!mock) {
		mock = await import('./departments.mockState')
	}
	return mock
}

const USE_MOCK = false
// const USE_MOCK = API_USE_MOCK

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
export async function listDepartments(): Promise<Department[]> {
	if (USE_MOCK) {
		const m = await ensureMock()
		return m.msListDepartments()
	}
	return http<Department[]>('departments/', { auth: false })
}

/** Создание кафедры (требует staff права). */
export async function createDepartment(
	data: DepartmentInput
): Promise<Department> {
	if (USE_MOCK) {
		const m = await ensureMock()
		return m.msCreateDepartment(data)
	}
	return http<Department>('departments/', {
		method: 'POST',
		body: JSON.stringify(data),
		auth: true,
	})
}

/** Обновление кафедры. Используем PATCH чтобы отправлять только изменённые поля. */
export async function updateDepartment(
	id: number,
	data: Partial<DepartmentInput>
): Promise<Department> {
	if (USE_MOCK) {
		const m = await ensureMock()
		return m.msUpdateDepartment(id, data)
	}
	return http<Department>(`departments/${id}/`, {
		method: 'PATCH',
		body: JSON.stringify(data),
		auth: true,
	})
}

/** Удаление кафедры. */
export async function deleteDepartment(id: number): Promise<void> {
	if (USE_MOCK) {
		const m = await ensureMock()
		m.msDeleteDepartment(id)
		return
	}
	return http<void>(`departments/${id}/`, { method: 'DELETE', auth: true })
}

/** Детальная информация (включает info, groups, employees). */
export async function getDepartmentDetail(
	id: number
): Promise<DepartmentDetail> {
	if (USE_MOCK) {
		const m = await ensureMock()
		return m.msGetDepartmentDetail(id)
	}
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
export async function listEmployees(): Promise<EmployeeOption[]> {
	if (USE_MOCK) {
		const m = await ensureMock()
		return m.mockEmployees
	}
	return http<EmployeeOption[]>('employees/', { auth: false })
}

/** Список сотрудников конкретной кафедры (если нужен отдельно от detail). */
export async function listDepartmentEmployees(id: number) {
	if (USE_MOCK) {
		const m = await ensureMock()
		return m.msResolveDepartmentEmployees(id)
	}
	return http(`departments/${id}/employees/`, { auth: false })
}

/** Добавить сотрудника кафедры. */
export async function addDepartmentEmployee(
	departmentId: number,
	user_id: number,
	position?: string
) {
	if (USE_MOCK) {
		const m = await ensureMock()
		const existing = m.msGetDepartmentEmployeeIds(departmentId)
		m.msSetDepartmentEmployees(departmentId, [...existing, user_id])
		return
	}
	return http(`departments/${departmentId}/add_employee/`, {
		method: 'POST',
		body: JSON.stringify({ user_id, position }),
		auth: true,
	})
}

/** Удалить сотрудника кафедры. */
export async function removeDepartmentEmployee(
	departmentId: number,
	user_id: number
) {
	if (USE_MOCK) {
		const m = await ensureMock()
		const existing: number[] = m.msGetDepartmentEmployeeIds(departmentId)
		m.msSetDepartmentEmployees(
			departmentId,
			existing.filter((id: number) => id !== user_id)
		)
		return
	}
	return http(`departments/${departmentId}/remove-employee/`, {
		method: 'POST',
		body: JSON.stringify({ user_id }),
		auth: true,
	})
}

// Mock-only convenience to list employees not yet assigned to other departments (excluding current editing dept)
export async function listAssignableEmployees(currentDeptId?: number) {
	if (USE_MOCK) {
		const m = await ensureMock()
		return m.msListAssignableEmployees(currentDeptId)
	}
	// Backend analogue could be GET /employees/?available_for_department=<id>
	return listEmployees()
}

// Batch replace department employees (mock only; backend would have a dedicated endpoint)
export async function setDepartmentEmployees(
	departmentId: number,
	employeeIds: number[]
) {
	if (USE_MOCK) {
		const m = await ensureMock()
		m.msSetDepartmentEmployees(departmentId, employeeIds)
		return
	}
	// For real backend we would diff and call add/remove endpoints; left unimplemented now.
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
