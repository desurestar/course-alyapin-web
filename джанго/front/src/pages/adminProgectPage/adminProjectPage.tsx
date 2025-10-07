import React, { useEffect, useMemo, useState } from 'react'
import {
	createProject,
	deleteProject,
	getProject,
	listProjects,
	updateProject,
} from '../../api/projects'
import type {
	NewProjectInput,
	ProjectDetail,
	ProjectStatus,
} from '../../types/project'

import styles from './adminProjectPage.module.css'

interface EditState {
	mode: 'create' | 'edit'
	loading: boolean
	data: Partial<ProjectDetail>
}

const emptyForm: Partial<ProjectDetail> = {
	title: '',
	status: 'planned',
	start_date: '',
}

export const AdminProjectPage: React.FC = () => {
	const [projects, setProjects] = useState<ProjectDetail[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [filter, setFilter] = useState<{
		status?: ProjectStatus
		search?: string
	}>({})
	const [selectedId, setSelectedId] = useState<number | null>(null)
	const [edit, setEdit] = useState<EditState | null>(null)

	async function reload() {
		setLoading(true)
		setError(null)
		try {
			const list = await listProjects({
				status: filter.status,
				search: filter.search,
			})
			// listProjects returns summaries; fetch details lazily when selecting
			setProjects(list as any)
		} catch (e: any) {
			setError(e.message || 'Ошибка загрузки')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		reload()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filter.status, filter.search])

	const selected = useMemo(
		() => projects.find(p => p.id === selectedId) || null,
		[projects, selectedId]
	)

	async function handleSelect(id: number) {
		setSelectedId(id)
		try {
			const detail = await getProject(id)
			setProjects(prev => prev.map(p => (p.id === id ? (detail as any) : p)))
		} catch (e) {
			/* ignore */
		}
	}

	function openCreate() {
		setEdit({ mode: 'create', loading: false, data: { ...emptyForm } })
	}

	function openEdit(p: ProjectDetail) {
		setEdit({ mode: 'edit', loading: false, data: { ...p } })
	}

	async function submitForm() {
		if (!edit) return
		const payload: NewProjectInput = {
			title: edit.data.title?.trim() || '',
			description: edit.data.description,
			status: edit.data.status as ProjectStatus,
			start_date: edit.data.start_date,
			end_date: edit.data.end_date,
			budget: edit.data.budget,
			currency: edit.data.currency,
			tags: edit.data.tags,
			website: edit.data.website,
			grant_id: edit.data.grant_id ?? null,
			group_id: edit.data.group_id ?? null,
		}
		if (!payload.title) return alert('Название обязательно')
		setEdit(s => (s ? { ...s, loading: true } : s))
		try {
			if (edit.mode === 'create') {
				const created = await createProject(payload)
				setProjects(prev => [created as any, ...prev])
			} else if (edit.mode === 'edit' && edit.data.id) {
				const updated = await updateProject(edit.data.id, payload)
				setProjects(prev =>
					prev.map(p => (p.id === updated.id ? (updated as any) : p))
				)
			}
			setEdit(null)
		} catch (e: any) {
			alert(e.message || 'Ошибка сохранения')
		} finally {
			setEdit(s => (s ? { ...s, loading: false } : s))
		}
	}

	async function handleDelete(id: number) {
		if (!window.confirm('Удалить проект?')) return
		try {
			await deleteProject(id)
			setProjects(prev => prev.filter(p => p.id !== id))
			if (selectedId === id) setSelectedId(null)
		} catch (e: any) {
			alert(e.message || 'Ошибка удаления')
		}
	}

	return (
		<main className={styles.root}>
			<section className={styles.listPane}>
				<header className={styles.header}>
					<h1 className={styles.title}>Проекты</h1>
					<button className={styles.btn} onClick={openCreate}>
						+ Новый
					</button>
					<select
						className={styles.btn}
						value={filter.status || ''}
						onChange={e =>
							setFilter(f => ({
								...f,
								status: (e.target.value as ProjectStatus) || undefined,
							}))
						}
					>
						<option value=''>Все статусы</option>
						<option value='planned'>Запланирован</option>
						<option value='in_progress'>В работе</option>
						<option value='completed'>Завершён</option>
						<option value='on_hold'>Заморожен</option>
					</select>
					<input
						className={`${styles.btn} ${styles.grow}`}
						placeholder='Поиск'
						value={filter.search || ''}
						onChange={e =>
							setFilter(f => ({ ...f, search: e.target.value || undefined }))
						}
					/>
					{(filter.status || filter.search) && (
						<button
							className={`${styles.btn} ${styles.btnSmall}`}
							onClick={() => setFilter({})}
						>
							Сброс
						</button>
					)}
				</header>
				{loading && <p>Загрузка...</p>}
				{error && <p style={{ color: 'red' }}>{error}</p>}
				<table className={styles.table}>
					<thead>
						<tr>
							<th>ID</th>
							<th>Название</th>
							<th>Статус</th>
							<th>Начало</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{projects.map(p => (
							<tr
								key={p.id}
								className={p.id === selectedId ? styles.rowSelected : undefined}
							>
								<td>{p.id}</td>
								<td>
									<button
										className={styles.linkBtn}
										onClick={() => handleSelect(p.id)}
									>
										{p.title}
									</button>
								</td>
								<td>{p.status}</td>
								<td>{p.start_date}</td>
								<td className={styles.actions}>
									<button
										className={`${styles.btn} ${styles.btnSmall}`}
										onClick={() => openEdit(p)}
									>
										Изм.
									</button>{' '}
									<button
										className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
										onClick={() => handleDelete(p.id)}
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
						<p>
							<strong>Статус:</strong> {selected.status}
						</p>
						{selected.description && (
							<p style={{ whiteSpace: 'pre-wrap' }}>{selected.description}</p>
						)}
						{selected.start_date && (
							<p className={styles.muted}>Начало: {selected.start_date}</p>
						)}
						{selected.end_date && (
							<p className={styles.muted}>Окончание: {selected.end_date}</p>
						)}
						{selected.website && (
							<p className={styles.muted}>
								Сайт:{' '}
								<a href={selected.website} target='_blank' rel='noreferrer'>
									{selected.website}
								</a>
							</p>
						)}
						{selected.tags && selected.tags.length > 0 && (
							<p className={styles.muted}>Теги: {selected.tags.join(', ')}</p>
						)}
					</div>
				)}
				{edit && (
					<form
						className={`${styles.card} ${styles.form}`}
						onSubmit={e => {
							e.preventDefault()
							submitForm()
						}}
					>
						<h2>
							{edit.mode === 'create'
								? 'Новый проект'
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
								<span>Статус</span>
								<select
									value={edit.data.status || 'planned'}
									onChange={e =>
										setEdit(
											s =>
												s && {
													...s,
													data: {
														...s.data,
														status: e.target.value as ProjectStatus,
													},
												}
										)
									}
								>
									<option value='planned'>Запланирован</option>
									<option value='in_progress'>В работе</option>
									<option value='completed'>Завершён</option>
									<option value='on_hold'>Заморожен</option>
								</select>
							</label>
							<label className={styles.field}>
								<span>Группа (ID)</span>
								<input
									type='number'
									value={edit.data.group_id ?? ''}
									onChange={e =>
										setEdit(
											s =>
												s && {
													...s,
													data: {
														...s.data,
														group_id: e.target.value
															? Number(e.target.value)
															: null,
													},
												}
										)
									}
									min={1}
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
						<div className={styles.inline}>
							<label className={styles.field}>
								<span>Бюджет</span>
								<input
									type='number'
									value={edit.data.budget ?? ''}
									onChange={e =>
										setEdit(
											s =>
												s && {
													...s,
													data: {
														...s.data,
														budget: e.target.value
															? Number(e.target.value)
															: undefined,
													},
												}
										)
									}
									min={0}
								/>
							</label>
							<label className={styles.field}>
								<span>Валюта</span>
								<select
									value={edit.data.currency || ''}
									onChange={e =>
										setEdit(
											s =>
												s && {
													...s,
													data: { ...s.data, currency: e.target.value as any },
												}
										)
									}
								>
									<option value=''>—</option>
									<option value='RUB'>RUB</option>
									<option value='USD'>USD</option>
									<option value='EUR'>EUR</option>
								</select>
							</label>
						</div>
						<label className={styles.field}>
							<span>Теги (через запятую)</span>
							<input
								type='text'
								value={edit.data.tags?.join(', ') || ''}
								onChange={e =>
									setEdit(
										s =>
											s && {
												...s,
												data: {
													...s.data,
													tags: e.target.value
														? e.target.value
																.split(',')
																.map(t => t.trim())
																.filter(Boolean)
														: undefined,
												},
											}
									)
								}
							/>
							<div className={styles.tagsHelp}>Пример: NLP, Data, ML</div>
						</label>
						<label className={styles.field}>
							<span>Сайт</span>
							<input
								type='text'
								placeholder='https://'
								value={edit.data.website || ''}
								onChange={e =>
									setEdit(
										s =>
											s && {
												...s,
												data: {
													...s.data,
													website: e.target.value || undefined,
												},
											}
									)
								}
							/>
						</label>
						<label className={styles.field}>
							<span>ID гранта</span>
							<input
								type='number'
								value={edit.data.grant_id ?? ''}
								onChange={e =>
									setEdit(
										s =>
											s && {
												...s,
												data: {
													...s.data,
													grant_id: e.target.value
														? Number(e.target.value)
														: null,
												},
											}
									)
								}
								min={1}
							/>
						</label>
						<label className={styles.field}>
							<span>Описание</span>
							<textarea
								value={edit.data.description || ''}
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
export default AdminProjectPage
