import { useCallback, useEffect, useState } from 'react'
import {
	createDepartment,
	deleteDepartment,
	listDepartments,
	listEmployees,
	updateDepartment,
} from '../api/department'
import { getAccessToken } from '../api/http'
import type {
	Department,
	DepartmentInput,
	EmployeeOption,
} from '../types/department'

export function useDepartments() {
	const [departments, setDepartments] = useState<Department[]>([])
	const [employees, setEmployees] = useState<EmployeeOption[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Real backend version example:
	// const token = getAccessToken();
	// await http('departments/', { auth: true })

	const loadAll = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const [deps, emps] = await Promise.all([
				listDepartments(),
				listEmployees(),
			])
			setDepartments(deps)
			setEmployees(emps)
		} catch (e: any) {
			setError(e.message || 'Ошибка загрузки')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void loadAll()
	}, [loadAll])

	const create = useCallback(async (data: DepartmentInput) => {
		// const token = getAccessToken(); // use when calling backend
		const dept = await createDepartment(data)
		setDepartments(prev => [...prev, dept])
		return dept
	}, [])

	const update = useCallback(async (id: number, data: DepartmentInput) => {
		const dept = await updateDepartment(id, data)
		setDepartments(prev => prev.map(d => (d.id === id ? dept : d)))
		return dept
	}, [])

	const remove = useCallback(async (id: number) => {
		await deleteDepartment(id)
		setDepartments(prev => prev.filter(d => d.id !== id))
	}, [])

	return {
		departments,
		employees,
		loading,
		error,
		reload: loadAll,
		create,
		update,
		remove,
	}
}

void getAccessToken // keep for future reference
