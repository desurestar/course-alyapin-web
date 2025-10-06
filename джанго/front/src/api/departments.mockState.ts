// Mock state & helpers for Departments (used only when API_USE_MOCK = true)
// This mirrors the pattern used in profile.mockState.ts but simplified.
import type {
	Department,
	DepartmentInput,
	EmployeeOption,
} from '../types/department'

// In-memory auto increment
let _nextDeptId = 3

// Employees pool (pretend these are users eligible to be department members)
export const mockEmployees: EmployeeOption[] = [
	{ id: 1, full_name: 'Иванов Иван' },
	{ id: 2, full_name: 'Петров Петр' },
	{ id: 3, full_name: 'Сидорова Анна' },
	{ id: 4, full_name: 'Кузнецов Виктор' },
	{ id: 5, full_name: 'Орлова Мария' },
	{ id: 6, full_name: 'Тихонов Денис' },
	{ id: 7, full_name: 'Федорова Елена' },
]

// Departments with head/deputy and membership list (employee ids)
export let mockDepartments: (Department & { employee_ids: number[] })[] = [
	{
		id: 1,
		name: 'Кафедра математики',
		short_name: 'Math',
		code: 'MATH',
		description: 'Математический анализ и алгебра',
		head_id: 1,
		deputy_id: 2,
		employee_ids: [1, 2, 3, 4],
		created_at: new Date().toISOString(),
	},
	{
		id: 2,
		name: 'Кафедра информатики',
		short_name: 'CS',
		code: 'CS',
		description: 'Алгоритмы и программирование',
		head_id: 3,
		deputy_id: null,
		employee_ids: [3, 5, 6],
		created_at: new Date().toISOString(),
	},
]

// CRUD operations
export function msListDepartments(): Department[] {
	return mockDepartments.map(d => ({
		id: d.id,
		name: d.name,
		short_name: d.short_name,
		code: d.code,
		description: d.description,
		head_id: d.head_id,
		deputy_id: d.deputy_id ?? null,
		created_at: d.created_at,
	}))
}

export function msCreateDepartment(input: DepartmentInput): Department {
	const dept: Department & { employee_ids: number[] } = {
		id: _nextDeptId++,
		name: input.name,
		short_name: input.short_name,
		code: input.code,
		description: input.description,
		head_id: input.head_id ?? null,
		deputy_id: input.deputy_id ?? null,
		employee_ids: [],
		created_at: new Date().toISOString(),
	}
	mockDepartments.push(dept)
	return { ...dept }
}

export function msUpdateDepartment(
	id: number,
	input: Partial<DepartmentInput>
): Department {
	const idx = mockDepartments.findIndex(d => d.id === id)
	if (idx === -1) throw new Error('Department not found')
	const current = mockDepartments[idx]
	mockDepartments[idx] = {
		...current,
		name: input.name ?? current.name,
		short_name: input.short_name ?? current.short_name,
		code: input.code ?? current.code,
		description: input.description ?? current.description,
		head_id: input.head_id === undefined ? current.head_id : input.head_id,
		deputy_id:
			input.deputy_id === undefined
				? current.deputy_id
				: input.deputy_id ?? null,
	}
	return { ...mockDepartments[idx] }
}

export function msDeleteDepartment(id: number): void {
	mockDepartments = mockDepartments.filter(d => d.id !== id)
}

// Membership helpers
export function msGetDepartmentEmployeeIds(id: number): number[] {
	return mockDepartments.find(d => d.id === id)?.employee_ids.slice() || []
}

export function msSetDepartmentEmployees(id: number, employeeIds: number[]) {
	const dept = mockDepartments.find(d => d.id === id)
	if (!dept) throw new Error('Department not found')
	dept.employee_ids = Array.from(new Set(employeeIds))
}

// Assignable employees: those not already assigned to another dept (besides current dept when editing)
export function msListAssignableEmployees(
	currentDeptId?: number
): EmployeeOption[] {
	const occupied = new Set<number>()
	for (const d of mockDepartments) {
		if (currentDeptId && d.id === currentDeptId) continue
		d.employee_ids.forEach(id => occupied.add(id))
		if (d.head_id) occupied.add(d.head_id)
		if (d.deputy_id) occupied.add(d.deputy_id)
	}
	return mockEmployees.filter(e => !occupied.has(e.id))
}

// For UI convenience: resolve employees of department
export function msResolveDepartmentEmployees(id: number) {
	const ids = msGetDepartmentEmployeeIds(id)
	return ids
		.map(i => mockEmployees.find(e => e.id === i))
		.filter(Boolean) as EmployeeOption[]
}

export function msGetDepartmentDetail(id: number) {
	const dept = mockDepartments.find(d => d.id === id)
	if (!dept) throw new Error('Department not found')
	return {
		...dept,
		employees: msResolveDepartmentEmployees(id).map(e => ({
			id: e.id,
			full_name: e.full_name,
		})),
		groups: [], // not modelled in mock
	}
}
