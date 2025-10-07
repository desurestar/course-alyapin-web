import type {
	Department,
	DepartmentDetail,
	DepartmentEmployee,
	DepartmentInfo,
	DepartmentInput,
	ResearchGroup,
} from '../types/department'
import { http } from './http'

const USE_MOCK = false

// ---------------- Mock State ---------------- //
interface MockDepartment extends Department {
	employees: DepartmentEmployee[]
	groups: ResearchGroup[]
	info?: DepartmentInfo
}

let mockDepartments: MockDepartment[] = [
	{
		id: 1,
		name: 'Кафедра информатики',
		short_name: 'Инф',
		code: 'INF-01',
		description: 'Алгоритмы, структуры данных и системы.',
		head_id: 1,
		deputy_id: 2,
		employees: [
			{
				id: 1,
				full_name: 'Иван Иванов',
				position: 'Зав. кафедрой',
				email: 'ivan@example.com',
			},
			{
				id: 2,
				full_name: 'Пётр Петров',
				position: 'Доцент',
				email: 'petr@example.com',
			},
		],
		groups: [
			{
				id: 1,
				name: 'Группа Алгоритмов',
				leader_id: 1,
				leader_name: 'Иван Иванов',
				members_count: 2,
			},
		],
		info: {
			department_id: 1,
			history: 'Основана в 1998 году...',
			mission: 'Подготовка специалистов по информатике',
			scientific_activities: 'Исследования в области алгоритмов и ИИ',
			educational_activities: 'Бакалавриат, магистратура',
			achievements: 'Победы в олимпиадах',
			equipment: 'Компьютерные классы, кластер',
			contacts: 'г. Город, ул. Пример, 1',
		},
	},
]
let nextDeptId = 2

function delay(ms = 200) {
	return new Promise(r => setTimeout(r, ms))
}

function cloneDept(d: MockDepartment): DepartmentDetail {
	return {
		...d,
		employees: [...d.employees],
		groups: [...d.groups],
		info: d.info ? { ...d.info } : undefined,
	}
}

// ---------------- Public API ---------------- //
export async function listDepartments(
	params: { search?: string } = {}
): Promise<Department[]> {
	if (USE_MOCK) {
		await delay()
		let data = [...mockDepartments]
		if (params.search) {
			const q = params.search.toLowerCase()
			data = data.filter(d => d.name.toLowerCase().includes(q))
		}
		return data.map(d => ({
			id: d.id,
			name: d.name,
			short_name: d.short_name,
			code: d.code,
			head_id: d.head_id ?? null,
			deputy_id: d.deputy_id ?? null,
			description: d.description,
		}))
	}
	const qs = new URLSearchParams()
	if (params.search) qs.set('search', params.search)
	return http<Department[]>(`/departments/?${qs.toString()}`, { auth: true })
}

export async function getDepartment(id: number): Promise<DepartmentDetail> {
	if (USE_MOCK) {
		await delay()
		const d = mockDepartments.find(d => d.id === id)
		if (!d) throw new Error('Кафедра не найдена')
		return cloneDept(d)
	}
	return http<DepartmentDetail>(`/departments/${id}/`, { auth: true })
}

export async function getDepartmentInfo(id: number): Promise<DepartmentInfo> {
	if (USE_MOCK) {
		await delay()
		const d = mockDepartments.find(d => d.id === id)
		if (!d) throw new Error('Кафедра не найдена')
		if (!d.info) throw new Error('Информация отсутствует')
		return { ...d.info }
	}
	return http<DepartmentInfo>(`/departments/${id}/info/`, { auth: true })
}

export async function listDepartmentEmployees(
	id: number
): Promise<DepartmentEmployee[]> {
	if (USE_MOCK) {
		await delay()
		const d = mockDepartments.find(d => d.id === id)
		if (!d) throw new Error('Кафедра не найдена')
		return d.employees.map(e => ({ ...e }))
	}
	return http<DepartmentEmployee[]>(`/departments/${id}/staff/`, { auth: true })
}

export async function listDepartmentGroups(
	id: number
): Promise<ResearchGroup[]> {
	if (USE_MOCK) {
		await delay()
		const d = mockDepartments.find(d => d.id === id)
		if (!d) throw new Error('Кафедра не найдена')
		return d.groups.map(g => ({ ...g }))
	}
	return http<ResearchGroup[]>(`/departments/${id}/groups/`, { auth: true })
}

// --- Mutations (optional future) --- //
export async function createDepartment(
	input: DepartmentInput
): Promise<DepartmentDetail> {
	if (USE_MOCK) {
		await delay()
		const dep: MockDepartment = {
			id: nextDeptId++,
			name: input.name.trim(),
			short_name: input.short_name?.trim(),
			code: input.code?.trim(),
			description: input.description?.trim(),
			head_id: input.head_id ?? null,
			deputy_id: input.deputy_id ?? null,
			employees: [],
			groups: [],
			info: undefined,
		}
		mockDepartments.push(dep)
		return cloneDept(dep)
	}
	return http<DepartmentDetail>(`/departments/`, {
		method: 'POST',
		auth: true,
		body: JSON.stringify(input),
	})
}

export async function updateDepartment(
	id: number,
	patch: Partial<DepartmentInput>
): Promise<DepartmentDetail> {
	if (USE_MOCK) {
		await delay()
		const idx = mockDepartments.findIndex(d => d.id === id)
		if (idx === -1) throw new Error('Not found')
		const cur = mockDepartments[idx]
		mockDepartments[idx] = {
			...cur,
			...patch,
			name: patch.name ? patch.name.trim() : cur.name,
			short_name: patch.short_name?.trim() ?? cur.short_name,
			code: patch.code?.trim() ?? cur.code,
			description: patch.description?.trim() ?? cur.description,
		}
		return cloneDept(mockDepartments[idx])
	}
	return http<DepartmentDetail>(`/departments/${id}/`, {
		method: 'PATCH',
		auth: true,
		body: JSON.stringify(patch),
	})
}

export async function deleteDepartment(id: number): Promise<void> {
	if (USE_MOCK) {
		await delay()
		mockDepartments = mockDepartments.filter(d => d.id !== id)
		return
	}
	await http(`/departments/${id}/`, { method: 'DELETE', auth: true })
}
