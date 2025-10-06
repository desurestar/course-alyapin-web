import type {
	ArticleRef,
	Employee,
	GroupMember,
	ResearchGroup,
	UserRef,
} from '../components/list/list'
import type { Project } from '../components/progect/progect'

export const employees: Employee[] = [
	{
		id: 1,
		fullName: 'Иванов И.И.',
		position: 'профессор',
		email: 'ivanov@uni.ru',
		phone: '+7 (843) 111-11-11',
	},
	{
		id: 2,
		fullName: 'Петров П.П.',
		position: 'доцент',
		email: 'petrov@uni.ru',
	},
]

export const departments = [
	{
		id: 1,
		name: 'Кафедра информатики',
		headName: 'Иванов И.И.',
		phone: '+7 (843) 222-22-22',
	},
	{ id: 2, name: 'Кафедра математики', headName: 'Смирнова О.О.' },
]

export const users: UserRef[] = [
	{ id: 1, username: 'admin', role: 'Администратор', email: 'admin@uni.ru' },
	{ id: 2, username: 'user01', role: 'Пользователь', email: 'user01@uni.ru' },
]

export const groups: ResearchGroup[] = [
	{
		id: 1,
		name: 'Интеллектуальные системы',
		leaderName: 'Петров П.П.',
		membersCount: 8,
	},
	{ id: 2, name: 'НейроИНФО', leaderName: 'Иванов И.И.', membersCount: 12 },
	{
		id: 3,
		name: 'Data Science Lab',
		leaderName: 'Сидорова А.А.',
		membersCount: 6,
	},
]

export const articles: ArticleRef[] = [
	{
		id: 1,
		title: 'Методы анализа текстов',
		authors: 'Иванов, Петров',
		journal: 'Вестник ИТ',
		year: 2024,
	},
	{ id: 2, title: 'Семантические сети', authors: 'Сидорова', year: 2023 },
]

export const groupMembers: GroupMember[] = [
	{ id: 1, fullName: 'Кузнецов Д.Д.', role: 'Руководитель' },
	{ id: 2, fullName: 'Орлова Н.Н.', role: 'Участник' },
]

// Пример под проекты (можно использовать существующие из progect.mocks)
export const projectRows: Project[] = [
	{
		id: 10,
		title: 'Аналитика публикаций',
		startDate: '2024-01-01',
		status: 'in_progress',
		supervisor: { id: 1, fullName: 'Иванов И.И.' },
	},
	{
		id: 11,
		title: 'Платформа НИР',
		startDate: '2023-09-01',
		endDate: '2025-03-01',
		status: 'planned',
		supervisor: { id: 2, fullName: 'Петров П.П.' },
	},
]

// без filepath
// <List variant="employees" title="Работники" items={employees} onItemClick={i => console.log(i)} />
// <List variant="departments" title="Кафедры" items={departments} />
// <List variant="projects" title="Проекты" items={projectRows} />
