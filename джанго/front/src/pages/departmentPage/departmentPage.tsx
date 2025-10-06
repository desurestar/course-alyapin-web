import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './departmentPage.module.css'

import {
	List,
	type DepartmentRef,
	type Employee,
	type ResearchGroup,
} from '../../components/list/list'
import {
	getDepartmentById,
	getEmployeesByDepartment,
	getGroupsByDepartment,
} from '../../mocks/department.mocks'

export const DepartmentPage: React.FC = () => {
	const params = useParams()
	const navigate = useNavigate()
	const id = Number(params.id)

	const department: DepartmentRef | undefined = Number.isFinite(id)
		? getDepartmentById(id)
		: undefined
	const employees: Employee[] = Number.isFinite(id)
		? getEmployeesByDepartment(id)
		: []
	const groups: ResearchGroup[] = Number.isFinite(id)
		? getGroupsByDepartment(id)
		: []

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
						{department.headName || '—'}
					</div>
					<div>
						<span className={styles.muted}>Телефон: </span>
						{department.phone || '—'}
					</div>
				</div>
			</section>

			<List<Employee>
				variant='employees'
				title='Работники кафедры'
				items={employees}
				emptyText='Работников пока нет'
				autoNavigate
			/>

			<List<ResearchGroup>
				variant='groups'
				title='Научные коллективы кафедры'
				items={groups}
				emptyText='Коллективов пока нет'
				autoNavigate
			/>
		</main>
	)
}
