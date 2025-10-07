import React, { useEffect, useMemo, useState } from 'react'
import {
	createGrant,
	deleteGrant,
	listGrants,
	updateGrant,
	type GrantDetail,
	type GrantSummary,
	type NewGrantInput,
	type UpdateGrantInput,
} from '../../api/grants'
import { listProjects } from '../../api/projects'
import type { ProjectDetail } from '../../types/project'
import styles from './adminGrantsPage.module.css'

interface EditState {
	mode: 'create' | 'edit'
	loading: boolean
	data: Partial<GrantDetail & { link_project_id?: number | null }>
}

export const AdminGrantsPage: React.FC = () => {
	const [items, setItems] = useState<GrantSummary[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [search, setSearch] = useState('')
	const [selectedId, setSelectedId] = useState<number | null>(null)
	const [edit, setEdit] = useState<EditState | null>(null)
	const [projects, setProjects] = useState<ProjectDetail[]>([])
	const [projError, setProjError] = useState<string | null>(null)

	async function reload() {
		setLoading(true)
		setError(null)
		try {
			const list = await listGrants()
			const filtered = search
				? list.filter(g => g.title.toLowerCase().includes(search.toLowerCase()))
				: list
			setItems(filtered)
		} catch (e: any) {
			setError(e.message || 'Ошибка загрузки')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		const t = setTimeout(() => reload(), 250)
		return () => clearTimeout(t)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search])

	useEffect(() => {
		async function loadProjects() {
			try {
				const list = await listProjects({})
				setProjects(list as any)
			} catch (e: any) {
				setProjError(e.message || 'Не удалось загрузить проекты')
			}
		}
		loadProjects()
	}, [])

	const selected = useMemo(
		() => items.find(g => g.id === selectedId) || null,
		[items, selectedId]
	)

	function openCreate() {
		setEdit({ mode: 'create', loading: false, data: { title: '' } })
	}
	function openEdit(summary: GrantSummary) {
		setEdit({ mode: 'edit', loading: false, data: { ...summary } })
	}

	async function submit() {
		if (!edit) return
		const d = edit.data
		if (!d.title?.trim()) return alert('Название обязательно')
		setEdit(s => (s ? { ...s, loading: true } : s))
		try {
			if (edit.mode === 'create') {
				const payload: NewGrantInput = {
					title: d.title!.trim(),
					code: d.code?.trim() || undefined,
					agency: d.agency?.trim() || undefined,
					start_date: d.start_date || undefined,
					end_date: d.end_date || undefined,
					description: (d as any).description?.trim() || undefined,
				}
				const created = await createGrant(payload, {
					link_project_id: d.link_project_id || undefined,
				})
				setItems(prev => [created, ...prev])
			} else if (edit.mode === 'edit' && d.id) {
				const patch: UpdateGrantInput = {
					title: d.title?.trim(),
					code: d.code?.trim(),
					agency: d.agency?.trim(),
					start_date: d.start_date || undefined,
					end_date: d.end_date || undefined,
					description: (d as any).description?.trim(),
				}
				const updated = await updateGrant(d.id, patch, {
					link_project_id: d.link_project_id || undefined,
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
		if (!window.confirm('Удалить грант?')) return
		try {
			await deleteGrant(id)
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
					<h1 className={styles.title}>Гранты</h1>
					<button className={styles.btn} onClick={openCreate}>
						+ Новый
					</button>
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
							<th>Код</th>
							<th>Агентство</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{items.map(g => (
							<tr
								key={g.id}
								className={g.id === selectedId ? styles.rowSelected : undefined}
							>
								<td>{g.id}</td>
								<td>
									<button
										className={styles.linkBtn}
										onClick={() => setSelectedId(g.id)}
									>
										{g.title}
									</button>
								</td>
								<td style={{ fontSize: 12 }}>{g.code || '—'}</td>
								<td style={{ fontSize: 12 }}>{g.agency || '—'}</td>
								<td className={styles.actions}>
									<button
										className={`${styles.btn} ${styles.btnSmall}`}
										onClick={() => openEdit(g)}
									>
										Изм.
									</button>{' '}
									<button
										className={`${styles.btn} ${styles.btnSmall}`}
										onClick={() => handleDelete(g.id)}
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
						<p>
							<strong>Название:</strong> {selected.title}
						</p>
						{selected.code && (
							<p className={styles.muted}>Код: {selected.code}</p>
						)}
						{selected.agency && (
							<p className={styles.muted}>Агентство: {selected.agency}</p>
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
						<h2>
							{edit.mode === 'create'
								? 'Новый грант'
								: `Редактирование #${edit.data.id}`}
						</h2>
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
						<div className={styles.inline}>
							<label className={styles.field}>
								<span>Код</span>
								<input
									type='text'
									value={edit.data.code || ''}
									onChange={e =>
										setEdit(
											s =>
												s && { ...s, data: { ...s.data, code: e.target.value } }
										)
									}
								/>
							</label>
							<label className={styles.field}>
								<span>Агентство</span>
								<input
									type='text'
									value={edit.data.agency || ''}
									onChange={e =>
										setEdit(
											s =>
												s && {
													...s,
													data: { ...s.data, agency: e.target.value },
												}
										)
									}
								/>
							</label>
						</div>
						<div className={styles.inline}>
							<label className={styles.field}>
								<span>Начало</span>
								<input
									type='date'
									value={edit.data.start_date || ''}
									onChange={e =>
										setEdit(
											s =>
												s && {
													...s,
													data: {
														...s.data,
														start_date: e.target.value || undefined,
													},
												}
										)
									}
								/>
							</label>
							<label className={styles.field}>
								<span>Окончание</span>
								<input
									type='date'
									value={edit.data.end_date || ''}
									onChange={e =>
										setEdit(
											s =>
												s && {
													...s,
													data: {
														...s.data,
														end_date: e.target.value || undefined,
													},
												}
										)
									}
								/>
							</label>
						</div>
						<label className={styles.field}>
							<span>Описание</span>
							<textarea
								value={(edit.data as any).description || ''}
								onChange={e =>
									setEdit(
										s =>
											s && {
												...s,
												data: { ...s.data, description: e.target.value },
											}
									)
								}
								rows={4}
							/>
						</label>
						<label className={styles.field}>
							<span>Связать с проектом</span>
							<select
								value={edit.data.link_project_id ?? ''}
								onChange={e =>
									setEdit(
										s =>
											s && {
												...s,
												data: {
													...s.data,
													link_project_id: e.target.value
														? Number(e.target.value)
														: undefined,
												},
											}
									)
								}
							>
								<option value=''>— не выбрано —</option>
								{projects.map(p => (
									<option key={p.id} value={p.id}>
										{p.title}
									</option>
								))}
							</select>
							{projError && (
								<div
									className={styles.muted}
									style={{ color: 'var(--adm-danger,#d33)' }}
								>
									{projError}
								</div>
							)}
						</label>
						<div className={styles.inline}>
							<button
								className={styles.btn}
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

export default AdminGrantsPage
