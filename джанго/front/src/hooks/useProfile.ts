import { useCallback, useEffect, useState } from 'react'
import {
	createArticle,
	createGroup,
	getProfileDetail,
	leaveGroup,
	listCoAuthorCandidates,
	updateProfile,
} from '../api/profile'
import { useAuth } from '../auth/auth'
import type { UserPublic } from '../types/auth'
import type {
	NewArticleInput,
	NewGroupInput,
	ProfileDetail,
} from '../types/profile'

export function useProfile(userId: number) {
	const { user: currentUser } = useAuth()
	const [profile, setProfile] = useState<ProfileDetail | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [candidates, setCandidates] = useState<UserPublic[]>([])

	const load = useCallback(async () => {
		if (!currentUser) return
		setLoading(true)
		setError(null)
		try {
			const detail = await getProfileDetail(userId, currentUser.id)
			setProfile(detail)
		} catch (e: any) {
			setError(e.message || 'Ошибка загрузки')
		} finally {
			setLoading(false)
		}
	}, [userId, currentUser])

	useEffect(() => {
		load()
	}, [load])

	const refreshCandidates = useCallback(async () => {
		if (!profile) return
		const usedIds = profile.articles.flatMap(a => a.authors.map(au => au.id))
		const list = await listCoAuthorCandidates(
			Array.from(new Set([profile.id, ...usedIds]))
		)
		setCandidates(list)
	}, [profile])

	const saveProfile = useCallback(
		async (patch: Partial<ProfileDetail>) => {
			if (!profile) return
			setSaving(true)
			try {
				// sanitize fields not accepted by backend mock (null -> undefined)
				const backendPatch: any = { ...patch }
				if (backendPatch.phone === null) delete backendPatch.phone
				const updated = await updateProfile(profile.id, backendPatch)
				setProfile(p => (p ? { ...p, ...updated } : p))
			} finally {
				setSaving(false)
			}
		},
		[profile]
	)

	const addArticle = useCallback(
		async (input: NewArticleInput) => {
			if (!profile || !currentUser) return
			setSaving(true)
			try {
				const art = await createArticle(currentUser.id, input)
				setProfile(p => (p ? { ...p, articles: [art, ...p.articles] } : p))
			} finally {
				setSaving(false)
			}
		},
		[profile, currentUser]
	)

	const createNewGroup = useCallback(
		async (input: NewGroupInput) => {
			if (!profile || !currentUser) return
			setSaving(true)
			try {
				const grp = await createGroup(currentUser.id, input)
				setProfile(p => (p ? { ...p, groups: [grp, ...p.groups] } : p))
			} finally {
				setSaving(false)
			}
		},
		[profile, currentUser]
	)

	const leaveCurrentGroup = useCallback(
		async (groupId: number) => {
			if (!profile || !currentUser) return
			setSaving(true)
			try {
				await leaveGroup(currentUser.id, groupId)
				setProfile(p =>
					p ? { ...p, groups: p.groups.filter(g => g.id !== groupId) } : p
				)
			} finally {
				setSaving(false)
			}
		},
		[profile, currentUser]
	)

	return {
		profile,
		loading,
		error,
		saving,
		load,
		saveProfile,
		addArticle,
		createNewGroup,
		leaveCurrentGroup,
		candidates,
		refreshCandidates,
	}
}
