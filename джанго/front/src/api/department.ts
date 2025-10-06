import type {
	Department,
	DepartmentInput,
	EmployeeOption,
} from '../types/department'
import { getAccessToken } from './http'

// In-memory mock store (replace with real HTTP calls later)
let _departments: Department[] = [
	{
		id: 1,
		name: 'Кафедра информатики',
		short_name: 'Инф',
		code: 'INF',
		description: 'Описание кафедры информатики',
		head_id: 101,
	},
	{
		id: 2,
		name: 'Кафедра математики',
		short_name: 'Мат',
		code: 'MATH',
		description: 'Описание кафедры математики',
		head_id: 102,
	},
]
let _nextId = 3

// Employees mock
const _employees: EmployeeOption[] = [
	{ id: 101, full_name: 'Иванов Иван Иванович' },
	{ id: 102, full_name: 'Петров Пётр Петрович' },
	{ id: 103, full_name: 'Сидорова Анна Сергеевна' },
	{ id: 104, full_name: 'Кузнецова Мария Николаевна' },
]

export async function listDepartments(): Promise<Department[]> {
	await delay()
	return structuredClone(_departments)
}
export async function getDepartment(id: number): Promise<Department | null> {
	await delay()
	return structuredClone(_departments.find(d => d.id === id) || null)
}
export async function createDepartment(
	data: DepartmentInput
): Promise<Department> {
	await delay()
	const dept: Department = { id: _nextId++, ...data }
	_departments.push(dept)
	return structuredClone(dept)
}
export async function updateDepartment(
	id: number,
	data: DepartmentInput
): Promise<Department> {
	await delay()
	const idx = _departments.findIndex(d => d.id === id)
	if (idx === -1) throw new Error('Not found')
	_departments[idx] = { ..._departments[idx], ...data }
	return structuredClone(_departments[idx])
}
export async function deleteDepartment(id: number): Promise<void> {
	await delay()
	_departments = _departments.filter(d => d.id !== id)
}
export async function listEmployees(): Promise<EmployeeOption[]> {
	await delay()
	return structuredClone(_employees)
}

function delay(ms = 200) {
	return new Promise(res => setTimeout(res, ms))
}

// Placeholder: access token available via getAccessToken() for future HTTP calls
void getAccessToken
