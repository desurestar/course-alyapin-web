import React, { useEffect, useMemo, useState } from 'react'
import {
	createArticleApi,
	deleteArticleApi,
	listArticles,
	updateArticleApi,
} from '../../api/articles'
import { useAuth } from '../../auth/auth'
import type { ProfileArticle } from '../../types/profile'

interface EditState {
	mode: 'create' | 'edit'
	loading: boolean
	data: Partial<ProfileArticle & { co_author_ids?: number[] }>
}

const emptyArticle: EditState['data'] = { title: '', abstract: '' }

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

	function openCreate() {
		setEdit({ mode: 'create', loading: false, data: { ...emptyArticle } })
	}

	function openEdit(a: ProfileArticle) {
		setEdit({
			mode: 'edit',
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
		setEdit(s => (s ? { ...s, loading: true } : s))
		try {
			if (edit.mode === 'create') {
				const created = await createArticleApi(currentUserId, {
					title: edit.data.title!.trim(),
					abstract: edit.data.abstract?.trim(),
					link: edit.data.link?.trim(),
					co_author_ids: edit.data.co_author_ids || [],
				})
				setItems(prev => [created, ...prev])
			} else if (edit.mode === 'edit' && edit.data.id) {
				const updated = await updateArticleApi(edit.data.id, {
					title: edit.data.title?.trim(),
					abstract: edit.data.abstract?.trim(),
					link: edit.data.link?.trim(),
					co_author_ids: edit.data.co_author_ids,
				})
				setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)))
			}
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
		<main style={{ padding: 24, display: 'flex', gap: 24 }}>
			<section style={{ flex: 2 }}>
				<header style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
					<h1 style={{ margin: 0, fontSize: 22 }}>Публикации</h1>
					<button onClick={openCreate}>+ Новая</button>
					<input
						placeholder='Поиск'
						value={search}
						onChange={e => setSearch(e.target.value)}
						style={{ flex: 1 }}
					/>
				</header>
				{loading && <p>Загрузка...</p>}
				{error && <p style={{ color: 'red' }}>{error}</p>}
				<table
					style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}
				>
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
								style={{
									background: a.id === selectedId ? '#f5f5f5' : undefined,
								}}
							>
								<td>{a.id}</td>
								<td>
									<button
										style={{
											all: 'unset',
											cursor: 'pointer',
											color: '#0366d6',
										}}
										onClick={() => setSelectedId(a.id)}
									>
										{a.title}
									</button>
								</td>
								<td style={{ fontSize: 12 }}>
									{a.authors.map(au => au.full_name).join(', ')}
								</td>
								<td style={{ textAlign: 'right' }}>
									<button onClick={() => openEdit(a)}>Изм.</button>{' '}
									<button onClick={() => handleDelete(a.id)}>×</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
			<aside style={{ flex: 1, minWidth: 320 }}>
				{selected && (
					<div
						style={{ border: '1px solid #ddd', padding: 16, borderRadius: 6 }}
					>
						<h2 style={{ marginTop: 0 }}>Детали</h2>
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
					<div style={{ marginTop: 24 }}>
						<h2 style={{ marginTop: 0 }}>
							{edit.mode === 'create'
								? 'Новая публикация'
								: `Редактирование #${edit.data.id}`}
						</h2>
						<label style={{ display: 'block', marginBottom: 8 }}>
							<span>Название *</span>
							<input
								value={edit.data.title || ''}
								onChange={e =>
									setEdit(
										s =>
											s && { ...s, data: { ...s.data, title: e.target.value } }
									)
								}
								style={{ width: '100%' }}
							/>
						</label>
						<label style={{ display: 'block', marginBottom: 8 }}>
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
								style={{ width: '100%', resize: 'vertical' }}
							/>
						</label>
						<label style={{ display: 'block', marginBottom: 8 }}>
							<span>Ссылка</span>
							<input
								value={edit.data.link || ''}
								onChange={e =>
									setEdit(
										s =>
											s && { ...s, data: { ...s.data, link: e.target.value } }
									)
								}
								style={{ width: '100%' }}
							/>
						</label>
						{/* Простой ввод ID соавторов через CSV (UI можно улучшить позже) */}
						<label style={{ display: 'block', marginBottom: 8 }}>
							<span>ID соавторов (через запятую)</span>
							<input
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
								style={{ width: '100%' }}
							/>
						</label>
						<div style={{ display: 'flex', gap: 8 }}>
							<button disabled={edit.loading} onClick={submit}>
								{edit.loading ? 'Сохранение...' : 'Сохранить'}
							</button>
							<button disabled={edit.loading} onClick={() => setEdit(null)}>
								Отмена
							</button>
						</div>
					</div>
				)}
			</aside>
		</main>
	)
}
export default AdminPublicationPage
