import { useCallback, useEffect, useRef, useState } from 'react'
import { listPublications } from '../api/publications'
import { useAuth } from '../auth/auth'
import type { ProfileArticle } from '../types/profile'

interface UsePublicationsOptions {
	pageSize?: number
	initialSearch?: string
}

export function usePublications(opts: UsePublicationsOptions = {}) {
	const { pageSize = 20, initialSearch = '' } = opts
	const { user } = useAuth()
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState(initialSearch)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [mine, setMine] = useState<ProfileArticle[]>([])
	const [others, setOthers] = useState<ProfileArticle[]>([])
	const [total, setTotal] = useState(0)
	const debounceRef = useRef<number | null>(null)

	const refresh = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const meId = user?.id
			// Fetch all publications for current page (no author filter) then split client-side.
			// If backend grows large, we can issue two requests (author_id filter + global) or extend endpoint.
			const data = await listPublications({ page, page_size: pageSize, search })
			if (meId) {
				const mineList: ProfileArticle[] = []
				const rest: ProfileArticle[] = []
				for (const a of data.results) {
					if (a.authors.some(au => au.id === meId)) mineList.push(a)
					else rest.push(a)
				}
				setMine(mineList)
				setOthers(rest)
			} else {
				setMine([])
				setOthers(data.results)
			}
			setTotal(data.count)
		} catch (e: any) {
			setError(e.message || 'Ошибка загрузки')
		} finally {
			setLoading(false)
		}
	}, [page, pageSize, search, user?.id])

	// Initial + page changes
	useEffect(() => {
		refresh()
	}, [refresh])

	// Debounce search input
	useEffect(() => {
		if (debounceRef.current) window.clearTimeout(debounceRef.current)
		debounceRef.current = window.setTimeout(() => {
			setPage(1)
			refresh()
		}, 400)
		return () => {
			if (debounceRef.current) window.clearTimeout(debounceRef.current)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search])

	return {
		loading,
		error,
		page,
		setPage,
		search,
		setSearch,
		mine,
		others,
		total,
		pageSize,
		refresh,
	}
}
