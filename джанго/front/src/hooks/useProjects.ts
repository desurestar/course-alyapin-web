import { useCallback, useEffect, useState } from 'react'
import { listProjects } from '../api/projects'
import type { ProjectSummary } from '../types/project'

// Hook to load projects list; prepared for future filters & pagination.
// Backend mapping: see api/projects.ts
export function useProjects(initialFilter?: {
	status?: string
	search?: string
	group_id?: number
}) {
	const [projects, setProjects] = useState<ProjectSummary[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [filter, setFilter] = useState(initialFilter || {})

	const load = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const data = await listProjects(filter)
			setProjects(data)
		} catch (e: any) {
			setError(e.message || 'Ошибка загрузки проектов')
		} finally {
			setLoading(false)
		}
	}, [filter])

	useEffect(() => {
		load()
	}, [load])

	return { projects, loading, error, reload: load, filter, setFilter }
}
