import { useCallback, useEffect, useState } from 'react'
import {
	createDepartment,
	deleteDepartment,
	listAssignableEmployees,
	listDepartments,
	setDepartmentEmployees,
	updateDepartment,
} from '../api/department'
import type {
	Department,
	DepartmentInput,
	EmployeeOption,
} from '../types/department'

interface AdminDepartment extends Department {
	employee_ids?: number[] // local only; mock provides this
}

export interface AdminDepartmentForm extends DepartmentInput {
	id?: number
	employee_ids: number[]
}

interface UseAdminDepartmentsResult {
	departments: AdminDepartment[]
	loading: boolean
	error: string | null
	saving: boolean
	assignable: EmployeeOption[]
	reload: () => Promise<void>
	create: (data: AdminDepartmentForm) => Promise<AdminDepartment>
	update: (id: number, data: AdminDepartmentForm) => Promise<AdminDepartment>
	remove: (id: number) => Promise<void>
	validate: (data: AdminDepartmentForm) => string | null
}

export function useAdminDepartments(): UseAdminDepartmentsResult {
	const [departments, setDepartments] = useState<AdminDepartment[]>([])
	const [assignable, setAssignable] = useState<EmployeeOption[]>([])
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const reload = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const deps = await listDepartments()
			setDepartments(deps)
			const avail = await listAssignableEmployees()
			setAssignable(avail)
		} catch (e: any) {
			setError(e.message || 'Ошибка загрузки')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void reload()
	}, [reload])

	const validate = useCallback((data: AdminDepartmentForm): string | null => {
		if (!data.name.trim()) return 'Название обязательно'
		if (data.head_id && data.deputy_id && data.head_id === data.deputy_id) {
			return 'Руководитель и заместитель не могут совпадать'
		}
		// employees cannot contain head or deputy duplicates
		if (data.head_id && data.employee_ids.includes(data.head_id)) {
			return 'Руководитель не должен быть в списке сотрудников'
		}
		if (data.deputy_id && data.employee_ids.includes(data.deputy_id)) {
			return 'Заместитель не должен быть в списке сотрудников'
		}
		return null
	}, [])

	const create = useCallback(
		async (form: AdminDepartmentForm) => {
			const err = validate(form)
			if (err) throw new Error(err)
			setSaving(true)
			try {
				const payload: DepartmentInput = {
					name: form.name,
					short_name: form.short_name,
					code: form.code,
					description: form.description,
					head_id: form.head_id,
					deputy_id: form.deputy_id,
				}
				const dept = await createDepartment(payload)
				// set employees if any (mock only)
				if (form.employee_ids.length) {
					await setDepartmentEmployees(dept.id, form.employee_ids)
				}
				// optimistic local state update (no detail fetch now)
				setDepartments(prev => [
					...prev,
					{ ...dept, employee_ids: form.employee_ids },
				])
				// refresh assignable (some employees got occupied)
				const avail = await listAssignableEmployees()
				setAssignable(avail)
				return dept
			} finally {
				setSaving(false)
			}
		},
		[validate]
	)

	const update = useCallback(
		async (id: number, form: AdminDepartmentForm) => {
			const err = validate(form)
			if (err) throw new Error(err)
			setSaving(true)
			try {
				const payload: Partial<DepartmentInput> = {
					name: form.name,
					short_name: form.short_name,
					code: form.code,
					description: form.description,
					head_id: form.head_id,
					deputy_id: form.deputy_id,
				}
				const updated = await updateDepartment(id, payload)
				await setDepartmentEmployees(id, form.employee_ids)
				setDepartments(prev =>
					prev.map(d =>
						d.id === id ? { ...updated, employee_ids: form.employee_ids } : d
					)
				)
				const avail = await listAssignableEmployees()
				setAssignable(avail)
				return updated
			} finally {
				setSaving(false)
			}
		},
		[validate]
	)

	const remove = useCallback(async (id: number) => {
		setSaving(true)
		try {
			await deleteDepartment(id)
			setDepartments(prev => prev.filter(d => d.id !== id))
			const avail = await listAssignableEmployees()
			setAssignable(avail)
		} finally {
			setSaving(false)
		}
	}, [])

	return {
		departments,
		loading,
		error,
		saving,
		assignable,
		reload,
		create,
		update,
		remove,
		validate,
	}
}
