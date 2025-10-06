import { useCallback, useEffect, useState } from 'react'
import { getDepartmentDetail } from '../api/department'
import type { DepartmentDetail } from '../types/department'

export function useDepartment(id: number | undefined) {
	const [data, setData] = useState<DepartmentDetail | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const load = useCallback(async () => {
		if (!id) return
		setLoading(true)
		setError(null)
		try {
			const res = await getDepartmentDetail(id)
			setData(res)
		} catch (e: any) {
			setError(e.message || 'Ошибка загрузки')
		} finally {
			setLoading(false)
		}
	}, [id])

	useEffect(() => {
		void load()
	}, [load])

	return { department: data, loading, error, reload: load }
}
