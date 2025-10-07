import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listGrants, type GrantSummary } from '../../api/grants'
import { List, type Grant } from '../../components/list/list'
import styles from './grantsPage.module.css'

export const GrantsPage: FC = () => {
	const navigate = useNavigate()
	const [items, setItems] = useState<Grant[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let active = true
		setLoading(true)
		setError(null)
		listGrants()
			.then(data => {
				if (!active) return
				// map backend GrantSummary -> UI Grant shape expected by List<Grant>
				const mapped: Grant[] = data.map((g: GrantSummary) => ({
					id: g.id,
					title: g.title,
					fund: g.agency || g.code || '—',
					amount: g.amount,
					supervisorName: g.leader_name || '—',
					startDate: g.start_date,
					endDate: g.end_date,
				}))
				setItems(mapped)
			})
			.catch(err => {
				if (!active) return
				setError(err?.message || 'Ошибка загрузки')
			})
			.finally(() => {
				if (active) setLoading(false)
			})
		return () => {
			active = false
		}
	}, [])

	return (
		<main className={styles.main}>
			<div className={styles.header}>
				<h1 className={styles.title}>Гранты</h1>
				<button className={styles.backBtn} onClick={() => navigate(-1)}>
					Назад
				</button>
			</div>
			{error && <div className={styles.error}>{error}</div>}
			<List<Grant>
				variant='grants'
				items={items}
				loading={loading}
				emptyText='Грантов пока нет'
				onItemClick={g => console.log('Открыть грант:', g.id)}
			/>
		</main>
	)
}
