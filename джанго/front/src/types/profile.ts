import type { UserPublic } from './auth'

export interface ProfileArticle {
	id: number
	title: string
	abstract?: string
	link?: string
	authors: { id: number; full_name: string }[]
	created_at?: string
}

export interface ProfileGroup {
	id: number
	name: string
	description?: string
	role?: string // роль текущего пользователя в этой группе
	is_leader?: boolean
	members_count?: number
}

export interface ProfileDetail extends UserPublic {
	position?: string
	bio?: string
	avatar?: string // data URL or remote path
	articles: ProfileArticle[]
	groups: ProfileGroup[]
	stats?: { articles: number; groups: number }
	can_edit: boolean
}

export interface NewArticleInput {
	title: string
	abstract?: string
	link?: string
	co_author_ids: number[]
}

export interface NewGroupInput {
	name: string
	description?: string
	member_ids: number[] // кроме инициатора
}
