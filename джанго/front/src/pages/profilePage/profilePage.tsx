import type { ChangeEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import type {
	NewArticleInput,
	NewGroupInput,
	ProfileGroup,
} from '../../types/profile'
import styles from './profilePage.module.css'

export const ProfilePage = () => {
	const params = useParams()
	const navigate = useNavigate()
	const targetId = Number(params.id || 1)
	const {
		profile,
		loading,
		error,
		saving,
		saveProfile,
		addArticle,
		createNewGroup,
		leaveCurrentGroup,
		modifyGroup,
		removeGroup,
		candidates,
		refreshCandidates,
		editArticle,
		removeArticle,
		addMember,
		removeMember,
	} = useProfile(targetId)

	const [editMode, setEditMode] = useState(false)
	const [articleModal, setArticleModal] = useState(false)
	const [articleEditModal, setArticleEditModal] = useState(false)
	const [groupModal, setGroupModal] = useState(false)
	const [groupEditModal, setGroupEditModal] = useState(false)
	const [groupMembersModal, setGroupMembersModal] = useState(false)
	const [groupMembersTarget, setGroupMembersTarget] =
		useState<ProfileGroup | null>(null)
	const [articleForm, setArticleForm] = useState<NewArticleInput>({
		title: '',
		abstract: '',
		link: '',
		co_author_ids: [],
	})
	const [articleEdit, setArticleEdit] = useState<{
		id: number
		title: string
		abstract?: string
		link?: string
		co_author_ids: number[]
	} | null>(null)
	const [groupForm, setGroupForm] = useState<NewGroupInput>({
		name: '',
		description: '',
		member_ids: [],
	})
	const [groupEdit, setGroupEdit] = useState<ProfileGroup | null>(null)
	const [groupEditLeaderId, setGroupEditLeaderId] = useState<number | null>(
		null
	)
	const [local, setLocal] = useState<{
		position?: string
		phone?: string | null
		bio?: string
		avatar?: string
	}>({})
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const [formError, setFormError] = useState<string | null>(null)
	const [formSuccess, setFormSuccess] = useState<string | null>(null)
	const [newMemberId, setNewMemberId] = useState('')

	const isOwner = profile?.can_edit

	const startEdit = () => {
		if (profile) {
			setLocal({
				position: profile.position,
				phone: profile.phone ?? '',
				bio: profile.bio,
				avatar: profile.avatar,
			})
			setEditMode(true)
		}
	}
	const cancelEdit = () => {
		setEditMode(false)
		setFormError(null)
	}
	const submitEdit = async () => {
		try {
			setFormError(null)
			await saveProfile({ ...local })
			setFormSuccess('Сохранено')
			setTimeout(() => setFormSuccess(null), 1500)
			setEditMode(false)
		} catch (e: any) {
			setFormError(e.message || 'Ошибка')
		}
	}

	function onAvatarChange(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[1] || e.target.files?.[0]
		if (!file) return
		if (!file.type.startsWith('image/')) {
			setFormError('Можно загружать только изображения')
			return
		}
		const reader = new FileReader()
		reader.onload = () => {
			setLocal(v => ({ ...v, avatar: reader.result as string }))
		}
		reader.readAsDataURL(file)
	}

	const removeAvatar = () => {
		setLocal(v => ({ ...v, avatar: undefined }))
	}

	const openArticleModal = () => {
		setArticleForm({ title: '', abstract: '', link: '', co_author_ids: [] })
		refreshCandidates()
		setArticleModal(true)
	}

	const openArticleEdit = (a: {
		id: number
		title: string
		abstract?: string
		link?: string
		authors: { id: number }[]
	}) => {
		// исключаем текущего пользователя из списка соавторов, он добавляется автоматически на бэке
		const currentId = profile?.id
		setArticleEdit({
			id: a.id,
			title: a.title,
			abstract: a.abstract,
			link: a.link,
			co_author_ids: a.authors.filter(x => x.id !== currentId).map(x => x.id),
		})
		refreshCandidates()
		setArticleEditModal(true)
	}

	const submitArticleEdit = async () => {
		if (!articleEdit) return
		try {
			if (!articleEdit.title.trim()) {
				setFormError('Название статьи обязательно')
				return
			}
			await editArticle(articleEdit.id, {
				title: articleEdit.title,
				abstract: articleEdit.abstract,
				link: articleEdit.link,
				co_author_ids: articleEdit.co_author_ids,
			})
			setArticleEditModal(false)
		} catch (e: any) {
			setFormError(e.message || 'Ошибка обновления статьи')
		}
	}

	const deleteArticleConfirm = async (id: number) => {
		if (!confirm('Удалить публикацию?')) return
		await removeArticle(id)
	}
	const submitArticle = async () => {
		try {
			if (!articleForm.title.trim()) {
				setFormError('Название статьи обязательно')
				return
			}
			await addArticle(articleForm)
			setArticleModal(false)
		} catch (e: any) {
			setFormError(e.message || 'Ошибка статьи')
		}
	}

	const openGroupModal = () => {
		setGroupForm({ name: '', description: '', member_ids: [] })
		refreshCandidates()
		setGroupModal(true)
	}

	const openGroupEditModal = (g: ProfileGroup) => {
		setGroupEdit(g)
		setGroupEditLeaderId(
			g.leader_id ?? (g.members?.find(m => m.is_leader)?.id || null)
		)
		setGroupEditModal(true)
	}

	const openGroupMembersModal = (g: ProfileGroup) => {
		setGroupMembersTarget(g)
		refreshCandidates()
		setGroupMembersModal(true)
	}

	const handleAddMember = async () => {
		if (!groupMembersTarget) return
		const id = Number(newMemberId)
		if (!id) return
		await addMember(groupMembersTarget.id, id)
		setNewMemberId('')
	}

	const handleRemoveMember = async (uid: number) => {
		if (!groupMembersTarget) return
		if (!confirm('Удалить участника из коллектива?')) return
		await removeMember(groupMembersTarget.id, uid)
	}
	const submitGroup = async () => {
		try {
			if (!groupForm.name.trim()) {
				setFormError('Название группы обязательно')
				return
			}
			await createNewGroup(groupForm)
			setGroupModal(false)
		} catch (e: any) {
			setFormError(e.message || 'Ошибка группы')
		}
	}

	const submitGroupEdit = async () => {
		if (!groupEdit) return
		try {
			if (!groupEdit.name.trim()) {
				setFormError('Название обязательно')
				return
			}
			await modifyGroup(groupEdit.id, {
				name: groupEdit.name,
				description: groupEdit.description,
				leader_id: groupEditLeaderId ?? undefined,
			})
			setGroupEditModal(false)
		} catch (e: any) {
			setFormError(e.message || 'Ошибка сохранения группы')
		}
	}

	const deleteGroup = async (id: number) => {
		if (!confirm('Удалить коллектив?')) return
		await removeGroup(id)
	}

	// обновляем выбранную группу / статью при изменении профиля, чтобы модальные окна видели актуальные данные
	useEffect(() => {
		if (groupMembersTarget && profile) {
			const upd = profile.groups.find(g => g.id === groupMembersTarget.id)
			if (upd && upd !== groupMembersTarget) setGroupMembersTarget(upd)
		}
	}, [profile, groupMembersTarget])

	if (loading) return <main className={styles.main}>Загрузка…</main>
	if (error) return <main className={styles.main}>Ошибка: {error}</main>
	if (!profile) return <main className={styles.main}>Не найдено</main>

	return (
		<main className={`${styles.main} ${saving ? styles.saving : ''}`}>
			<div className={styles.profileWrapper}>
				<aside className={styles.sidebar}>
					<div className={styles.header}>
						<h2>
							{profile.full_name ||
								profile.first_name + ' ' + profile.last_name}
						</h2>
						<button className={styles.smallBtn} onClick={() => navigate(-1)}>
							Назад
						</button>
					</div>
					<div className={styles.avatarBlock}>
						<div className={styles.avatarWrapper}>
							{editMode && isOwner && (
								<button
									type='button'
									className={styles.avatarEditBtn}
									onClick={() => fileInputRef.current?.click()}
								>
									Изменить
								</button>
							)}
							{profile.avatar || local.avatar ? (
								<img
									className={styles.avatar}
									src={
										editMode ? local.avatar || profile.avatar : profile.avatar
									}
									alt={profile.full_name || 'avatar'}
								/>
							) : (
								<div className={styles.avatarFallback}>
									{(
										profile.full_name ||
										profile.first_name + ' ' + profile.last_name
									)
										.split(' ')
										.map(p => p[0])
										.slice(0, 2)
										.join('')}
								</div>
							)}
						</div>
						{editMode && isOwner && (
							<div className={styles.avatarActions}>
								<input
									ref={fileInputRef}
									style={{ display: 'none' }}
									accept='image/*'
									type='file'
									onChange={onAvatarChange}
								/>
								<button
									className={styles.smallBtn}
									type='button'
									onClick={() => fileInputRef.current?.click()}
								>
									Загрузить
								</button>
								{(local.avatar || profile.avatar) && (
									<button
										type='button'
										className={`${styles.smallBtn} ${styles.danger}`}
										onClick={removeAvatar}
									>
										Удалить
									</button>
								)}
							</div>
						)}
					</div>
					{!editMode && (
						<div>
							{profile.position && (
								<p>
									<strong>Должность:</strong> {profile.position}
								</p>
							)}
							{profile.email && (
								<p>
									<strong>Email:</strong> {profile.email}
								</p>
							)}
							{profile.phone && (
								<p>
									<strong>Телефон:</strong> {profile.phone}
								</p>
							)}
							{profile.bio && (
								<p>
									<strong>О себе:</strong>
									<br />
									{profile.bio}
								</p>
							)}
							{isOwner && (
								<button className={styles.editBtn} onClick={startEdit}>
									Редактировать
								</button>
							)}
						</div>
					)}
					{editMode && isOwner && (
						<div>
							<div className={styles.fieldGroup}>
								<label>Должность</label>
								<input
									value={local.position || ''}
									onChange={e =>
										setLocal(v => ({ ...v, position: e.target.value }))
									}
								/>
							</div>
							<div className={styles.fieldGroup}>
								<label>Телефон</label>
								<input
									value={local.phone || ''}
									onChange={e =>
										setLocal(v => ({ ...v, phone: e.target.value }))
									}
								/>
							</div>
							<div className={styles.fieldGroup}>
								<label>О себе</label>
								<textarea
									value={local.bio || ''}
									onChange={e => setLocal(v => ({ ...v, bio: e.target.value }))}
								/>
							</div>
							<div className={styles.actions}>
								<button
									className={styles.smallBtn}
									onClick={submitEdit}
									disabled={saving}
								>
									Сохранить
								</button>
								<button className={styles.smallBtn} onClick={cancelEdit}>
									Отмена
								</button>
							</div>
						</div>
					)}
					{formError && <div className={styles.error}>{formError}</div>}
					{formSuccess && <div className={styles.success}>{formSuccess}</div>}
				</aside>

				<section className={styles.main}>
					<div className={styles.section}>
						<h3>
							Публикации ({profile.articles.length}){' '}
							{isOwner && (
								<button className={styles.smallBtn} onClick={openArticleModal}>
									Добавить
								</button>
							)}
						</h3>
						<ul className={styles.articleList}>
							{profile.articles.map(a => (
								<li key={a.id} className={styles.articleItem}>
									<strong>{a.title}</strong>
									{a.authors.length > 0 && (
										<div className={styles.helper}>
											Авторы: {a.authors.map(x => x.full_name).join(', ')}
										</div>
									)}
									{a.link && (
										<a href={a.link} target='_blank' rel='noreferrer'>
											Ссылка
										</a>
									)}
									{a.can_edit && (
										<div className={styles.actions}>
											<button
												className={styles.smallBtn}
												onClick={() => openArticleEdit(a as any)}
											>
												Изм.
											</button>
											<button
												className={`${styles.smallBtn} ${styles.danger}`}
												onClick={() => deleteArticleConfirm(a.id)}
											>
												Удалить
											</button>
										</div>
									)}
								</li>
							))}
							{profile.articles.length === 0 && <li>Нет публикаций</li>}
						</ul>
					</div>
					<div className={styles.section}>
						<h3>
							Научные коллективы ({profile.groups.length}){' '}
							{isOwner && (
								<button className={styles.smallBtn} onClick={openGroupModal}>
									Создать
								</button>
							)}
						</h3>
						<ul className={styles.groupList}>
							{profile.groups.map(g => (
								<li key={g.id} className={styles.groupItem}>
									<div className={styles.inline}>
										<strong>{g.name}</strong>
										{g.role && <span className={styles.badge}>{g.role}</span>}
									</div>
									{g.description && (
										<div className={styles.helper}>{g.description}</div>
									)}
									<div className={styles.helper}>
										Участников: {g.members_count ?? 0}
									</div>
									{g.members && g.members.length > 0 && (
										<div className={styles.helper}>
											Состав:{' '}
											{g.members
												.map(m => m.full_name + (m.is_leader ? ' (рук.)' : ''))
												.join(', ')}
										</div>
									)}
									<div className={styles.actions}>
										{isOwner && g.is_leader && (
											<>
												<button
													className={styles.smallBtn}
													onClick={() => openGroupMembersModal(g)}
												>
													Участники
												</button>
												<button
													className={styles.smallBtn}
													onClick={() => openGroupEditModal(g)}
												>
													Редактировать
												</button>
												<button
													className={`${styles.smallBtn} ${styles.danger}`}
													onClick={() => deleteGroup(g.id)}
												>
													Удалить
												</button>
											</>
										)}
										{isOwner && !g.is_leader && (
											<button
												className={`${styles.smallBtn} ${styles.danger}`}
												onClick={() => leaveCurrentGroup(g.id)}
											>
												Выйти
											</button>
										)}
									</div>
								</li>
							))}
							{profile.groups.length === 0 && <li>Нет участий</li>}
						</ul>
					</div>
				</section>
			</div>

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
									setArticleForm(f => ({ ...f, title: e.target.value }))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Аннотация</label>
							<textarea
								value={articleForm.abstract}
								onChange={e =>
									setArticleForm(f => ({ ...f, abstract: e.target.value }))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Ссылка</label>
							<input
								value={articleForm.link}
								onChange={e =>
									setArticleForm(f => ({ ...f, link: e.target.value }))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Соавторы</label>
							<select
								multiple
								className={styles.selectMulti}
								value={articleForm.co_author_ids.map(String)}
								onChange={e => {
									const opts = Array.from(e.target.selectedOptions).map(o =>
										Number(o.value)
									)
									setArticleForm(f => ({ ...f, co_author_ids: opts }))
								}}
							>
								{candidates.map(c => (
									<option key={c.id} value={c.id}>
										{c.full_name}
									</option>
								))}
							</select>
							<div className={styles.helper}>
								Вы автоматически будете автором
							</div>
						</div>
						<div className={styles.actions}>
							<button
								className={styles.smallBtn}
								onClick={submitArticle}
								disabled={saving}
							>
								Создать
							</button>
							<button
								className={styles.smallBtn}
								onClick={() => setArticleModal(false)}
							>
								Отмена
							</button>
						</div>
					</div>
				</div>
			)}

			{groupModal && (
				<div className={styles.modalBackdrop}>
					<div className={styles.modal}>
						<button
							className={styles.closeBtn}
							onClick={() => setGroupModal(false)}
						>
							&times;
						</button>
						<h4>Новый коллектив</h4>
						<div className={styles.fieldGroup}>
							<label>Название</label>
							<input
								value={groupForm.name}
								onChange={e =>
									setGroupForm(f => ({ ...f, name: e.target.value }))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Описание</label>
							<textarea
								value={groupForm.description}
								onChange={e =>
									setGroupForm(f => ({ ...f, description: e.target.value }))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Участники</label>
							<select
								multiple
								className={styles.selectMulti}
								value={groupForm.member_ids.map(String)}
								onChange={e => {
									const opts = Array.from(e.target.selectedOptions).map(o =>
										Number(o.value)
									)
									setGroupForm(f => ({ ...f, member_ids: opts }))
								}}
							>
								{candidates.map(c => (
									<option key={c.id} value={c.id}>
										{c.full_name}
									</option>
								))}
							</select>
							<div className={styles.helper}>
								Вы автоматически станете руководителем
							</div>
						</div>
						<div className={styles.actions}>
							<button
								className={styles.smallBtn}
								onClick={submitGroup}
								disabled={saving}
							>
								Создать
							</button>
							<button
								className={styles.smallBtn}
								onClick={() => setGroupModal(false)}
							>
								Отмена
							</button>
						</div>
					</div>
				</div>
			)}

			{groupEditModal && groupEdit && (
				<div className={styles.modalBackdrop}>
					<div className={styles.modal}>
						<button
							className={styles.closeBtn}
							onClick={() => setGroupEditModal(false)}
						>
							&times;
						</button>
						<h4>Редактирование коллектива</h4>
						<div className={styles.fieldGroup}>
							<label>Название</label>
							<input
								value={groupEdit.name}
								onChange={e =>
									setGroupEdit(v => (v ? { ...v, name: e.target.value } : v))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Описание</label>
							<textarea
								value={groupEdit.description || ''}
								onChange={e =>
									setGroupEdit(v =>
										v ? { ...v, description: e.target.value } : v
									)
								}
							/>
						</div>
						{groupEdit.members && groupEdit.members.length > 0 && (
							<div className={styles.fieldGroup}>
								<label>Руководитель</label>
								<select
									value={groupEditLeaderId ?? ''}
									onChange={e =>
										setGroupEditLeaderId(
											e.target.value ? Number(e.target.value) : null
										)
									}
								>
									<option value=''>-- не менять --</option>
									{groupEdit.members.map(m => (
										<option key={m.id} value={m.id}>
											{m.full_name}
										</option>
									))}
								</select>
							</div>
						)}
						<div className={styles.actions}>
							<button
								className={styles.smallBtn}
								onClick={submitGroupEdit}
								disabled={saving}
							>
								Сохранить
							</button>
							<button
								className={styles.smallBtn}
								onClick={() => setGroupEditModal(false)}
							>
								Отмена
							</button>
						</div>
					</div>
				</div>
			)}

			{articleEditModal && articleEdit && (
				<div className={styles.modalBackdrop}>
					<div className={styles.modal}>
						<button
							className={styles.closeBtn}
							onClick={() => setArticleEditModal(false)}
						>
							&times;
						</button>
						<h4>Редактирование публикации</h4>
						<div className={styles.fieldGroup}>
							<label>Название</label>
							<input
								value={articleEdit.title}
								onChange={e =>
									setArticleEdit(v => (v ? { ...v, title: e.target.value } : v))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Аннотация</label>
							<textarea
								value={articleEdit.abstract || ''}
								onChange={e =>
									setArticleEdit(v =>
										v ? { ...v, abstract: e.target.value } : v
									)
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Ссылка</label>
							<input
								value={articleEdit.link || ''}
								onChange={e =>
									setArticleEdit(v => (v ? { ...v, link: e.target.value } : v))
								}
							/>
						</div>
						<div className={styles.fieldGroup}>
							<label>Соавторы</label>
							<select
								multiple
								className={styles.selectMulti}
								value={articleEdit.co_author_ids.map(String)}
								onChange={e => {
									const opts = Array.from(e.target.selectedOptions).map(o =>
										Number(o.value)
									)
									setArticleEdit(v => (v ? { ...v, co_author_ids: opts } : v))
								}}
							>
								{candidates.map(c => (
									<option key={c.id} value={c.id}>
										{c.full_name}
									</option>
								))}
							</select>
							<div className={styles.helper}>Вы также будете автором</div>
						</div>
						<div className={styles.actions}>
							<button
								className={styles.smallBtn}
								onClick={submitArticleEdit}
								disabled={saving}
							>
								Сохранить
							</button>
							<button
								className={styles.smallBtn}
								onClick={() => setArticleEditModal(false)}
							>
								Отмена
							</button>
						</div>
					</div>
				</div>
			)}

			{groupMembersModal && groupMembersTarget && (
				<div className={styles.modalBackdrop}>
					<div className={styles.modal}>
						<button
							className={styles.closeBtn}
							onClick={() => setGroupMembersModal(false)}
						>
							&times;
						</button>
						<h4>Участники коллектива: {groupMembersTarget.name}</h4>
						<div className={styles.fieldGroup}>
							{groupMembersTarget.members &&
							groupMembersTarget.members.length > 0 ? (
								<ul className={styles.simpleList}>
									{groupMembersTarget.members.map(m => (
										<li key={m.id} className={styles.inline}>
											<span>
												{m.full_name}
												{m.is_leader ? ' (рук.)' : ''}
											</span>
											{m.is_leader ? null : (
												<button
													className={`${styles.smallBtn} ${styles.danger}`}
													onClick={() => handleRemoveMember(m.id)}
												>
													Удалить
												</button>
											)}
										</li>
									))}
								</ul>
							) : (
								<div className={styles.helper}>Нет участников</div>
							)}
						</div>
						<div className={styles.fieldGroup}>
							<label>Добавить участника</label>
							<select
								value={newMemberId}
								onChange={e => setNewMemberId(e.target.value)}
							>
								<option value=''>-- выбрать --</option>
								{candidates
									.filter(
										c => !groupMembersTarget.members?.some(m => m.id === c.id)
									)
									.map(c => (
										<option key={c.id} value={c.id}>
											{c.full_name}
										</option>
									))}
							</select>
							<div className={styles.actions}>
								<button
									className={styles.smallBtn}
									onClick={handleAddMember}
									disabled={!newMemberId || saving}
								>
									Добавить
								</button>
								<button
									className={styles.smallBtn}
									onClick={() => setGroupMembersModal(false)}
								>
									Закрыть
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</main>
	)
}

// Backend integration notes:
// - Replace useProfile internals to call real endpoints (see api/profile.ts comments)
// - For candidates: implement search input and debounce calling /users/?search=...
// - Add deletion or edit of articles/groups when backend supports ownership & permissions
// - Avatar upload (future): use multipart/form-data PATCH /users/{id}/ (field name 'avatar') OR
//   upload to /files/ -> receive URL -> PATCH /users/{id}/ { avatar: url }.
// - Server should validate content-type (image/*), size, optionally generate thumbnails.
// - Current mock stores data URL (base64). Replace with real URL when backend ready.
