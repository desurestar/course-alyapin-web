import { useCallback, useEffect, useState } from 'react'
import {
	addGroupMemberApiDetail,
	createGroupArticleApi,
	createGroupProjectApi,
	deleteGroupApi,
	deleteGroupArticleApi,
	deleteGroupProjectApi,
	getGroupDetailApi,
	leaveGroupApiDetail,
	removeGroupMemberApiDetail,
	updateGroupApi,
	updateGroupArticleApi,
	updateGroupProjectApi,
} from '../api/groupDetail'
import { useAuth } from '../auth/auth'
import type {
	GroupDetail,
	NewGroupArticleInput,
	NewGroupProjectInput,
	UpdateGroupArticleInput,
	UpdateGroupProjectInput,
} from '../types/group'

// Hook responsible for loading and mutating a single research group.
// Backend mapping documented in api/groupDetail.ts.
export function useGroup(groupId: number) {
	const { user } = useAuth()
	const uid = user?.id
	const [group, setGroup] = useState<GroupDetail | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const load = useCallback(async () => {
		if (!uid) return
		setLoading(true)
		setError(null)
		try {
			const detail = await getGroupDetailApi(groupId, uid)
			setGroup(detail)
		} catch (e: any) {
			setError(e.message || 'Ошибка загрузки группы')
		} finally {
			setLoading(false)
		}
	}, [groupId, uid])

	useEffect(() => {
		load()
	}, [load])

	const updateGroup = useCallback(
		async (
			patch: Partial<{ name: string; description: string; leader_id: number }>
		) => {
			if (!group) return
			setSaving(true)
			try {
				// For mock we re-fetch via getGroupDetail after update for consistency
				await updateGroupApi(group.id, patch)
				await load()
			} finally {
				setSaving(false)
			}
		},
		[group, load]
	)

	const deleteGroup = useCallback(async () => {
		if (!group) return
		setSaving(true)
		try {
			await deleteGroupApi(group.id)
		} finally {
			setSaving(false)
		}
	}, [group])

	const leaveGroup = useCallback(async () => {
		if (!group || !uid) return
		setSaving(true)
		try {
			await leaveGroupApiDetail(group.id, uid)
			await load()
		} finally {
			setSaving(false)
		}
	}, [group, uid, load])

	const addMember = useCallback(
		async (userId: number) => {
			if (!group) return
			setSaving(true)
			try {
				await addGroupMemberApiDetail(group.id, userId)
				await load()
			} finally {
				setSaving(false)
			}
		},
		[group, load]
	)

	const removeMember = useCallback(
		async (userId: number) => {
			if (!group) return
			setSaving(true)
			try {
				await removeGroupMemberApiDetail(group.id, userId)
				await load()
			} finally {
				setSaving(false)
			}
		},
		[group, load]
	)

	// Articles
	const createArticle = useCallback(
		async (input: NewGroupArticleInput) => {
			if (!group || !uid) return
			setSaving(true)
			try {
				await createGroupArticleApi(group.id, uid, input)
				await load()
			} finally {
				setSaving(false)
			}
		},
		[group, uid, load]
	)

	const updateArticle = useCallback(
		async (articleId: number, patch: UpdateGroupArticleInput) => {
			if (!group || !uid) return
			setSaving(true)
			try {
				await updateGroupArticleApi(group.id, articleId, uid, patch)
				await load()
			} finally {
				setSaving(false)
			}
		},
		[group, uid, load]
	)

	const deleteArticle = useCallback(
		async (articleId: number) => {
			if (!group || !uid) return
			setSaving(true)
			try {
				await deleteGroupArticleApi(group.id, articleId, uid)
				await load()
			} finally {
				setSaving(false)
			}
		},
		[group, uid, load]
	)

	// Projects
	const createProject = useCallback(
		async (input: NewGroupProjectInput) => {
			if (!group || !uid) return
			setSaving(true)
			try {
				await createGroupProjectApi(group.id, uid, input)
				await load()
			} finally {
				setSaving(false)
			}
		},
		[group, uid, load]
	)

	const updateProject = useCallback(
		async (projectId: number, patch: UpdateGroupProjectInput) => {
			if (!group || !uid) return
			setSaving(true)
			try {
				await updateGroupProjectApi(group.id, projectId, uid, patch)
				await load()
			} finally {
				setSaving(false)
			}
		},
		[group, uid, load]
	)

	const deleteProject = useCallback(
		async (projectId: number) => {
			if (!group || !uid) return
			setSaving(true)
			try {
				await deleteGroupProjectApi(group.id, projectId, uid)
				await load()
			} finally {
				setSaving(false)
			}
		},
		[group, uid, load]
	)

	return {
		group,
		loading,
		saving,
		error,
		reload: load,
		updateGroup,
		deleteGroup,
		leaveGroup,
		addMember,
		removeMember,
		createArticle,
		updateArticle,
		deleteArticle,
		createProject,
		updateProject,
		deleteProject,
	}
}
