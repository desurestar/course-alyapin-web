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
		<main style={{ padding: 24, display: 'flex', gap: 24 }}>
			<section style={{ flex: 2 }}>
				<header style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
					<h1 style={{ margin: 0, fontSize: 22 }}>Проекты</h1>
					<button onClick={openCreate}>+ Новый</button>
					<select
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
						placeholder='Поиск'
						value={filter.search || ''}
						onChange={e =>
							setFilter(f => ({ ...f, search: e.target.value || undefined }))
						}
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
							<th>Статус</th>
							<th>Начало</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{projects.map(p => (
							<tr
								key={p.id}
								style={{
									background: p.id === selectedId ? '#f5f5f5' : undefined,
								}}
							>
								<td>{p.id}</td>
								<td>
									<button
										style={{
											all: 'unset',
											cursor: 'pointer',
											color: '#0366d6',
										}}
										onClick={() => handleSelect(p.id)}
									>
										{p.title}
									</button>
								</td>
								<td>{p.status}</td>
								<td>{p.start_date}</td>
								<td style={{ textAlign: 'right' }}>
									<button onClick={() => openEdit(p)}>Изм.</button>{' '}
									<button onClick={() => handleDelete(p.id)}>×</button>
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
						<p>
							<strong>Название:</strong> {selected.title}
						</p>
						<p>
							<strong>Статус:</strong> {selected.status}
						</p>
						{selected.description && (
							<p style={{ whiteSpace: 'pre-wrap' }}>{selected.description}</p>
						)}
					</div>
				)}
				{edit && (
					<div style={{ marginTop: 24 }}>
						<h2 style={{ marginTop: 0 }}>
							{edit.mode === 'create'
								? 'Новый проект'
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
								style={{ width: '100%' }}
							>
								<option value='planned'>Запланирован</option>
								<option value='in_progress'>В работе</option>
								<option value='completed'>Завершён</option>
								<option value='on_hold'>Заморожен</option>
							</select>
						</label>
						<label style={{ display: 'block', marginBottom: 8 }}>
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
								style={{ width: '100%', resize: 'vertical' }}
							/>
						</label>
						<div style={{ display: 'flex', gap: 8 }}>
							<button disabled={edit.loading} onClick={submitForm}>
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
export default AdminProjectPage
