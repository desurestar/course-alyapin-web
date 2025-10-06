import type { NavItem } from '../components/header/header'

export const logoUrl = new URL('../assets/КафедраДжаго.svg', import.meta.url)
	.href

export const navItems: NavItem[] = [
	{
		id: 1,
		label: 'О кафедре',
		path: '/about',
		subItems: [
			{ id: 101, label: 'История', path: '/about/history' },
			{ id: 102, label: 'Сотрудники', path: '/staff' },
			{ id: 103, label: 'Контакты', path: '/contacts' },
		],
	},
	{
		id: 2,
		label: 'Образование',
		path: '/education',
		subItems: [
			{ id: 201, label: 'Программы', path: '/education/programs' },
			{ id: 202, label: 'Расписание', path: '/schedule' },
			{ id: 203, label: 'Абитуриентам', path: '/abiturients' },
		],
	},
	{
		id: 3,
		label: 'Наука',
		path: '/science',
		subItems: [
			{ id: 301, label: 'Проекты', path: '/projects' },
			{ id: 302, label: 'Гранты', path: '/grants' },
			{ id: 303, label: 'Публикации', path: '/publications' },
		],
	},
	{ id: 4, label: 'Новости', path: '/news' },
	{ id: 5, label: 'Документы', path: '/docs' },
]
