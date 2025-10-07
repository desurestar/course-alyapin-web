import React, { useEffect, useMemo, useState } from 'react'
import {
	deleteArticleApi,
	listArticles,
	updateArticleApi,
} from '../../api/articles'
import { useAuth } from '../../auth/auth'
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

	async function reload() {
		setLoading(true)
		setError(null)
		try {
			const res = await listArticles({ search })
			setItems(res.results)
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
		setEdit({
			loading: false,
			data: {
				...a,
				co_author_ids: a.authors
					.filter(au => au.id !== currentUserId)
					.map(au => au.id),
			},
		})
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
						className={`${styles.btn} ${styles.grow}`}
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
									{a.authors.map(au => au.full_name).join(', ')}
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
						<label className={styles.field}>
							<span>ID соавторов (через запятую)</span>
							<input
								type='text'
								value={(edit.data.co_author_ids || []).join(',')}
								onChange={e => {
									const raw = e.target.value
									const ids = raw
										.split(',')
										.map(s => parseInt(s.trim(), 10))
										.filter(n => !isNaN(n) && n !== currentUserId)
									setEdit(
										s => s && { ...s, data: { ...s.data, co_author_ids: ids } }
									)
								}}
							/>
						</label>
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
