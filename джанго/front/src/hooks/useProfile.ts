import { useCallback, useEffect, useState } from 'react'
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
				// avatar (data URL) can be passed through directly in patch.avatar
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
			setSaving(true)
			try {
				await deleteArticle(articleId, currentUser.id)
				setProfile(p =>
					p ? { ...p, articles: p.articles.filter(a => a.id !== articleId) } : p
				)
			} finally {
				setSaving(false)
			}
		},
		[profile, currentUser]
	)

	const addMember = useCallback(
		async (groupId: number, userId: number) => {
			if (!profile) return
			setSaving(true)
			try {
				await addGroupMember(groupId, userId)
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
			} finally {
				setSaving(false)
			}
		},
		[profile]
	)

	const removeMember = useCallback(
		async (groupId: number, userId: number) => {
			if (!profile) return
			setSaving(true)
			try {
				await removeGroupMember(groupId, userId)
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
			} finally {
				setSaving(false)
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
	}
}
