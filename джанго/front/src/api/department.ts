import type {
	Department,
	DepartmentInput,
	EmployeeOption,
} from '../types/department'
import { http } from './http'

// Реализация обращается к реальному backend API (/api/)
// Маршруты соответствуют backend router'у:
//  GET    /api/departments/               -> list
//  POST   /api/departments/               -> create
//  GET    /api/departments/:id/           -> retrieve (в ответе detail + info + groups)
//  PUT/PATCH /api/departments/:id/        -> update
//  DELETE /api/departments/:id/           -> delete
//  GET    /api/employees/                 -> список сотрудников (id, full_name,...)
//  (дополнительно можно будет реализовать upsert_info и т.п.)

export async function listDepartments(): Promise<Department[]> {
	return http<Department[]>('/api/departments/', { auth: true })
}

export async function getDepartment(id: number): Promise<Department | null> {
	return http<Department | null>(`/api/departments/${id}/`, { auth: true })
}

export async function createDepartment(
	data: DepartmentInput
): Promise<Department> {
	return http<Department>('/api/departments/', {
		method: 'POST',
		body: JSON.stringify(data),
		auth: true,
	})
}

export async function updateDepartment(
	id: number,
	data: DepartmentInput
): Promise<Department> {
	return http<Department>(`/api/departments/${id}/`, {
		method: 'PATCH',
		body: JSON.stringify(data),
		auth: true,
	})
}

export async function deleteDepartment(id: number): Promise<void> {
	await http(`/api/departments/${id}/`, { method: 'DELETE', auth: true })
}

export async function listEmployees(): Promise<EmployeeOption[]> {
	return http<EmployeeOption[]>('/api/employees/', { auth: true })
}

// Дополнительно: обновление/создание расширенной информации о кафедре
export interface DepartmentInfoUpsert {
	history?: string
	mission?: string
	educational_activities?: string
	scientific_activities?: string
	achievements?: string
	equipment?: string
	contacts?: string
}

export async function upsertDepartmentInfo(
	departmentId: number,
	data: DepartmentInfoUpsert
) {
	return http(`/api/departments/${departmentId}/upsert_info/`, {
		method: 'POST',
		body: JSON.stringify(data),
		auth: true,
	})
}
