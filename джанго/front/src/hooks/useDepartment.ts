import { useCallback, useEffect, useState } from 'react'
import {
	getDepartmentDetail,
	listDepartmentEmployees,
	listDepartmentGroups,
} from '../api/department'
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
			// Primary detail fetch
			const detail = await getDepartmentDetail(id)
			if (!detail) {
				setData(null)
				return
			}
			// In future backend may split endpoints, prefetch employees & groups if needed
			// Example of parallel refinement (currently redundant because detail already has them)
			const [employees, groups] = await Promise.all([
				listDepartmentEmployees(id),
				listDepartmentGroups(id),
			])
			setData({ ...detail, employees, groups })
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
