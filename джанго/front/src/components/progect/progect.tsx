import React from 'react'
import styles from './progect.module.css'

export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold'

export interface Supervisor {
	id: number
	fullName: string
	position?: string
}

export interface Project {
	id: number
	title: string
	description?: string
	startDate: string // ISO: '2025-09-01'
	endDate?: string // ISO
	status: ProjectStatus
	budget?: number
	currency?: 'RUB' | 'USD' | 'EUR'
	grantId?: number | null
	teamId?: number | null
	supervisor: Supervisor
	tags?: string[]
	website?: string
}

export interface ProgectProps {
	projects: Project[]
	onProjectClick?: (project: Project) => void
}

const statusLabel = (s: ProjectStatus) =>
	s === 'planned'
		? 'Запланирован'
		: s === 'in_progress'
		? 'В работе'
		: s === 'completed'
		? 'Завершён'
		: 'На паузе'

const formatDateRange = (start: string, end?: string) => {
	const fmt = (d: string) =>
		new Date(d).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short' })
	return end ? `${fmt(start)} — ${fmt(end)}` : `${fmt(start)} — н.в.`
}

const formatCurrency = (value: number, currency: Project['currency'] = 'RUB') =>
	new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(value)

export const Progect: React.FC<ProgectProps> = ({
	projects,
	onProjectClick,
}) => {
	if (!projects?.length) {
		return (
			<section className={styles.projects}>
				<h2 className={styles.title}>Проекты</h2>
				<div className={styles.empty}>Пока нет проектов</div>
			</section>
		)
	}

	return (
		<section className={styles.projects}>
			<h2 className={styles.title}>Проекты</h2>
			<div className={styles.grid}>
				{projects.map(p => (
					<article
						key={p.id}
						className={styles.card}
						role='button'
						tabIndex={0}
						onClick={() => onProjectClick?.(p)}
						onKeyDown={e =>
							(e.key === 'Enter' || e.key === ' ') && onProjectClick?.(p)
						}
					>
						<div className={styles.cardHeader}>
							<h3 className={styles.cardTitle}>{p.title}</h3>
							<span
								className={`${styles.badge} ${styles[`status_${p.status}`]}`}
							>
								{statusLabel(p.status)}
							</span>
						</div>

						{p.description && (
							<p className={styles.cardDesc}>{p.description}</p>
						)}

						<div className={styles.meta}>
							<span className={styles.metaItem}>
								{formatDateRange(p.startDate, p.endDate)}
							</span>
							<span className={styles.metaDot}>•</span>
							<span className={styles.metaItem}>
								Рук.: {p.supervisor.fullName}
							</span>
							{typeof p.budget === 'number' && (
								<>
									<span className={styles.metaDot}>•</span>
									<span className={styles.metaItem}>
										Бюджет: {formatCurrency(p.budget, p.currency)}
									</span>
								</>
							)}
						</div>

						{p.tags?.length ? (
							<div className={styles.tags}>
								{p.tags.map(t => (
									<span key={t} className={styles.tag}>
										{t}
									</span>
								))}
							</div>
						) : null}

						{p.website && (
							<a
								className={styles.cardLink}
								href={p.website}
								target='_blank'
								rel='noopener noreferrer'
								onClick={e => e.stopPropagation()}
							>
								Сайт проекта
							</a>
						)}
					</article>
				))}
			</div>
		</section>
	)
}
