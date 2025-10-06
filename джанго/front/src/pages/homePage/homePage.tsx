import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './homePage.module.css'

import { List, type DepartmentRef } from '../../components/list/list'
import { departments } from '../../mocks/list.mocks'

export const HomePage: React.FC = () => {
	const navigate = useNavigate()

	return (
		<>
			<main className={styles.main}>
				<List<DepartmentRef>
					variant='departments'
					title='Кафедры'
					items={departments}
					emptyText='Кафедр пока нет'
					onItemClick={d => navigate(`/departments/${d.id}`)}
				/>
			</main>
		</>
	)
}
