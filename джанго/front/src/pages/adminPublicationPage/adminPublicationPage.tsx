import React, { useEffect, useMemo, useState } from 'react'
import {
	deleteArticleApi,
	listArticles,
	updateArticleApi,
} from '../../api/articles'
import { searchUsers } from '../../api/profileHttp'
import { useAuth } from '../../auth/auth'
import type { UserPublic } from '../../types/auth'
import type { ProfileArticle } from '../../types/profile'
import styles from './adminPublicationPage.module.css'

interface EditState {
	loading: boolean
	data: Partial<ProfileArticle & { co_author_ids?: number[] }>
}

export const AdminPublicationPage: React.FC = () => {
	const { user } = useAuth()
	const currentUserId = user?.id || 1
	const [items, setItems] = useState<ProfileArticle[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [selectedId, setSelectedId] = useState<number | null>(null)
	const [search, setSearch] = useState('')
	const [edit, setEdit] = useState<EditState | null>(null)
	const [coAuthorQuery, setCoAuthorQuery] = useState('')
	const [coAuthorCandidates, setCoAuthorCandidates] = useState<UserPublic[]>([])
	const [loadingCandidates, setLoadingCandidates] = useState(false)

	// Load co-author candidates when editing and query changes
	useEffect(() => {
		if (!edit) return
		let aborted = false
		async function run() {
			setLoadingCandidates(true)
			try {
				const list = await searchUsers(coAuthorQuery)
				if (aborted) return
				// Exclude current user always
				setCoAuthorCandidates(list.filter(u => u.id !== currentUserId))
			} catch (e) {
				if (!aborted) setCoAuthorCandidates([])
			} finally {
				if (!aborted) setLoadingCandidates(false)
			}
		}
		const t = setTimeout(run, 200)
		return () => {
			aborted = true
			clearTimeout(t)
		}
	}, [edit, coAuthorQuery, currentUserId])

	async function reload() {
		setLoading(true)
		setError(null)
		try {
			const res = await listArticles({ search })
			// Normalize authors defensively
			const normalized = res.results.map(a => ({
				...a,
				authors: Array.isArray(a.authors)
					? a.authors.filter(Boolean).map(au => ({
							id: au.id,
							full_name: au.full_name || String(au.id),
					  }))
					: [],
			}))
			setItems(normalized)
		} catch (e: any) {
			setError(e.message || 'Ошибка загрузки')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		const id = setTimeout(() => reload(), 250)
		return () => clearTimeout(id)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search])

	const selected = useMemo(
		() => items.find(i => i.id === selectedId) || null,
		[items, selectedId]
	)

	function openEdit(a: ProfileArticle) {
		const safeAuthors = Array.isArray(a.authors) ? a.authors : []
		setEdit({
			loading: false,
			data: {
				...a,
				authors: safeAuthors,
				co_author_ids: safeAuthors
					.filter(au => au.id !== currentUserId)
					.map(au => au.id),
			},
		})
		setCoAuthorQuery('')
	}

	async function submit() {
		if (!edit) return
		if (!edit.data.title?.trim()) return alert('Название обязательно')
		if (!edit.data.id) return
		setEdit(s => (s ? { ...s, loading: true } : s))
		try {
			const updated = await updateArticleApi(edit.data.id, {
				title: edit.data.title?.trim(),
				abstract: edit.data.abstract?.trim(),
				link: edit.data.link?.trim(),
				co_author_ids: edit.data.co_author_ids,
			})
			setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)))
			setEdit(null)
		} catch (e: any) {
			alert(e.message || 'Ошибка сохранения')
		} finally {
			setEdit(s => (s ? { ...s, loading: false } : s))
		}
	}

	async function handleDelete(id: number) {
		if (!window.confirm('Удалить публикацию?')) return
		try {
			await deleteArticleApi(id)
			setItems(prev => prev.filter(i => i.id !== id))
			if (selectedId === id) setSelectedId(null)
		} catch (e: any) {
			alert(e.message || 'Ошибка удаления')
		}
	}

	return (
		<main className={styles.root}>
			<section className={styles.listPane}>
				<header className={styles.header}>
					<h1 className={styles.title}>Публикации</h1>
					<input
						className={`${styles.searchInput} ${styles.grow}`}
						placeholder='Поиск'
						value={search}
						onChange={e => setSearch(e.target.value)}
					/>
				</header>
				{loading && <p>Загрузка...</p>}
				{error && <p style={{ color: 'red' }}>{error}</p>}
				<table className={styles.table}>
					<thead>
						<tr>
							<th>ID</th>
							<th>Название</th>
							<th>Авторы</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{items.map(a => (
							<tr
								key={a.id}
								className={a.id === selectedId ? styles.rowSelected : undefined}
							>
								<td>{a.id}</td>
								<td>
									<button
										className={styles.linkBtn}
										onClick={() => setSelectedId(a.id)}
									>
										{a.title}
									</button>
								</td>
								<td style={{ fontSize: 12 }}>
									{Array.isArray(a.authors)
										? a.authors.map(au => au.full_name).join(', ')
										: '—'}
								</td>
								<td className={styles.actions}>
									<button
										className={`${styles.btn} ${styles.btnSmall}`}
										onClick={() => openEdit(a)}
									>
										Изм.
									</button>{' '}
									<button
										className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
										onClick={() => handleDelete(a.id)}
									>
										×
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
			<aside className={styles.detailPane}>
				{selected && (
					<div className={styles.card}>
						<h2>Детали</h2>
						<p>
							<strong>ID:</strong> {selected.id}
						</p>
						<p style={{ whiteSpace: 'pre-wrap' }}>{selected.abstract || '—'}</p>
						{selected.link && (
							<p>
								<a href={selected.link} target='_blank' rel='noreferrer'>
									Ссылка
								</a>
							</p>
						)}
					</div>
				)}
				{edit && (
					<form
						className={`${styles.card} ${styles.form}`}
						onSubmit={e => {
							e.preventDefault()
							submit()
						}}
					>
						<h2>Редактирование #{edit.data.id}</h2>
						<label className={styles.field}>
							<span>Название *</span>
							<input
								type='text'
								value={edit.data.title || ''}
								onChange={e =>
									setEdit(
										s =>
											s && { ...s, data: { ...s.data, title: e.target.value } }
									)
								}
								required
							/>
						</label>
						<label className={styles.field}>
							<span>Аннотация</span>
							<textarea
								value={edit.data.abstract || ''}
								onChange={e =>
									setEdit(
										s =>
											s && {
												...s,
												data: { ...s.data, abstract: e.target.value },
											}
									)
								}
								rows={4}
							/>
						</label>
						<label className={styles.field}>
							<span>Ссылка</span>
							<input
								type='text'
								value={edit.data.link || ''}
								onChange={e =>
									setEdit(
										s =>
											s && { ...s, data: { ...s.data, link: e.target.value } }
									)
								}
							/>
						</label>
						<div className={styles.field}>
							<span>Соавторы</span>
							<input
								type='text'
								placeholder='Поиск пользователя...'
								value={coAuthorQuery}
								onChange={e => setCoAuthorQuery(e.target.value)}
								style={{ marginBottom: 6 }}
							/>
							<div
								style={{
									maxHeight: 160,
									overflowY: 'auto',
									border: '1px solid var(--adm-input-border, #cbd5e1)',
									borderRadius: 6,
									padding: '6px 8px',
									background: 'var(--adm-input-bg, #fff)',
								}}
							>
								{loadingCandidates && (
									<div style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>
										Загрузка...
									</div>
								)}
								{!loadingCandidates && coAuthorCandidates.length === 0 && (
									<div style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>
										Нет результатов
									</div>
								)}
								<ul
									style={{
										listStyle: 'none',
										margin: 0,
										padding: 0,
										display: 'flex',
										flexDirection: 'column',
										gap: 4,
									}}
								>
									{coAuthorCandidates.map(u => {
										const selectedIds = edit.data.co_author_ids || []
										const checked = selectedIds.includes(u.id)
										return (
											<li
												key={u.id}
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: 6,
													fontSize: 12,
												}}
											>
												<label
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: 6,
														cursor: 'pointer',
													}}
												>
													<input
														type='checkbox'
														checked={checked}
														onChange={() => {
															setEdit(s => {
																if (!s) return s
																const current = s.data.co_author_ids || []
																const next = checked
																	? current.filter(id => id !== u.id)
																	: [...current, u.id]
																return {
																	...s,
																	data: { ...s.data, co_author_ids: next },
																}
															})
														}}
													/>
													<span>
														{u.full_name || `${u.first_name} ${u.last_name}`}
													</span>
												</label>
											</li>
										)
									})}
								</ul>
							</div>
							<div
								style={{
									marginTop: 6,
									fontSize: 11,
									color: 'var(--adm-text-muted)',
								}}
							>
								Выберите соавторов (текущий пользователь добавляется
								автоматически)
							</div>
						</div>
						<div className={styles.inline}>
							<button
								className={`${styles.btn} ${styles.btnPrimary}`}
								type='submit'
								disabled={edit.loading}
							>
								{edit.loading ? 'Сохранение...' : 'Сохранить'}
							</button>
							<button
								className={styles.btn}
								type='button'
								disabled={edit.loading}
								onClick={() => setEdit(null)}
							>
								Отмена
							</button>
						</div>
					</form>
				)}
			</aside>
		</main>
	)
}
export default AdminPublicationPage
