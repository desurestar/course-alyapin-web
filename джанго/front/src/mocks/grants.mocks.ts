import type { Grant } from '../components/list/list'

export const grants: Grant[] = [
	{
		id: 101,
		title: 'Разработка интеллектуальной обучающей платформы',
		fund: 'РНФ',
		amount: 12000000,
		supervisorName: 'Иванов И.И.',
		startDate: '2023-02-01',
		endDate: '2025-12-31',
	},
	{
		id: 102,
		title: 'Аналитика больших данных в образовании',
		fund: 'Минобрнауки',
		amount: 8000000,
		supervisorName: 'Петров П.П.',
		startDate: '2024-03-01',
	},
	{
		id: 103,
		title: 'Нейросетевые методы распознавания речи',
		fund: 'Фонд Бортника',
		amount: 5000000,
		supervisorName: 'Сидорова А.А.',
		startDate: '2022-09-01',
		endDate: '2024-08-31',
	},
]
