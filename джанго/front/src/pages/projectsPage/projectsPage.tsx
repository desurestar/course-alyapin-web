import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { List } from '../../components/list/list'
import { projects } from '../../mocks/progect.mocks'
import styles from './projectsPage.module.css'

export const ProjectsPage: FC = () => {
	const navigate = useNavigate()
	return (
		<main className={styles.main}>
			<div className={styles.header}>
				<h1 className={styles.title}>Проекты</h1>
				<button className={styles.backBtn} onClick={() => navigate(-1)}>
					Назад
				</button>
			</div>

			<List
				variant='projects'
				items={projects}
				emptyText='Проектов пока нет'
				onItemClick={p => console.log('Открыть проект:', (p as any).id)}
			/>
		</main>
	)
}
