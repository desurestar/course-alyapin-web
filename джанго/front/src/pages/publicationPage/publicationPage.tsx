import type { FC } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/auth'
import type { ArticleRef } from '../../components/list/list'
import { PublicationList } from '../../components/publication/publicationList'
import { usePublications } from '../../hooks/usePublications'
import type { ProfileArticle } from '../../types/profile'
import styles from './publicationPage.module.css'

function mapToArticleRef(a: ProfileArticle): ArticleRef {
	return {
		id: a.id,
		title: a.title,
		year: new Date().getFullYear(), // placeholder until backend supplies year
		journal: (a as any).journal, // optional future field
		authors: a.authors.map(au => au.full_name || `user#${au.id}`).join(', '),
	}
}

export const PublicationPage: FC = () => {
	const navigate = useNavigate()
	const { user } = useAuth()
	if (!user) return <Navigate to='/login' replace />

	const { mine, others, loading, error, search, setSearch } = usePublications()

	const mineMapped = mine.map(mapToArticleRef)
	const othersMapped = others.map(mapToArticleRef)

	return (
		<main className={styles.main}>
			<div className={styles.header}>
				<h1 className={styles.title}>Публикации</h1>
				<button className={styles.backBtn} onClick={() => navigate(-1)}>
					Назад
				</button>
			</div>

			<div className={styles.toolbar}>
				<input
					className={styles.search}
					placeholder='Поиск публикаций'
					value={search}
					onChange={e => setSearch(e.target.value)}
				/>
			</div>

			{error && <div className={styles.error}>{error}</div>}

			<section className={styles.section}>
				<h2 className={styles.subtitle}>Мои публикации</h2>
				<PublicationList
					items={mineMapped}
					emptyText={loading ? 'Загрузка...' : 'Публикаций пока нет'}
				/>
			</section>

			<section className={styles.section}>
				<h2 className={styles.subtitle}>Другие публикации</h2>
				<PublicationList
					items={othersMapped}
					emptyText={loading ? 'Загрузка...' : 'Нет других публикаций'}
				/>
			</section>
		</main>
	)
}
