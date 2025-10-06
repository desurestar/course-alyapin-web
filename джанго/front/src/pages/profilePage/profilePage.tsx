import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import type { NewArticleInput, NewGroupInput } from '../../types/profile'
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
		candidates,
		refreshCandidates,
	} = useProfile(targetId)

	const [editMode, setEditMode] = useState(false)
	const [articleModal, setArticleModal] = useState(false)
	const [groupModal, setGroupModal] = useState(false)
	const [articleForm, setArticleForm] = useState<NewArticleInput>({
		title: '',
		abstract: '',
		link: '',
		co_author_ids: [],
	})
	const [groupForm, setGroupForm] = useState<NewGroupInput>({
		name: '',
		description: '',
		member_ids: [],
	})
	const [local, setLocal] = useState<{
		position?: string
		phone?: string | null
		bio?: string
		avatar?: string
	}>({})
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const [formError, setFormError] = useState<string | null>(null)
	const [formSuccess, setFormSuccess] = useState<string | null>(null)

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
									{isOwner && !g.is_leader && (
										<button
											className={`${styles.smallBtn} ${styles.danger}`}
											onClick={() => leaveCurrentGroup(g.id)}
										>
											Выйти
										</button>
									)}
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
