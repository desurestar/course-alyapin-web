import { useCallback, useEffect, useState } from 'react'
import { listDepartments } from '../api/department'
import type { Department } from '../types/department'

// Public read-only list hook (no auth-specific editing logic)
// To switch to real backend replace listDepartments() implementation.
export function useDepartmentList() {
	const [data, setData] = useState<Department[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const load = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const res = await listDepartments()
			setData(res)
		} catch (e: any) {
			setError(e.message || 'Ошибка загрузки')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void load()
	}, [load])

	return { departments: data, loading, error, reload: load }
}
