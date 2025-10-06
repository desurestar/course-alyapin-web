import type { FC } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
	List,
	type ArticleRef,
	type GroupMember,
	type ResearchGroup,
} from '../../components/list/list'
import {
	getArticlesByGroupId,
	getGroupById,
	getGroupMembersByGroupId,
} from '../../mocks/profile.mocks'
import styles from './groupPage.module.css'

export const GroupPage: FC = () => {
	const { id: idParam } = useParams()
	const navigate = useNavigate()
	const location = useLocation()
	const passedGroup = (location.state as any)?.group as
		| ResearchGroup
		| undefined

	const id = Number(idParam)
	const group: ResearchGroup | undefined = Number.isFinite(id)
		? getGroupById(id) ?? passedGroup // fallback к переданным данным
		: passedGroup

	const groupIdForLists = group?.id ?? (Number.isFinite(id) ? id : undefined)
	const members: GroupMember[] = groupIdForLists
		? getGroupMembersByGroupId(groupIdForLists)
		: []
	const articles: ArticleRef[] = groupIdForLists
		? getArticlesByGroupId(groupIdForLists)
		: []

	if (!group) {
		return (
			<main className={styles.main}>
				<div className={styles.notFound}>
					Коллектив не найден
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
					<h1 className={styles.title}>{group.name}</h1>
					<button className={styles.backBtn} onClick={() => navigate(-1)}>
						Назад
					</button>
				</div>
				<div className={styles.meta}>
					<div>
						<span className={styles.muted}>Руководитель: </span>
						{group.leaderName || '—'}
					</div>
					<div>
						<span className={styles.muted}>Участников: </span>
						{group.membersCount ?? '—'}
					</div>
				</div>
			</section>

			<List<GroupMember>
				variant='groupMembers'
				title='Участники'
				items={members}
				emptyText='Участников пока нет'
				autoNavigate
			/>

			<List<ArticleRef>
				variant='articles'
				title='Публикации коллектива'
				items={articles}
				emptyText='Публикаций пока нет'
			/>
		</main>
	)
}
