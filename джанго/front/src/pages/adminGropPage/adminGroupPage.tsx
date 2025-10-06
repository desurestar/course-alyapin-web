import React, { useState } from 'react'
import { useAdminGroups } from '../../hooks/useAdminGroups'
import styles from './adminGroupPage.module.css'

export const AdminGroupPage: React.FC = () => {
	const { groups, loading, error, update, remove, select, selected, saving } =
		useAdminGroups()
	const [editName, setEditName] = useState('')
	const [editDesc, setEditDesc] = useState('')

	const openEdit = (id: number) => {
		select(id)
		const g = groups.find(g => g.id === id)
		setEditName(g?.name || '')
		setEditDesc(g?.description || '')
	}

	const submitEdit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!selected) return
		await update(selected.id, { name: editName, description: editDesc })
	}

	return (
		<main className={styles.page}>
			<h1 className={styles.title}>Управление научными коллективами</h1>
			{error && <div className={styles.error}>{error}</div>}
			{loading ? (
				<p>Загрузка...</p>
			) : (
				<table className={styles.table}>
					<thead>
						<tr>
							<th>ID</th>
							<th>Название</th>
							<th>Описание</th>
							<th>Участников</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{groups.map(g => (
							<tr key={g.id} className={styles.row}>
								<td className={styles.idCell}>{g.id}</td>
								<td>{g.name}</td>
								<td className={styles.descCell}>{g.description || '—'}</td>
								<td className={styles.countCell}>{g.members_count ?? '—'}</td>
								<td className={styles.actionsCell}>
									<button
										onClick={() => openEdit(g.id)}
										className={styles.btnSm}
									>
										Изм.
									</button>
									<button
										onClick={() => remove(g.id)}
										className={`${styles.btnSm} ${styles.btnDanger}`}
									>
										Удалить
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
			{selected && (
				<form onSubmit={submitEdit} className={styles.form}>
					<h2 className={styles.formTitle}>Редактирование: {selected.name}</h2>
					<label className={styles.label}>
						<span>Название</span>
						<input
							value={editName}
							onChange={e => setEditName(e.target.value)}
							className={styles.input}
						/>
					</label>
					<label className={styles.label}>
						<span>Описание</span>
						<textarea
							value={editDesc}
							onChange={e => setEditDesc(e.target.value)}
							className={`${styles.input} ${styles.textarea}`}
						/>
					</label>
					<div className={styles.buttons}>
						<button
							type='submit'
							disabled={saving}
							className={styles.btnPrimary}
						>
							{saving ? 'Сохранение...' : 'Сохранить'}
						</button>
						<button
							type='button'
							className={styles.btnGhost}
							onClick={() => select(-1)}
						>
							Отмена
						</button>
					</div>
				</form>
			)}
		</main>
	)
}

export default AdminGroupPage
