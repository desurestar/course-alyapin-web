import React, { useMemo, useState } from 'react'
import { useDepartments } from '../../hooks/useDepartments'
import type { DepartmentInput } from '../../types/department'
import styles from './adminDepartmentPage.module.css'

interface EditingState {
	id?: number
	name: string
	short_name?: string
	code?: string
	description?: string
	head_id?: number | null
}

const emptyForm: EditingState = {
	name: '',
	short_name: '',
	code: '',
	description: '',
	head_id: undefined,
}

export const AdminDepartmentPage: React.FC = () => {
	const { departments, employees, loading, error, create, update, remove } =
		useDepartments()
	const [showModal, setShowModal] = useState(false)
	const [form, setForm] = useState<EditingState>(emptyForm)
	const [saving, setSaving] = useState(false)
	const [filter, setFilter] = useState('')
	const [localError, setLocalError] = useState<string | null>(null)

	const filtered = useMemo(() => {
		const f = filter.trim().toLowerCase()
		if (!f) return departments
		return departments.filter(d =>
			[d.name, d.short_name, d.code].some(v => v?.toLowerCase().includes(f))
		)
	}, [departments, filter])

	const openCreate = () => {
		setForm(emptyForm)
		setShowModal(true)
		setLocalError(null)
	}
	const openEdit = (id: number) => {
		const d = departments.find(dep => dep.id === id)
		if (!d) return
		setForm({
			id: d.id,
			name: d.name,
			short_name: d.short_name,
			code: d.code,
			description: d.description,
			head_id: d.head_id,
		})
		setShowModal(true)
		setLocalError(null)
	}

	const onDelete = async (id: number) => {
		if (!confirm('Удалить кафедру?')) return
		await remove(id)
	}

	const validate = (f: EditingState): string | null => {
		if (!f.name.trim()) return 'Название обязательно'
		if (f.name.length > 255) return 'Название слишком длинное'
		if (f.short_name && f.short_name.length > 64)
			return 'Короткое название > 64'
		if (f.code && f.code.length > 32) return 'Код > 32'
		return null
	}

	const submit = async (e: React.FormEvent) => {
		e.preventDefault()
		const v = validate(form)
		if (v) {
			setLocalError(v)
			return
		}
		setSaving(true)
		try {
			const payload: DepartmentInput = {
				name: form.name.trim(),
				short_name: form.short_name?.trim() || undefined,
				code: form.code?.trim() || undefined,
				description: form.description?.trim() || undefined,
				head_id: form.head_id ?? undefined,
			}
			if (form.id) await update(form.id, payload)
			else await create(payload)
			setShowModal(false)
		} catch (e: any) {
			setLocalError(e.message || 'Ошибка сохранения')
		} finally {
			setSaving(false)
		}
	}

	return (
		<main className={styles.page}>
			<div className={styles.headerRow}>
				<h1 className={styles.title}>Кафедры</h1>
				<div className={styles.actions}>
					<input
						className={styles.search}
						placeholder='Поиск...'
						value={filter}
						onChange={e => setFilter(e.target.value)}
					/>
					<button
						className={styles.primaryBtn}
						onClick={openCreate}
						disabled={loading}
					>
						Добавить
					</button>
				</div>
			</div>
			{loading && <div className={styles.info}>Загрузка...</div>}
			{error && <div className={styles.error}>{error}</div>}
			<table className={styles.table}>
				<thead>
					<tr>
						<th>ID</th>
						<th>Название</th>
						<th>Коротко</th>
						<th>Код</th>
						<th>Руководитель</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{filtered.map(d => {
						const head =
							employees.find(e => e.id === d.head_id)?.full_name || '—'
						return (
							<tr key={d.id}>
								<td>{d.id}</td>
								<td>{d.name}</td>
								<td>{d.short_name || '—'}</td>
								<td>{d.code || '—'}</td>
								<td>{head}</td>
								<td className={styles.rowActions}>
									<button
										onClick={() => openEdit(d.id)}
										className={styles.smallBtn}
									>
										Изм.
									</button>
									<button
										onClick={() => onDelete(d.id)}
										className={styles.smallBtnDanger}
									>
										Удал.
									</button>
								</td>
							</tr>
						)
					})}
					{!loading && filtered.length === 0 && (
						<tr>
							<td colSpan={6} className={styles.empty}>
								Нет данных
							</td>
						</tr>
					)}
				</tbody>
			</table>

			{showModal && (
				<div
					className={styles.modalOverlay}
					onMouseDown={() => {
						setShowModal(false)
					}}
				>
					<div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
						<h2 className={styles.modalTitle}>
							{form.id ? 'Редактирование' : 'Новая кафедра'}
						</h2>
						<form onSubmit={submit} className={styles.form}>
							<label className={styles.label}>
								Название*
								<input
									value={form.name}
									onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
								/>
							</label>
							<label className={styles.label}>
								Короткое
								<input
									value={form.short_name}
									onChange={e =>
										setForm(f => ({ ...f, short_name: e.target.value }))
									}
								/>
							</label>
							<label className={styles.label}>
								Код
								<input
									value={form.code}
									onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
								/>
							</label>
							<label className={styles.label}>
								Описание
								<textarea
									value={form.description}
									onChange={e =>
										setForm(f => ({ ...f, description: e.target.value }))
									}
								/>
							</label>
							<label className={styles.label}>
								Руководитель
								<select
									value={form.head_id ?? ''}
									onChange={e =>
										setForm(f => ({
											...f,
											head_id: e.target.value
												? Number(e.target.value)
												: undefined,
										}))
									}
								>
									<option value=''>— Не выбран —</option>
									{employees.map(emp => (
										<option key={emp.id} value={emp.id}>
											{emp.full_name}
										</option>
									))}
								</select>
							</label>
							{localError && <div className={styles.error}>{localError}</div>}
							<div className={styles.modalActions}>
								<button
									type='button'
									className={styles.secondaryBtn}
									onClick={() => setShowModal(false)}
								>
									Отмена
								</button>
								<button
									type='submit'
									className={styles.primaryBtn}
									disabled={saving}
								>
									{saving ? 'Сохранение...' : 'Сохранить'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</main>
	)
}
export default AdminDepartmentPage
