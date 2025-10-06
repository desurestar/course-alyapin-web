import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { List } from '../../components/list/list'
import { useProjects } from '../../hooks/useProjects'
import styles from './projectsPage.module.css'

export const ProjectsPage: FC = () => {
	const navigate = useNavigate()
	const { projects, loading, error } = useProjects()
	return (
		<main className={styles.main}>
			<div className={styles.header}>
				<h1 className={styles.title}>Проекты</h1>
				<button className={styles.backBtn} onClick={() => navigate(-1)}>
					Назад
				</button>
			</div>

			{error && (
				<div style={{ color: '#ef4444', marginBottom: 12 }}>
					Ошибка: {error}
				</div>
			)}
			<List
				variant='projects'
				items={projects as any}
				loading={loading}
				emptyText='Проектов пока нет'
				onItemClick={p => {
					const groupId = (p as any).group_id ?? (p as any).teamId
					if (groupId) navigate(`/groups/${groupId}`)
				}}
			/>
		</main>
	)
}
