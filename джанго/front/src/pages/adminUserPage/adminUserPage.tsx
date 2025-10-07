import React, { useEffect, useMemo, useState } from 'react'
import {
	createAdminUser,
	deleteAdminUser,
	listAdminUsers,
	updateAdminUser,
	type AdminUser,
	type NewAdminUserInput,
	type UpdateAdminUserInput,
} from '../../api/adminUsers'
import styles from './adminUserPage.module.css'

interface EditState {
	mode: 'create' | 'edit'
	loading: boolean
	data: Partial<AdminUser & { password?: string }>
}

const emptyNew: Partial<AdminUser & { password?: string }> = {
	first_name: '',
	last_name: '',
	email: '',
	phone: '',
	is_superuser: false,
	is_staff: true,
}

export const AdminUserPage: React.FC = () => {
	const [items, setItems] = useState<AdminUser[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [search, setSearch] = useState('')
	const [selectedId, setSelectedId] = useState<number | null>(null)
	const [edit, setEdit] = useState<EditState | null>(null)

	async function reload() {
		setLoading(true)
		setError(null)
		try {
			const res = await listAdminUsers({ search })
			setItems(res.results)
		} catch (e: any) {
			setError(e.message || 'Ошибка загрузки')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		const t = setTimeout(() => reload(), 200)
		return () => clearTimeout(t)
	}, [search])

	const selected = useMemo(
		() => items.find(u => u.id === selectedId) || null,
		[items, selectedId]
	)

	function openCreate() {
		setEdit({ mode: 'create', loading: false, data: { ...emptyNew } })
	}
	function openEdit(u: AdminUser) {
		setEdit({ mode: 'edit', loading: false, data: { ...u } })
	}

	async function submit() {
		if (!edit) return
		const d = edit.data
		if (!d.first_name?.trim() || !d.last_name?.trim())
			return alert('Имя и фамилия обязательны')
		if (edit.mode === 'create') {
			if (!d.email?.trim()) return alert('Email обязателен')
			if (!d.password?.trim()) return alert('Пароль обязателен')
		}
		setEdit(s => s && { ...s, loading: true })
		try {
			if (edit.mode === 'create') {
				const payload: NewAdminUserInput = {
					first_name: d.first_name!.trim(),
					last_name: d.last_name!.trim(),
					email: d.email!.trim(),
					phone: d.phone?.trim() || undefined,
					password: d.password!,
					is_superuser: !!d.is_superuser,
					is_staff: d.is_staff ?? true,
				}
				const created = await createAdminUser(payload)
				setItems(prev => [created, ...prev])
			} else if (edit.mode === 'edit' && d.id) {
				const patch: UpdateAdminUserInput = {
					first_name: d.first_name?.trim(),
					last_name: d.last_name?.trim(),
					email: d.email?.trim(),
					phone: d.phone?.trim(),
					is_superuser: d.is_superuser,
					is_staff: d.is_staff,
				}
				if (d.password?.trim()) patch.password = d.password.trim()
				const updated = await updateAdminUser(d.id, patch)
				setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)))
			}
			setEdit(null)
		} catch (e: any) {
			alert(e.message || 'Ошибка сохранения')
		} finally {
			setEdit(s => s && { ...s, loading: false })
		}
	}

	async function handleDelete(id: number) {
		if (!window.confirm('Удалить пользователя?')) return
		try {
			await deleteAdminUser(id)
			setItems(prev => prev.filter(u => u.id !== id))
			if (selectedId === id) setSelectedId(null)
		} catch (e: any) {
			alert(e.message || 'Ошибка удаления')
		}
	}

	return (
		<main className={styles.root}>
			<section className={styles.listPane}>
				<header className={styles.header}>
					<h1 className={styles.title}>Пользователи</h1>
					<button className={styles.btn} onClick={openCreate}>
						+ Новый
					</button>
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
							<th>Имя</th>
							<th>Email</th>
							<th>Роль</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{items.map(u => (
							<tr
								key={u.id}
								className={u.id === selectedId ? styles.rowSelected : undefined}
							>
								<td>{u.id}</td>
								<td>
									<button
										className={styles.linkBtn}
										onClick={() => setSelectedId(u.id)}
									>
										{u.first_name} {u.last_name}
									</button>
								</td>
								<td style={{ fontSize: 12 }}>{u.email}</td>
								<td style={{ fontSize: 12 }}>
									{u.is_superuser
										? 'Суперпользователь'
										: u.is_staff
										? 'Персонал'
										: 'Пользователь'}
								</td>
								<td className={styles.actions}>
									<button
										className={`${styles.btn} ${styles.btnSmall}`}
										onClick={() => openEdit(u)}
									>
										Изм.
									</button>{' '}
									<button
										className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
										onClick={() => handleDelete(u.id)}
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
							<strong>Имя:</strong> {selected.first_name} {selected.last_name}
						</p>
						<p>
							<strong>Email:</strong> {selected.email || '—'}
						</p>
						<p className={styles.muted}>
							{selected.is_superuser
								? 'Суперпользователь'
								: selected.is_staff
								? 'Персонал'
								: 'Обычный пользователь'}
						</p>
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
								? 'Новый пользователь'
								: `Редактирование #${edit.data.id}`}
						</h2>
						<div className={styles.inline}>
							<label className={styles.field}>
								<span>Имя *</span>
								<input
									type='text'
									value={edit.data.first_name || ''}
									onChange={e =>
										setEdit(
											s =>
												s && {
													...s,
													data: { ...s.data, first_name: e.target.value },
												}
										)
									}
									required
								/>
							</label>
							<label className={styles.field}>
								<span>Фамилия *</span>
								<input
									type='text'
									value={edit.data.last_name || ''}
									onChange={e =>
										setEdit(
											s =>
												s && {
													...s,
													data: { ...s.data, last_name: e.target.value },
												}
										)
									}
									required
								/>
							</label>
						</div>
						<label className={styles.field}>
							<span>Email *</span>
							<input
								type='email'
								value={edit.data.email || ''}
								onChange={e =>
									setEdit(
										s =>
											s && { ...s, data: { ...s.data, email: e.target.value } }
									)
								}
								required={edit.mode === 'create'}
							/>
						</label>
						<label className={styles.field}>
							<span>Телефон</span>
							<input
								type='tel'
								value={edit.data.phone || ''}
								onChange={e =>
									setEdit(
										s =>
											s && { ...s, data: { ...s.data, phone: e.target.value } }
									)
								}
							/>
						</label>
						{edit.mode === 'create' && (
							<label className={styles.field}>
								<span>Пароль *</span>
								<input
									type='password'
									value={edit.data.password || ''}
									onChange={e =>
										setEdit(
											s =>
												s && {
													...s,
													data: { ...s.data, password: e.target.value },
												}
										)
									}
									required
								/>
							</label>
						)}
						{edit.mode === 'edit' && (
							<label className={styles.field}>
								<span>Новый пароль</span>
								<input
									type='password'
									value={edit.data.password || ''}
									onChange={e =>
										setEdit(
											s =>
												s && {
													...s,
													data: { ...s.data, password: e.target.value },
												}
										)
									}
									placeholder='(не менять)'
								/>
							</label>
						)}
						<div className={styles.switchRow}>
							<label className={styles.switchItem}>
								<input
									type='checkbox'
									checked={!!edit.data.is_superuser}
									onChange={e =>
										setEdit(
											s =>
												s && {
													...s,
													data: { ...s.data, is_superuser: e.target.checked },
												}
										)
									}
								/>{' '}
								<span>Superuser</span>
							</label>
							<label className={styles.switchItem}>
								<input
									type='checkbox'
									checked={!!edit.data.is_staff}
									onChange={e =>
										setEdit(
											s =>
												s && {
													...s,
													data: { ...s.data, is_staff: e.target.checked },
												}
										)
									}
								/>{' '}
								<span>Staff</span>
							</label>
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
								onClick={() => setEdit(null)}
								disabled={edit.loading}
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
export default AdminUserPage
