import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { List } from '../../components/list/list'
import { useGroup } from '../../hooks/useGroup'
import styles from './groupPage.module.css'

export const GroupPage: FC = () => {
	const { id: idParam } = useParams()
	const navigate = useNavigate()
	const groupId = Number(idParam)
	const {
		group,
		loading,
		error,
		saving,
		updateGroup,
		deleteGroup,
		leaveGroup,
		addMember,
		removeMember,
		createArticle,
		updateArticle,
		createProject,
		updateProject,
	} = useGroup(groupId)

	// UI local state
	const [editModal, setEditModal] = useState(false as boolean)
	const [membersModal, setMembersModal] = useState(false as boolean)
	const [articleModal, setArticleModal] = useState(false as boolean)
	const [articleEdit, setArticleEdit] = useState<any>(null)
	const [projectModal, setProjectModal] = useState(false as boolean)
	const [projectEdit, setProjectEdit] = useState<any>(null)
	const [form, setForm] = useState<{ name: string; description?: string }>({
		name: '',
		description: '',
	})
	const [memberId, setMemberId] = useState('')
	const [articleForm, setArticleForm] = useState<{
		title: string
		abstract?: string
		link?: string
		co_author_ids: number[]
	}>({ title: '', abstract: '', link: '', co_author_ids: [] })
	const [projectForm, setProjectForm] = useState<{
		title: string
		description?: string
		status?: string
	}>({ title: '', description: '', status: 'planned' })
	const [err, setErr] = useState<string | null>(null)

	useEffect(() => {
		if (group && editModal) {
			setForm({ name: group.name, description: group.description })
		}
	}, [group, editModal])

	if (loading) return <main className={styles.main}>Загрузка…</main>
	if (error || !group)
		return (
			<main className={styles.main}>
				{error || 'Не найдено'}{' '}
				<button className={styles.backBtn} onClick={() => navigate(-1)}>
					Назад
				</button>
			</main>
		)

	const isLeader = group.is_leader
	const isMember = group.is_member

	const submitEdit = async () => {
		if (!form.name.trim()) {
			setErr('Название обязательно')
			return
		}
		await updateGroup({ name: form.name, description: form.description })
		setEditModal(false)
	}
	const submitArticle = async () => {
		if (!articleForm.title.trim()) {
			setErr('Название статьи обязательно')
			return
		}
		await createArticle(articleForm)
		setArticleModal(false)
		setArticleForm({ title: '', abstract: '', link: '', co_author_ids: [] })
	}
	const submitArticleEdit = async () => {
		if (!articleEdit) return
		if (!articleEdit.title.trim()) {
			setErr('Название статьи обязательно')
			return
		}
		await updateArticle(articleEdit.id, {
			title: articleEdit.title,
			abstract: articleEdit.abstract,
			link: articleEdit.link,
			co_author_ids: articleEdit.co_author_ids,
		})
		setArticleEdit(null)
	}
	const submitProject = async () => {
		if (!projectForm.title.trim()) {
			setErr('Название проекта обязательно')
			return
		}
		await createProject({
			title: projectForm.title,
			description: projectForm.description,
			status: projectForm.status as any,
		})
		setProjectModal(false)
		setProjectForm({ title: '', description: '', status: 'planned' })
	}
	const submitProjectEdit = async () => {
		if (!projectEdit) return
		if (!projectEdit.title.trim()) {
			setErr('Название проекта обязательно')
			return
		}
		await updateProject(projectEdit.id, {
			title: projectEdit.title,
			description: projectEdit.description,
			status: projectEdit.status,
		})
		setProjectEdit(null)
	}
	const handleAddMember = async () => {
		const id = Number(memberId)
		if (!id) return
		await addMember(id)
		setMemberId('')
	}
	const handleRemoveMember = async (uid: number) => {
		if (!confirm('Удалить участника?')) return
		await removeMember(uid)
	}
	const handleLeave = async () => {
		if (!confirm('Выйти из коллектива?')) return
		await leaveGroup()
		navigate(-1)
	}
	const handleDeleteGroup = async () => {
		if (!confirm('Удалить коллектив?')) return
		await deleteGroup()
		navigate(-1)
	}
	group.members.map(m => console.log(m))
	return (
		<main className={`${styles.main} ${saving ? styles.saving : ''}`}>
			<section className={styles.headerCard}>
				<div className={styles.headerTop}>
					<h1 className={styles.title}>{group.name}</h1>
					<div style={{ display: 'flex', gap: 8 }}>
						{isLeader && (
							<button
								className={styles.backBtn}
								onClick={() => setEditModal(true)}
							>
								Редактировать
							</button>
						)}
						{isLeader && (
							<button
								className={styles.backBtn}
								onClick={() => setMembersModal(true)}
							>
								Участники
							</button>
						)}
						{isLeader && (
							<button
								className={styles.backBtn}
								onClick={() => setArticleModal(true)}
							>
								Добавить публикацию
							</button>
						)}
						{isLeader && (
							<button
								className={styles.backBtn}
								onClick={() => setProjectModal(true)}
							>
								Добавить проект
							</button>
						)}
						{isMember && !isLeader && (
							<button className={styles.backBtn} onClick={handleLeave}>
								Выйти
							</button>
						)}
						{isLeader && (
							<button className={styles.backBtn} onClick={handleDeleteGroup}>
								Удалить
							</button>
						)}
						<button className={styles.backBtn} onClick={() => navigate(-1)}>
							Назад
						</button>
					</div>
				</div>
				<div className={styles.meta}>
					<div>
						<span className={styles.muted}>Руководитель: </span>
						{group.leader_name || '—'}
					</div>
					<div>
						<span className={styles.muted}>Участников: </span>
						{group.members_count}
					</div>
				</div>
			</section>

			<List
				variant='groupMembers'
				title='Участники'
				items={group.members.map(m => ({
					id: m.id,
					fullName: m.full_name,
					role: m.is_leader ? 'Руководитель' : 'Участник',
				}))}
				emptyText='Участников пока нет'
				autoNavigate
			/>

			<List
				variant='articles'
				title='Публикации коллектива'
				items={group.articles.map(a => ({
					id: a.id,
					title: a.title,
					year: 2025,
					authors: a.authors.map(x => x.full_name).join(', '),
				}))}
				emptyText='Публикаций пока нет'
			/>

			<List
				variant='projects'
				title='Проекты'
				items={
					group.projects.map(p => ({
						id: p.id,
						title: p.title,
						status: p.status || 'planned',
						supervisor: { fullName: p.supervisor_name || '' },
						startDate: p.start_date,
						endDate: p.end_date,
					})) as any
				}
				emptyText='Проектов пока нет'
			/>

			{err && <div style={{ color: '#ef4444', marginTop: 12 }}>{err}</div>}

			{/* Edit group modal */}
			{editModal && (
				<div className={styles.modalBackdrop}>
					<div className={styles.modal}>
						<button
							className={styles.closeBtn}
							onClick={() => setEditModal(false)}
						>
							&times;
						</button>
						<h4>Редактирование коллектива</h4>
						<div className={styles.fieldGroup}>
							<label>Название</label>
							<input
								value={form.name}
								onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Описание</label>
							<textarea
								value={form.description || ''}
								onChange={e =>
									setForm(f => ({ ...f, description: e.target.value }))
								}
							/>
						</div>
						<div className={styles.actions}>
							{' '}
							<button
								onClick={submitEdit}
								className={styles.backBtn}
								disabled={saving}
							>
								Сохранить
							</button>{' '}
							<button
								className={styles.backBtn}
								onClick={() => setEditModal(false)}
							>
								Отмена
							</button>
						</div>
					</div>
				</div>
			)}

			{membersModal && (
				<div className={styles.modalBackdrop}>
					<div className={styles.modal}>
						<button
							className={styles.closeBtn}
							onClick={() => setMembersModal(false)}
						>
							&times;
						</button>
						<h4>Участники</h4>
						<ul className={styles.simpleList}>
							{group.members.map(m => (
								<li key={m.id} className={styles.inline}>
									<span>
										{m.full_name}
										{m.is_leader ? ' (рук.)' : ''}
									</span>
									{isLeader && !m.is_leader && (
										<button
											className={styles.smallBtn}
											onClick={() => handleRemoveMember(m.id)}
										>
											Удалить
										</button>
									)}
								</li>
							))}
							{group.members.length === 0 && <li>Нет участников</li>}
						</ul>
						{isLeader && (
							<div className={styles.fieldGroup}>
								<label>Добавить участника (ID)</label>
								<input
									value={memberId}
									onChange={e => setMemberId(e.target.value)}
								/>
								<div className={styles.actions}>
									{' '}
									<button
										className={styles.smallBtn}
										disabled={!memberId}
										onClick={handleAddMember}
									>
										Добавить
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{articleModal && (
				<div className={styles.modalBackdrop}>
					<div className={styles.modal}>
						<button
							className={styles.closeBtn}
							onClick={() => setArticleModal(false)}
						>
							&times;
						</button>
						<h4>Новая публикация</h4>
						<div className={styles.fieldGroup}>
							<label>Название</label>
							<input
								value={articleForm.title}
								onChange={e =>
									setArticleForm(prev => ({ ...prev, title: e.target.value }))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Аннотация</label>
							<textarea
								value={articleForm.abstract || ''}
								onChange={e =>
									setArticleForm(prev => ({
										...prev,
										abstract: e.target.value,
									}))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Ссылка</label>
							<input
								value={articleForm.link || ''}
								onChange={e =>
									setArticleForm(prev => ({ ...prev, link: e.target.value }))
								}
							/>
						</div>
						<div className={styles.actions}>
							<button
								className={styles.backBtn}
								onClick={submitArticle}
								disabled={saving}
							>
								Создать
							</button>
							<button
								className={styles.backBtn}
								onClick={() => setArticleModal(false)}
							>
								Отмена
							</button>
						</div>
					</div>
				</div>
			)}

			{articleEdit && (
				<div className={styles.modalBackdrop}>
					<div className={styles.modal}>
						<button
							className={styles.closeBtn}
							onClick={() => setArticleEdit(null)}
						>
							&times;
						</button>
						<h4>Редактирование публикации</h4>
						<div className={styles.fieldGroup}>
							<label>Название</label>
							<input
								value={articleEdit.title}
								onChange={e =>
									setArticleEdit((v: any) => ({ ...v, title: e.target.value }))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Аннотация</label>
							<textarea
								value={articleEdit.abstract || ''}
								onChange={e =>
									setArticleEdit((v: any) => ({
										...v,
										abstract: e.target.value,
									}))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Ссылка</label>
							<input
								value={articleEdit.link || ''}
								onChange={e =>
									setArticleEdit((v: any) => ({ ...v, link: e.target.value }))
								}
							/>
						</div>
						<div className={styles.actions}>
							<button
								className={styles.backBtn}
								onClick={submitArticleEdit}
								disabled={saving}
							>
								Сохранить
							</button>
							<button
								className={styles.backBtn}
								onClick={() => setArticleEdit(null)}
							>
								Отмена
							</button>
						</div>
					</div>
				</div>
			)}

			{projectModal && (
				<div className={styles.modalBackdrop}>
					<div className={styles.modal}>
						<button
							className={styles.closeBtn}
							onClick={() => setProjectModal(false)}
						>
							&times;
						</button>
						<h4>Новый проект</h4>
						<div className={styles.fieldGroup}>
							<label>Название</label>
							<input
								value={projectForm.title}
								onChange={e =>
									setProjectForm(prev => ({ ...prev, title: e.target.value }))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Описание</label>
							<textarea
								value={projectForm.description || ''}
								onChange={e =>
									setProjectForm(prev => ({
										...prev,
										description: e.target.value,
									}))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Статус</label>
							<select
								value={projectForm.status}
								onChange={e =>
									setProjectForm(prev => ({ ...prev, status: e.target.value }))
								}
							>
								<option value='planned'>Запланирован</option>
								<option value='in_progress'>В работе</option>
								<option value='completed'>Завершён</option>
								<option value='paused'>Пауза</option>
							</select>
						</div>
						<div className={styles.actions}>
							<button
								className={styles.backBtn}
								onClick={submitProject}
								disabled={saving}
							>
								Создать
							</button>
							<button
								className={styles.backBtn}
								onClick={() => setProjectModal(false)}
							>
								Отмена
							</button>
						</div>
					</div>
				</div>
			)}

			{projectEdit && (
				<div className={styles.modalBackdrop}>
					<div className={styles.modal}>
						<button
							className={styles.closeBtn}
							onClick={() => setProjectEdit(null)}
						>
							&times;
						</button>
						<h4>Редактирование проекта</h4>
						<div className={styles.fieldGroup}>
							<label>Название</label>
							<input
								value={projectEdit.title}
								onChange={e =>
									setProjectEdit((v: any) => ({ ...v, title: e.target.value }))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Описание</label>
							<textarea
								value={projectEdit.description || ''}
								onChange={e =>
									setProjectEdit((v: any) => ({
										...v,
										description: e.target.value,
									}))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Статус</label>
							<select
								value={projectEdit.status || 'planned'}
								onChange={e =>
									setProjectEdit((v: any) => ({ ...v, status: e.target.value }))
								}
							>
								<option value='planned'>Запланирован</option>
								<option value='in_progress'>В работе</option>
								<option value='completed'>Завершён</option>
								<option value='paused'>Пауза</option>
							</select>
						</div>
						<div className={styles.actions}>
							<button
								className={styles.backBtn}
								onClick={submitProjectEdit}
								disabled={saving}
							>
								Сохранить
							</button>
							<button
								className={styles.backBtn}
								onClick={() => setProjectEdit(null)}
							>
								Отмена
							</button>
						</div>
					</div>
				</div>
			)}
		</main>
	)
}
