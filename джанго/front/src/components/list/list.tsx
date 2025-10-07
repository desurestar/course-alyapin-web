import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserIdByEmployeeId } from '../../mocks/profile.mocks'
import type { Project } from '../progect/progect'
import styles from './list.module.css'

export type ListVariant =
	| 'employees'
	| 'departments'
	| 'users'
	| 'groups'
	| 'articles'
	| 'projects'
	| 'groupMembers'
	| 'grants' // добавлено

export interface Employee {
	id: number
	fullName: string
	position?: string
	email?: string
	phone?: string
}
export interface DepartmentRef {
	id: number
	name: string
	headName?: string
	phone?: string
}
export interface UserRef {
	id: number
	username: string
	role: string
	email?: string
}
export interface ResearchGroup {
	id: number
	name: string
	leaderName?: string
	membersCount?: number
	membershipRole?: string
}
export interface ArticleRef {
	id: number
	title: string
	year: number
	journal?: string
	authors: string
}
export interface GroupMember {
	id: number
	fullName: string
	role: string
}

// добавлено: тип гранта
export interface Grant {
	id: number
	title: string
	fund: string
	amount?: number
	startDate?: string
	endDate?: string
	supervisorName?: string
}

type AnyItem =
	| Employee
	| DepartmentRef
	| UserRef
	| ResearchGroup
	| ArticleRef
	| GroupMember
	| Project
	| Grant // добавлено

export interface ListProps<T = AnyItem> {
	variant: ListVariant
	items: T[]
	title?: string
	loading?: boolean
	emptyText?: string
	rightActions?: React.ReactNode
	onItemClick?: (item: T) => void
	autoNavigate?: boolean // добавлено: вкл. встроенную навигацию по клику
}

const statusLabel = (s: Project['status']) =>
	s === 'planned'
		? 'Запланирован'
		: s === 'in_progress'
		? 'В работе'
		: s === 'completed'
		? 'Завершён'
		: 'На паузе'

const formatDateRange = (start?: string, end?: string) => {
	if (!start) return ''
	const f = (d: string) =>
		new Date(d).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short' })
	return end ? `${f(start)} — ${f(end)}` : `${f(start)} — н.в.`
}

type Column<T> = {
	header: string
	className?: string
	render: (item: T) => React.ReactNode
}

function getColumns(variant: ListVariant): Column<any>[] {
	switch (variant) {
		case 'employees':
			return [
				{ header: 'ФИО', render: (i: Employee) => i.fullName },
				{ header: 'Должность', render: (i: Employee) => i.position || '—' },
				{ header: 'Email', render: (i: Employee) => i.email || '—' },
				{ header: 'Телефон', render: (i: Employee) => i.phone || '—' },
			]
		case 'departments':
			return [
				{ header: 'Кафедра', render: (i: DepartmentRef) => i.name },
				{
					header: 'Заведующий',
					render: (i: DepartmentRef) => i.headName || '—',
				},
				{ header: 'Телефон', render: (i: DepartmentRef) => i.phone || '—' },
			]
		case 'users':
			return [
				{ header: 'Логин', render: (i: UserRef) => i.username },
				{ header: 'Роль', render: (i: UserRef) => i.role },
				{ header: 'Email', render: (i: UserRef) => i.email || '—' },
			]
		case 'groups':
			return [
				{
					header: 'Научный коллектив',
					render: (i: ResearchGroup & { membershipRole?: string }) => i.name,
				},
				{
					header: 'Руководитель',
					render: (i: ResearchGroup) => i.leaderName || '—',
				},
				{
					header: 'Участников',
					render: (i: ResearchGroup) => i.membersCount ?? '—',
				},
				{
					header: 'Роль',
					className: styles.colFit,
					render: (i: ResearchGroup & { membershipRole?: string }) =>
						i.membershipRole || '—',
				},
			]
		case 'articles':
			return [
				{ header: 'Название', render: (i: ArticleRef) => i.title },
				{ header: 'Авторы', render: (i: ArticleRef) => i.authors },
				{ header: 'Журнал', render: (i: ArticleRef) => i.journal || '—' },
				{
					header: 'Год',
					className: styles.colFit,
					render: (i: ArticleRef) => i.year,
				},
			]
		case 'projects':
			return [
				{ header: 'Проект', render: (p: Project) => p.title },
				{
					header: 'Статус',
					className: styles.colFit,
					render: (p: Project) => (
						<span className={`${styles.badge} ${styles[`status_${p.status}`]}`}>
							{statusLabel(p.status)}
						</span>
					),
				},
				{
					header: 'Руководитель',
					render: (p: Project) => p.supervisor?.fullName || '—',
				},
				{
					header: 'Сроки',
					className: styles.colFit,
					render: (p: Project) => formatDateRange(p.startDate, p.endDate),
				},
			]
		case 'grants': // добавлено
			return [
				{ header: 'Грант', render: (g: Grant) => g.title },
				{ header: 'Фонд', render: (g: Grant) => g.fund },
				{
					header: 'Сумма',
					className: styles.colFit,
					render: (g: Grant) =>
						g.amount ? g.amount.toLocaleString('ru-RU') + ' ₽' : '—',
				},
				{
					header: 'Руководитель',
					render: (g: Grant) => g.supervisorName || '—',
				},
				{
					header: 'Сроки',
					className: styles.colFit,
					render: (g: Grant) => formatDateRange(g.startDate, g.endDate),
				},
			]
		case 'groupMembers': // добавлено
			return [
				{ header: 'ФИО', render: (i: GroupMember) => i.fullName },
				{
					header: 'Роль',
					className: styles.colFit,
					render: (i: GroupMember) => i.role,
				},
			]
		default:
			return []
	}
}

export function List<T extends AnyItem>({
	variant,
	items,
	title,
	loading,
	emptyText,
	rightActions,
	onItemClick,
	autoNavigate = false,
}: ListProps<T>) {
	const navigate = useNavigate()

	// Normalize project status coming as on_hold from backend to paused (frontend naming)
	if (variant === 'projects') {
		items = items.map((it: any) =>
			it.status === 'on_hold' ? { ...it, status: 'paused' } : it
		) as any
	}

	const handleItemClick = (item: AnyItem) => {
		if (onItemClick) {
			onItemClick(item as T)
			return
		}
		if (!autoNavigate) return
		switch (variant) {
			case 'employees': {
				const emp = item as Employee
				const uid = getUserIdByEmployeeId(emp.id)
				if (uid) navigate(`/profile/${uid}`)
				break
			}
			case 'users': {
				const u = item as UserRef
				navigate(`/profile/${u.id}`)
				break
			}
			case 'groupMembers': {
				const gm = item as GroupMember
				navigate(`/profile/${gm.id}`)
				break
			}
			case 'groups': {
				const g = item as ResearchGroup
				navigate(`/groups/${g.id}`, { state: { group: g } })
				break
			}
			case 'articles': {
				navigate('/publications')
				break
			}
			case 'projects': {
				navigate('/projects')
				break
			}
			case 'grants': {
				navigate('/grants')
				break
			}
			default:
				break
		}
	}

	const columns = getColumns(variant)

	return (
		<section className={styles.listSection}>
			{(title || rightActions) && (
				<div className={styles.listHeader}>
					{title && <h2 className={styles.title}>{title}</h2>}
					{rightActions && <div className={styles.actions}>{rightActions}</div>}
				</div>
			)}

			<div className={styles.tableWrap}>
				<table className={styles.table}>
					<thead>
						<tr>
							{columns.map((c, i) => (
								<th key={i} className={c.className}>
									{c.header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td className={styles.muted} colSpan={columns.length}>
									Загрузка…
								</td>
							</tr>
						) : items?.length ? (
							items.map((item: any, idx) => {
								const clickable = Boolean(onItemClick || autoNavigate)
								return (
									<tr
										key={item.id ?? idx}
										className={clickable ? styles.rowClickable : undefined}
										onClick={
											clickable ? () => handleItemClick(item) : undefined
										}
										tabIndex={clickable ? 0 : -1}
										onKeyDown={e => {
											if (!clickable) return
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault()
												handleItemClick(item)
											}
										}}
									>
										{columns.map((c, i) => (
											<td key={i} className={c.className}>
												{c.render(item)}
											</td>
										))}
									</tr>
								)
							})
						) : (
							<tr>
								<td className={styles.muted} colSpan={columns.length}>
									{emptyText || 'Нет данных'}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</section>
	)
}
