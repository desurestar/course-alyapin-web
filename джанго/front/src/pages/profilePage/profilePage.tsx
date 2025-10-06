import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
	List,
	type ArticleRef,
	type ResearchGroup,
} from '../../components/list/list'
import {
	getArticlesByEmployeeId,
	getArticlesByUserId,
	getEmployeeByUserId,
	getGroupsByUserId,
	getUserById,
} from '../../mocks/profile.mocks'
import styles from './profilePage.module.css'

export const ProfilePage: FC = () => {
	const params = useParams()
	const navigate = useNavigate()
	const userId = Number(params.id || 1)

	const user = getUserById(userId)
	const employee = getEmployeeByUserId(userId)
	const groups = getGroupsByUserId(userId)
	const articles: ArticleRef[] = employee
		? getArticlesByEmployeeId(employee.id)
		: getArticlesByUserId(userId)

	if (!user) {
		return (
			<main className={styles.main}>
				<div className={styles.notFound}>
					Пользователь не найден
					<button className={styles.backBtn} onClick={() => navigate(-1)}>
						Назад
					</button>
				</div>
			</main>
		)
	}

	return (
		<main className={styles.main}>
			<section className={styles.headerCard}>
				<div className={styles.headerTop}>
					<h1 className={styles.title}>
						{employee?.fullName || user.username}
					</h1>
					<button className={styles.backBtn} onClick={() => navigate(-1)}>
						Назад
					</button>
				</div>
				<div className={styles.meta}>
					<div>
						<span className={styles.muted}>Роль: </span>
						{user.role}
					</div>
					{employee?.position && (
						<div>
							<span className={styles.muted}>Должность: </span>
							{employee.position}
						</div>
					)}
					{user.email && (
						<div>
							<span className={styles.muted}>Email: </span>
							{user.email}
						</div>
					)}
					{employee?.phone && (
						<div>
							<span className={styles.muted}>Телефон: </span>
							{employee.phone}
						</div>
					)}
				</div>
			</section>

			<List<ResearchGroup>
				variant='groups'
				title='Научные коллективы'
				items={groups}
				emptyText='Нет участий'
				autoNavigate
			/>

			<List<ArticleRef>
				variant='articles'
				title='Публикации'
				items={articles}
				emptyText='Нет публикаций'
				autoNavigate
			/>
		</main>
	)
}
