import React from 'react'
import { useNavigate } from 'react-router-dom'
import { List, type DepartmentRef } from '../../components/list/list'
import { useDepartmentList } from '../../hooks/useDepartmentList'
import styles from './homePage.module.css'

export const HomePage: React.FC = () => {
	const navigate = useNavigate()
	const { departments, loading, error } = useDepartmentList()
	const items: DepartmentRef[] = departments.map(d => ({
		id: d.id,
		name: d.name,
	}))

	return (
		<main className={styles.main}>
			{error && <div className={styles.error}>{error}</div>}
			{loading && <div className={styles.loading}>Загрузка...</div>}
			<List<DepartmentRef>
				variant='departments'
				title='Кафедры'
				items={items}
				emptyText={loading ? 'Загрузка...' : 'Кафедр пока нет'}
				onItemClick={d => navigate(`/departments/${d.id}`)}
			/>
		</main>
	)
}
