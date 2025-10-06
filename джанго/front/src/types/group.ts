import type { ProfileArticle } from './profile'

// Project entity for a research group
export interface GroupProject {
	id: number
	title: string
	description?: string
	status?: 'planned' | 'in_progress' | 'completed' | 'paused'
	start_date?: string
	end_date?: string
	supervisor_id?: number
	supervisor_name?: string
	can_edit?: boolean
}

export interface GroupMemberDetail {
	id: number
	full_name: string
	is_leader?: boolean
}

export interface GroupDetail {
	id: number
	name: string
	description?: string
	leader_id?: number
	leader_name?: string
	members: GroupMemberDetail[]
	articles: ProfileArticle[] // статьи, привязанные к группе (могут быть подмножеством персональных)
	projects: GroupProject[]
	members_count: number
	can_manage: boolean // текущий пользователь может управлять группой
	is_member: boolean
	is_leader: boolean
}

// Input shapes
export interface UpdateGroupInput {
	name?: string
	description?: string
	leader_id?: number
}
export interface NewGroupArticleInput {
	title: string
	abstract?: string
	link?: string
	co_author_ids: number[]
}
export interface UpdateGroupArticleInput {
	title?: string
	abstract?: string
	link?: string
	co_author_ids?: number[]
}
export interface NewGroupProjectInput {
	title: string
	description?: string
	status?: GroupProject['status']
	start_date?: string
	end_date?: string
}
export interface UpdateGroupProjectInput {
	title?: string
	description?: string
	status?: GroupProject['status']
	start_date?: string
	end_date?: string
}
