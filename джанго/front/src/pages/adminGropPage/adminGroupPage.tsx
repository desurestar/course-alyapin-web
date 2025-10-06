import React, { useState } from 'react'
import { useAdminGroups } from '../../hooks/useAdminGroups'

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
		<main style={{ padding: 32 }}>
			<h1>Управление научными коллективами</h1>
			{error && (
				<div style={{ color: 'salmon', marginBottom: 12 }}>{error}</div>
			)}
			{loading ? (
				<p>Загрузка...</p>
			) : (
				<table
					style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}
				>
					<thead>
						<tr style={{ textAlign: 'left' }}>
							<th
								style={{
									padding: '6px 4px',
									borderBottom: '1px solid #334155',
								}}
							>
								ID
							</th>
							<th
								style={{
									padding: '6px 4px',
									borderBottom: '1px solid #334155',
								}}
							>
								Название
							</th>
							<th
								style={{
									padding: '6px 4px',
									borderBottom: '1px solid #334155',
								}}
							>
								Описание
							</th>
							<th
								style={{
									padding: '6px 4px',
									borderBottom: '1px solid #334155',
								}}
							>
								Участников
							</th>
							<th
								style={{
									padding: '6px 4px',
									borderBottom: '1px solid #334155',
								}}
							/>
						</tr>
					</thead>
					<tbody>
						{groups.map(g => (
							<tr key={g.id} style={{ borderBottom: '1px solid #1e293b' }}>
								<td style={{ padding: '6px 4px', fontSize: 12, opacity: 0.7 }}>
									{g.id}
								</td>
								<td style={{ padding: '6px 4px' }}>{g.name}</td>
								<td style={{ padding: '6px 4px', maxWidth: 360 }}>
									{g.description || '—'}
								</td>
								<td style={{ padding: '6px 4px', textAlign: 'center' }}>
									{g.members_count ?? '—'}
								</td>
								<td style={{ padding: '6px 4px', display: 'flex', gap: 8 }}>
									<button onClick={() => openEdit(g.id)} style={btnSm}>
										Изм.
									</button>
									<button
										onClick={() => remove(g.id)}
										style={{ ...btnSm, background: '#7f1d1d' }}
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
				<form
					onSubmit={submitEdit}
					style={{ marginTop: 24, maxWidth: 520, display: 'grid', gap: 12 }}
				>
					<h2 style={{ margin: 0 }}>Редактирование: {selected.name}</h2>
					<label style={labelStyle}>
						<span>Название</span>
						<input
							value={editName}
							onChange={e => setEditName(e.target.value)}
							style={inputStyle}
						/>
					</label>
					<label style={labelStyle}>
						<span>Описание</span>
						<textarea
							value={editDesc}
							onChange={e => setEditDesc(e.target.value)}
							style={{ ...inputStyle, minHeight: 90 }}
						/>
					</label>
					<div style={{ display: 'flex', gap: 12 }}>
						<button type='submit' disabled={saving} style={btnPrimary}>
							{saving ? 'Сохранение...' : 'Сохранить'}
						</button>
						<button type='button' style={btnGhost} onClick={() => select(-1)}>
							Отмена
						</button>
					</div>
				</form>
			)}
		</main>
	)
}

const btnSm: React.CSSProperties = {
	background: '#1e3a8a',
	color: '#e2e8f0',
	border: '1px solid #334155',
	padding: '4px 10px',
	fontSize: 12,
	borderRadius: 6,
	cursor: 'pointer',
}
const btnPrimary: React.CSSProperties = {
	...btnSm,
	fontSize: 14,
	padding: '8px 16px',
	background: '#075985',
}
const btnGhost: React.CSSProperties = { ...btnSm, background: 'transparent' }
const inputStyle: React.CSSProperties = {
	width: '100%',
	background: 'rgba(148,163,184,0.06)',
	border: '1px solid #334155',
	borderRadius: 8,
	padding: '8px 10px',
	color: '#e2e8f0',
	fontSize: 14,
	outline: 'none',
}
const labelStyle: React.CSSProperties = {
	display: 'grid',
	gap: 4,
	fontSize: 13,
}

export default AdminGroupPage
