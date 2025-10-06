import { useCallback, useEffect, useState } from 'react'
import { deleteGroupApi, listAllGroups, updateGroupApi } from '../api/groups'
import type { ProfileGroup } from '../types/profile'

interface EditPatch {
	name?: string
	description?: string
	leader_id?: number
}

export function useAdminGroups() {
	const [groups, setGroups] = useState<ProfileGroup[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [selected, setSelected] = useState<ProfileGroup | null>(null)

	const load = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const list = await listAllGroups()
			setGroups(list)
		} catch (e: any) {
			setError(e.message || 'Ошибка загрузки групп')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		load()
	}, [load])

	const select = (id: number) =>
		setSelected(groups.find(g => g.id === id) || null)

	const update = useCallback(
		async (id: number, patch: EditPatch) => {
			setSaving(true)
			const prev = groups
			setGroups(g => g.map(x => (x.id === id ? { ...x, ...patch } : x)))
			try {
				const updated = await updateGroupApi(id, patch)
				setGroups(g => g.map(x => (x.id === id ? { ...x, ...updated } : x)))
			} catch (e) {
				setGroups(prev)
				throw e
			} finally {
				setSaving(false)
			}
		},
		[groups]
	)

	const remove = useCallback(
		async (id: number) => {
			const prev = groups
			setGroups(g => g.filter(x => x.id !== id))
			try {
				await deleteGroupApi(id)
			} catch (e) {
				setGroups(prev)
				throw e
			}
		},
		[groups]
	)

	return {
		groups,
		loading,
		error,
		saving,
		selected,
		select,
		update,
		remove,
		reload: load,
	}
}
