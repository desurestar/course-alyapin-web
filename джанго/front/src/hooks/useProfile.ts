import { useCallback, useEffect, useRef, useState } from 'react'
import {
	addGroupMember,
	createArticle,
	createGroup,
	deleteArticle,
	deleteGroup,
	getProfileDetail,
	leaveGroup,
	listCoAuthorCandidates,
	removeGroupMember,
	updateArticle,
	updateGroup,
	updateProfile,
	uploadAvatar,
} from '../api/profile'
import { useAuth } from '../auth/auth'
import type { UserPublic } from '../types/auth'
import type {
	NewArticleInput,
	NewGroupInput,
	ProfileDetail,
	UpdateArticleInput,
} from '../types/profile'

export function useProfile(userId: number) {
	const { user: currentUser } = useAuth()
	const [profile, setProfile] = useState<ProfileDetail | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [candidates, setCandidates] = useState<UserPublic[]>([])
	const [candidateQuery, setCandidateQuery] = useState('')
	const [candidateLoading, setCandidateLoading] = useState(false)
	const candidateAbort = useRef<number | null>(null)

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

	const refreshCandidates = useCallback(
		async (q?: string) => {
			if (!profile) return
			setCandidateLoading(true)
			try {
				const usedIds = profile.articles.flatMap(a =>
					a.authors.map(au => au.id)
				)
				const list = await listCoAuthorCandidates(
					Array.from(new Set([profile.id, ...usedIds]))
				)
				const filtered = q
					? list.filter(c => {
							const name = (
								c.full_name || `${c.first_name} ${c.last_name}`
							).toLowerCase()
							return name.includes(q.toLowerCase())
					  })
					: list
				setCandidates(filtered)
			} finally {
				setCandidateLoading(false)
			}
		},
		[profile]
	)

	useEffect(() => {
		if (candidateAbort.current) window.clearTimeout(candidateAbort.current)
		candidateAbort.current = window.setTimeout(() => {
			refreshCandidates(candidateQuery)
		}, 350)
		return () => {
			if (candidateAbort.current) window.clearTimeout(candidateAbort.current)
		}
	}, [candidateQuery, refreshCandidates])

	const saveProfile = useCallback(
		async (patch: Partial<ProfileDetail> & { avatarFile?: File }) => {
			if (!profile) return
			setSaving(true)
			try {
				let avatarUrl: string | undefined
				if (patch.avatarFile) {
					avatarUrl = await uploadAvatar(profile.id, patch.avatarFile)
				}
				const backendPatch: any = { ...patch }
				delete backendPatch.avatarFile
				if (avatarUrl) backendPatch.avatar = avatarUrl
				if (backendPatch.phone === null) delete backendPatch.phone
				const updated = await updateProfile(profile.id, backendPatch)
				setProfile(p =>
					p
						? {
								...p,
								...updated,
								avatar: avatarUrl ?? updated.avatar ?? p.avatar,
						  }
						: p
				)
			} finally {
				setSaving(false)
			}
		},
		[profile]
	)

	const addArticle = useCallback(
		async (input: NewArticleInput) => {
			if (!profile || !currentUser) return
			const tempId = Date.now()
			const currentUserName =
				currentUser.full_name ||
				`${currentUser.first_name} ${currentUser.last_name}`
			const optimistic: any = {
				id: tempId,
				title: input.title,
				abstract: input.abstract,
				link: input.link,
				authors: [{ id: currentUser.id, full_name: currentUserName }],
				can_edit: true,
			}
			setProfile(p => (p ? { ...p, articles: [optimistic, ...p.articles] } : p))
			try {
				const art = await createArticle(currentUser.id, input)
				setProfile(p =>
					p
						? {
								...p,
								articles: p.articles.map(a => (a.id === tempId ? art : a)),
						  }
						: p
				)
			} catch (e) {
				setProfile(p =>
					p ? { ...p, articles: p.articles.filter(a => a.id !== tempId) } : p
				)
				throw e
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

	const modifyGroup = useCallback(
		async (
			groupId: number,
			patch: Partial<{ name: string; description: string; leader_id: number }>
		) => {
			if (!profile) return
			setSaving(true)
			try {
				const updated = await updateGroup(groupId, patch)
				setProfile(p =>
					p
						? {
								...p,
								groups: p.groups.map(g =>
									g.id === groupId ? { ...g, ...updated } : g
								),
						  }
						: p
				)
			} finally {
				setSaving(false)
			}
		},
		[profile]
	)

	const removeGroup = useCallback(
		async (groupId: number) => {
			if (!profile) return
			setSaving(true)
			try {
				await deleteGroup(groupId)
				setProfile(p =>
					p ? { ...p, groups: p.groups.filter(g => g.id !== groupId) } : p
				)
			} finally {
				setSaving(false)
			}
		},
		[profile]
	)

	const editArticle = useCallback(
		async (articleId: number, patch: UpdateArticleInput) => {
			if (!profile || !currentUser) return
			setSaving(true)
			try {
				const updated = await updateArticle(articleId, currentUser.id, patch)
				setProfile(p =>
					p
						? {
								...p,
								articles: p.articles.map(a =>
									a.id === articleId ? { ...a, ...updated } : a
								),
						  }
						: p
				)
			} finally {
				setSaving(false)
			}
		},
		[profile, currentUser]
	)

	const removeArticle = useCallback(
		async (articleId: number) => {
			if (!profile || !currentUser) return
			const prev = profile.articles
			setProfile(p =>
				p ? { ...p, articles: p.articles.filter(a => a.id !== articleId) } : p
			)
			try {
				await deleteArticle(articleId, currentUser.id)
			} catch (e) {
				setProfile(p => (p ? { ...p, articles: prev } : p))
				throw e
			}
		},
		[profile, currentUser]
	)

	const addMember = useCallback(
		async (groupId: number, userId: number) => {
			if (!profile) return
			setProfile(p =>
				p
					? {
							...p,
							groups: p.groups.map(g =>
								g.id === groupId
									? {
											...g,
											members_count:
												(g.members_count || 0) +
												(g.members?.some(m => m.id === userId) ? 0 : 1),
											members: g.members
												? [
														...g.members,
														{ id: userId, full_name: 'user#' + userId },
												  ]
												: g.members,
									  }
									: g
							),
					  }
					: p
			)
			try {
				await addGroupMember(groupId, userId)
			} catch (e) {
				await load()
				throw e
			}
		},
		[profile, load]
	)

	const removeMember = useCallback(
		async (groupId: number, userId: number) => {
			if (!profile) return
			const snapshot = profile.groups
			setProfile(p =>
				p
					? {
							...p,
							groups: p.groups.map(g =>
								g.id === groupId
									? {
											...g,
											members_count: (g.members_count || 0) - 1,
											members: g.members?.filter(m => m.id !== userId),
									  }
									: g
							),
					  }
					: p
			)
			try {
				await removeGroupMember(groupId, userId)
			} catch (e) {
				setProfile(p => (p ? { ...p, groups: snapshot } : p))
				throw e
			}
		},
		[profile]
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
		modifyGroup,
		removeGroup,
		editArticle,
		removeArticle,
		addMember,
		removeMember,
		candidates,
		refreshCandidates,
		candidateQuery,
		setCandidateQuery,
		candidateLoading,
	}
}
