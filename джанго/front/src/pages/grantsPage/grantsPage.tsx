import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, type Grant } from '../../components/list/list'
import { grants } from '../../mocks/grants.mocks'
import styles from './grantsPage.module.css'

export const GrantsPage: FC = () => {
	const navigate = useNavigate()
	return (
		<main className={styles.main}>
			<div className={styles.header}>
				<h1 className={styles.title}>Гранты</h1>
				<button className={styles.backBtn} onClick={() => navigate(-1)}>
					Назад
				</button>
			</div>

			<List<Grant>
				variant='grants'
				items={grants}
				emptyText='Грантов пока нет'
				onItemClick={g => console.log('Открыть грант:', g.id)}
			/>
		</main>
	)
}
