import type { Project } from '../components/progect/progect'

export const projects: Project[] = [
	{
		id: 1,
		title: 'Интеллектуальная система анализа публикаций',
		description:
			'Разработка сервиса для тематического анализа и визуализации научных публикаций кафедры.',
		startDate: '2024-02-01',
		status: 'in_progress',
		budget: 2500000,
		currency: 'RUB',
		grantId: 101,
		teamId: 11,
		supervisor: { id: 1, fullName: 'Иванов И.И.', position: 'профессор' },
		tags: ['NLP', 'Vue/React', 'Визуализация'],
		website: 'https://example.com/projects/nlp-analytics',
	},
	{
		id: 2,
		title: 'Платформа управления научными коллективами',
		description:
			'Единая платформа для учёта научных коллективов, участников и ролей.',
		startDate: '2023-09-15',
		endDate: '2025-03-01',
		status: 'planned',
		budget: 1200000,
		currency: 'RUB',
		grantId: null,
		teamId: 12,
		supervisor: { id: 2, fullName: 'Петров П.П.', position: 'доцент' },
		tags: ['Django', 'PostgreSQL', 'RBAC'],
	},
	{
		id: 3,
		title: 'Репозиторий данных по грантам и проектам',
		description:
			'Хранилище данных и API для интеграции с сайтом кафедры и внешними системами.',
		startDate: '2022-05-10',
		endDate: '2024-12-31',
		status: 'completed',
		budget: 900000,
		currency: 'RUB',
		grantId: 77,
		teamId: 7,
		supervisor: {
			id: 3,
			fullName: 'Сидорова А.А.',
			position: 'старший научный сотрудник',
		},
		tags: ['REST', 'ETL', 'Data Lake'],
		website: 'https://example.com/projects/grants-repo',
	},
	{
		id: 4,
		title: 'Автоматизация отчётности по публикациям',
		description:
			'Инструмент формирования отчётов по публикационной активности кафедры.',
		startDate: '2025-01-20',
		status: 'on_hold',
		supervisor: { id: 4, fullName: 'Кузнецов Д.Д.' },
		tags: ['Reporting', 'Excel/CSV', 'Scheduler'],
	},
]
