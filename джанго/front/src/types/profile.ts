import type { UserPublic } from './auth'

export interface ProfileArticle {
	id: number
	title: string
	abstract?: string
	link?: string
	authors: { id: number; full_name: string }[]
	created_at?: string
	can_edit?: boolean // текущий пользователь может редактировать (является автором)
}

export interface ProfileGroup {
	id: number
	name: string
	description?: string
	role?: string // локализованная роль ('Руководитель' | 'Участник')
	membershipRole?: string // сырой role code ('leader' | 'member') если понадобится
	is_leader?: boolean
	members_count?: number
	leader_id?: number
	leader_name?: string
	can_manage?: boolean // текущий пользователь может редактировать (обычно лидер)
	members?: GroupMember[] // подробный список участников (опционально)
}

export interface GroupMember {
	id: number
	full_name: string
	is_leader?: boolean
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

export interface UpdateArticleInput {
	title?: string
	abstract?: string
	link?: string
	co_author_ids?: number[]
}

export interface NewGroupInput {
	name: string
	description?: string
	member_ids: number[] // кроме инициатора
}
