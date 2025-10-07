import React from 'react'
import { Link } from 'react-router-dom'
import styles from './adminMainPage.module.css'

const adminLinks = [
	{ to: '/admin/departments', label: 'Кафедры' },
	{ to: '/admin/groups', label: 'Группы' },
	{ to: '/admin/projects', label: 'Проекты' },
	{ to: '/admin/grants', label: 'Гранты' },
	{ to: '/admin/publications', label: 'Публикации' },
	{ to: '/admin/users', label: 'Пользователи' },
]

export const AdminMainPage: React.FC = () => {
	return (
		<main className={styles.page}>
			<h1 className={styles.title}>Администрирование</h1>
			<div className={styles.grid}>
				{adminLinks.map(l => (
					<Link key={l.to} to={l.to} className={styles.card}>
						{l.label}
					</Link>
				))}
			</div>
		</main>
	)
}
export default AdminMainPage
