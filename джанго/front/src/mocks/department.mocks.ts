import type {
	DepartmentRef,
	Employee,
	ResearchGroup,
} from '../components/list/list'
import { departments as baseDepartments } from './list.mocks'

// Берём базовые кафедры из list.mocks
export const departments: DepartmentRef[] = baseDepartments

// Работники с привязкой к кафедре
type EmployeeWithDept = Employee & { departmentId: number }
const employeesAll: EmployeeWithDept[] = [
	{
		id: 1,
		fullName: 'Иванов И.И.',
		position: 'заведующий кафедрой',
		email: 'ivanov@uni.ru',
		phone: '+7 (843) 111-11-11',
		departmentId: 1,
	},
	{
		id: 2,
		fullName: 'Петров П.П.',
		position: 'доцент',
		email: 'petrov@uni.ru',
		departmentId: 1,
	},
	{
		id: 3,
		fullName: 'Сидорова А.А.',
		position: 'старший преподаватель',
		email: 'sidorova@uni.ru',
		departmentId: 2,
	},
	{ id: 4, fullName: 'Орлова Н.Н.', position: 'ассистент', departmentId: 2 },
]

// Научные коллективы с привязкой к кафедре
type GroupWithDept = ResearchGroup & { departmentId: number }
const groupsAll: GroupWithDept[] = [
	{
		id: 10,
		name: 'Интеллектуальные системы',
		leaderName: 'Петров П.П.',
		membersCount: 8,
		departmentId: 1,
	},
	{
		id: 11,
		name: 'НейроИНФО',
		leaderName: 'Иванов И.И.',
		membersCount: 12,
		departmentId: 1,
	},
	{
		id: 20,
		name: 'Прикладная математика',
		leaderName: 'Сидорова А.А.',
		membersCount: 6,
		departmentId: 2,
	},
]

// Хелперы для страницы кафедры
export function getDepartmentById(id: number): DepartmentRef | undefined {
	return departments.find(d => d.id === id)
}
export function getEmployeesByDepartment(id: number): Employee[] {
	return employeesAll
		.filter(e => e.departmentId === id)
		.map(({ departmentId, ...e }) => e)
}
export function getGroupsByDepartment(id: number): ResearchGroup[] {
	return groupsAll
		.filter(g => g.departmentId === id)
		.map(({ departmentId, ...g }) => g)
}
