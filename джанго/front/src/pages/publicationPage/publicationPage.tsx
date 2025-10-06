import type { FC } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/auth'
import { PublicationList } from '../../components/publication/publicationList'
import {
	getArticlesByEmployeeId,
	getArticlesByUserId,
	getEmployeeByUserId,
} from '../../mocks/profile.mocks'
import styles from './publicationPage.module.css'

export const PublicationPage: FC = () => {
	const navigate = useNavigate()
	const { userId } = useAuth()

	if (!userId) {
		return <Navigate to='/login' replace />
	}

	const employee = getEmployeeByUserId(userId)
	const articles = employee
		? getArticlesByEmployeeId(employee.id)
		: getArticlesByUserId(userId)

	return (
		<main className={styles.main}>
			<div className={styles.header}>
				<h1 className={styles.title}>Мои публикации</h1>
				<button className={styles.backBtn} onClick={() => navigate(-1)}>
					Назад
				</button>
			</div>

			<PublicationList items={articles} emptyText='Публикаций пока нет' />
		</main>
	)
}
