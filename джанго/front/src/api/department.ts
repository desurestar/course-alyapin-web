import type {
	Department,
	DepartmentDetail,
	DepartmentEmployee,
	DepartmentInput,
	EmployeeOption,
	ResearchGroup,
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

// Extra mock data for detail view
const _deptEmployees: Record<number, DepartmentEmployee[]> = {
	1: [
		{
			id: 201,
			full_name: 'Иванов Иван Иванович',
			position: 'Профессор',
			email: 'ivanov@example.com',
		},
		{
			id: 202,
			full_name: 'Петров Пётр Петрович',
			position: 'Доцент',
			email: 'petrov@example.com',
		},
	],
	2: [
		{
			id: 203,
			full_name: 'Сидорова Анна Сергеевна',
			position: 'Старший преподаватель',
		},
	],
}

const _deptGroups: Record<number, ResearchGroup[]> = {
	1: [
		{
			id: 301,
			name: 'Алгоритмы и структуры',
			description: 'Исследования алгоритмов',
			leader_id: 201,
			leader_name: 'Иванов И.И.',
			members_count: 5,
		},
		{
			id: 302,
			name: 'Искусственный интеллект',
			description: 'ML и нейросети',
			leader_id: 202,
			leader_name: 'Петров П.П.',
			members_count: 7,
		},
	],
	2: [
		{
			id: 303,
			name: 'Чистая математика',
			description: 'Теор. исследования',
			leader_id: 203,
			leader_name: 'Сидорова А.С.',
			members_count: 3,
		},
	],
}

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
export async function getDepartmentDetail(
	id: number
): Promise<DepartmentDetail | null> {
	await delay()
	const base = _departments.find(d => d.id === id)
	if (!base) return null
	return {
		...structuredClone(base),
		employees: structuredClone(_deptEmployees[id] || []),
		groups: structuredClone(_deptGroups[id] || []),
		info: {
			department_id: id,
			history: 'История кафедры (mock)',
			mission: 'Миссия кафедры (mock)',
			educational_activities: 'Образовательная деятельность (mock)',
			scientific_activities: 'Научная деятельность (mock)',
			achievements: 'Достижения (mock)',
			equipment: 'Оборудование (mock)',
			contacts: 'Контакты (mock)',
		},
	}
}

function delay(ms = 200) {
	return new Promise(res => setTimeout(res, ms))
}

// Placeholder: access token available via getAccessToken() for future HTTP calls
void getAccessToken

// REAL BACKEND ПРИМЕР (заменить функции ниже):
// import { http } from './http'
// export async function listDepartments() { return http('departments/', { auth:false }) }
// export async function createDepartment(data: DepartmentInput) { return http('departments/', { method:'POST', body: JSON.stringify(data), auth:true }) }
// export async function updateDepartment(id:number,data:DepartmentInput){ return http(`departments/${id}/`, { method:'PUT', body: JSON.stringify(data), auth:true }) }
// export async function deleteDepartment(id:number){ return http(`departments/${id}/`, { method:'DELETE', auth:true }) }
// export async function getDepartmentDetail(id:number){ return http(`departments/${id}/`, { auth:false }) }
