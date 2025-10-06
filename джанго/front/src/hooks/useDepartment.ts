import { useCallback, useEffect, useState } from 'react'
import { getDepartmentDetail, listDepartmentEmployees } from '../api/department'
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
			// Backend now returns groups inside detail; employees can optionally be refreshed separately
			let employees = detail.employees
			try {
				const fresh = await listDepartmentEmployees(id)
				// If backend returns minimal employees in detail, we override with full list
				if (Array.isArray(fresh)) employees = fresh as any
			} catch {
				// ignore employees refresh failure, keep detail.employees
			}
			setData({ ...detail, employees, groups: detail.groups })
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
