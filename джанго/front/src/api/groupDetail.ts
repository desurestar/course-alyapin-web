import type {
	GroupDetail,
	GroupProject,
	NewGroupArticleInput,
	NewGroupProjectInput,
	UpdateGroupArticleInput,
	UpdateGroupProjectInput,
} from '../types/group'
import type { ProfileArticle } from '../types/profile'
import { API_USE_MOCK } from './config'
import { http } from './http'

// Backend endpoints mapping (intended):
//  GET    /groups/{id}/detail/                          -> getGroupDetailApi
//  PATCH  /groups/{id}/                                  -> updateGroupApi
//  DELETE /groups/{id}/                                  -> deleteGroupApi
//  POST   /groups/{id}/leave/                            -> leaveGroupApi
//  POST   /groups/{id}/add_member/                       -> addGroupMemberApi { user_id }
//  POST   /groups/{id}/remove_member/                    -> removeGroupMemberApi { user_id }
//  POST   /groups/{id}/articles/                         -> createGroupArticleApi (NewGroupArticleInput)
//  PATCH  /groups/{id}/articles/{article_id}/            -> updateGroupArticleApi (UpdateGroupArticleInput)
//  DELETE /groups/{id}/articles/{article_id}/            -> deleteGroupArticleApi
//  POST   /groups/{id}/projects/                         -> createGroupProjectApi (NewGroupProjectInput)
//  PATCH  /groups/{id}/projects/{project_id}/            -> updateGroupProjectApi (UpdateGroupProjectInput)
//  DELETE /groups/{id}/projects/{project_id}/            -> deleteGroupProjectApi

let mock: any = null
async function m() {
	if (!mock) mock = await import('./profile')
	return mock
}
const USE_MOCK = API_USE_MOCK

export async function getGroupDetailApi(
	groupId: number,
	currentUserId: number
): Promise<GroupDetail | null> {
	if (USE_MOCK) {
		const mm = await m()
		return mm.getGroupDetail(groupId, currentUserId)
	}
	return http<GroupDetail>(`/groups/${groupId}/detail/`, { auth: true })
}

export async function updateGroupApi(
	groupId: number,
	patch: Partial<{ name: string; description: string; leader_id: number }>
): Promise<GroupDetail> {
	if (USE_MOCK) {
		const mm = await m()
		await mm.updateGroup(groupId, patch)
		return mm.getGroupDetail(groupId, patch.leader_id || 0)
	}
	return http<GroupDetail>(`/groups/${groupId}/`, {
		method: 'PATCH',
		auth: true,
		body: JSON.stringify(patch),
	})
}

export async function deleteGroupApi(groupId: number): Promise<void> {
	if (USE_MOCK) {
		const mm = await m()
		await mm.deleteGroup(groupId)
		return
	}
	await http(`/groups/${groupId}/`, { method: 'DELETE', auth: true })
}

export async function leaveGroupApiDetail(
	groupId: number,
	currentUserId: number
): Promise<void> {
	if (USE_MOCK) {
		const mm = await m()
		await mm.leaveGroup(currentUserId, groupId)
		return
	}
	await http(`/groups/${groupId}/leave/`, { method: 'POST', auth: true })
}

export async function addGroupMemberApiDetail(
	groupId: number,
	userId: number
): Promise<void> {
	if (USE_MOCK) {
		const mm = await m()
		await mm.addGroupMember(groupId, userId)
		return
	}
	await http(`/groups/${groupId}/add_member/`, {
		method: 'POST',
		auth: true,
		body: JSON.stringify({ user_id: userId }),
	})
}

export async function removeGroupMemberApiDetail(
	groupId: number,
	userId: number
): Promise<void> {
	if (USE_MOCK) {
		const mm = await m()
		await mm.removeGroupMember(groupId, userId)
		return
	}
	await http(`/groups/${groupId}/remove_member/`, {
		method: 'POST',
		auth: true,
		body: JSON.stringify({ user_id: userId }),
	})
}

// Articles
export async function createGroupArticleApi(
	groupId: number,
	currentUserId: number,
	input: NewGroupArticleInput
): Promise<ProfileArticle> {
	if (USE_MOCK) {
		const mm = await m()
		return mm.addGroupArticle(groupId, currentUserId, input)
	}
	return http<ProfileArticle>(`/groups/${groupId}/articles/`, {
		method: 'POST',
		auth: true,
		body: JSON.stringify(input),
	})
}

export async function updateGroupArticleApi(
	groupId: number,
	articleId: number,
	currentUserId: number,
	patch: UpdateGroupArticleInput
): Promise<ProfileArticle> {
	if (USE_MOCK) {
		const mm = await m()
		return mm.updateGroupArticle(groupId, articleId, currentUserId, patch)
	}
	return http<ProfileArticle>(`/groups/${groupId}/articles/${articleId}/`, {
		method: 'PATCH',
		auth: true,
		body: JSON.stringify(patch),
	})
}

export async function deleteGroupArticleApi(
	groupId: number,
	articleId: number,
	currentUserId: number
): Promise<void> {
	if (USE_MOCK) {
		const mm = await m()
		return mm.deleteGroupArticle(groupId, articleId, currentUserId)
	}
	await http(`/groups/${groupId}/articles/${articleId}/`, {
		method: 'DELETE',
		auth: true,
	})
}

// Projects
export async function createGroupProjectApi(
	groupId: number,
	currentUserId: number,
	input: NewGroupProjectInput
): Promise<GroupProject> {
	if (USE_MOCK) {
		const mm = await m()
		return mm.createGroupProject(groupId, currentUserId, input)
	}
	return http<GroupProject>(`/groups/${groupId}/projects/`, {
		method: 'POST',
		auth: true,
		body: JSON.stringify(input),
	})
}

export async function updateGroupProjectApi(
	groupId: number,
	projectId: number,
	currentUserId: number,
	patch: UpdateGroupProjectInput
): Promise<GroupProject> {
	if (USE_MOCK) {
		const mm = await m()
		return mm.updateGroupProject(groupId, projectId, currentUserId, patch)
	}
	return http<GroupProject>(`/groups/${groupId}/projects/${projectId}/`, {
		method: 'PATCH',
		auth: true,
		body: JSON.stringify(patch),
	})
}

export async function deleteGroupProjectApi(
	groupId: number,
	projectId: number,
	currentUserId: number
): Promise<void> {
	if (USE_MOCK) {
		const mm = await m()
		return mm.deleteGroupProject(groupId, projectId, currentUserId)
	}
	await http(`/groups/${groupId}/projects/${projectId}/`, {
		method: 'DELETE',
		auth: true,
	})
}
