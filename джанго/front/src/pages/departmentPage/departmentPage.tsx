import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { List } from '../../components/list/list'
import { useDepartment } from '../../hooks/useDepartment'
import styles from './departmentPage.module.css'

export const DepartmentPage: React.FC = () => {
	const params = useParams()
	const navigate = useNavigate()
	const id = Number(params.id)
	const { department, loading, error } = useDepartment(
		Number.isFinite(id) ? id : undefined
	)

	if (loading) {
		return (
			<main className={styles.main}>
				<div className={styles.info}>Загрузка...</div>
			</main>
		)
	}
	if (error) {
		return (
			<main className={styles.main}>
				<div className={styles.error}>{error}</div>
			</main>
		)
	}
	if (!department) {
		return (
			<main className={styles.main}>
				<div className={styles.notFound}>
					Кафедра не найдена
					<button className={styles.backBtn} onClick={() => navigate('/')}>
						На главную
					</button>
				</div>
			</main>
		)
	}

	const employees = department.employees.map(e => ({
		id: e.id,
		name: e.full_name,
	}))
	const groups = department.groups.map(g => ({ id: g.id, name: g.name }))

	return (
		<main className={styles.main}>
			<section className={styles.headerCard}>
				<div className={styles.headerTop}>
					<h1 className={styles.title}>{department.name}</h1>
					<button className={styles.backBtn} onClick={() => navigate(-1)}>
						Назад
					</button>
				</div>
				<div className={styles.meta}>
					<div>
						<span className={styles.muted}>Заведующий: </span>
						{department.head?.full_name || '—'}
					</div>
					<div>
						<span className={styles.muted}>Код: </span>
						{department.code || '—'}
					</div>
				</div>
				{department.info && (
					<div className={styles.infoBlocks}>
						{department.info.history && (
							<p>
								<strong>История: </strong>
								{department.info.history}
							</p>
						)}
						{department.info.mission && (
							<p>
								<strong>Миссия: </strong>
								{department.info.mission}
							</p>
						)}
						{department.info.scientific_activities && (
							<p>
								<strong>Научная деятельность: </strong>
								{department.info.scientific_activities}
							</p>
						)}
					</div>
				)}
			</section>

			<List
				variant='employees'
				title='Работники кафедры'
				items={employees}
				emptyText='Работников пока нет'
				autoNavigate
			/>

			<List
				variant='groups'
				title='Научные коллективы кафедры'
				items={groups}
				emptyText='Коллективов пока нет'
				autoNavigate
			/>
		</main>
	)
}

// NOTE: To integrate with real backend, replace getDepartmentDetail implementation in api/department.ts with http requests.
// Example: http(`departments/${id}/`, { auth:false }) returning DepartmentDetail shape.
// Employees & groups expected inline; if separate endpoints, fetch in parallel inside useDepartment.
