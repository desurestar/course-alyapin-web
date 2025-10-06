// Normalization helpers (HTTP branch) to keep UI types consistent.
// Extend these if backend field naming diverges.
import type { GroupDetail, GroupProject } from '../types/group'
import type {
	ProfileArticle,
	ProfileDetail,
	ProfileGroup,
} from '../types/profile'
import type { ProjectDetail, ProjectSummary } from '../types/project'

// Generic safe accessor
function pick<T extends object, K extends keyof T>(
	obj: any,
	keys: K[]
): Pick<T, K> {
	const out: any = {}
	for (const k of keys) out[k] = obj?.[k]
	return out
}

export function adaptProfileDetail(raw: any): ProfileDetail | null {
	if (!raw) return null
	return {
		id: raw.id,
		first_name: raw.first_name,
		last_name: raw.last_name,
		full_name:
			raw.full_name || `${raw.first_name ?? ''} ${raw.last_name ?? ''}`.trim(),
		email: raw.email,
		phone: raw.phone ?? null,
		position: raw.position,
		bio: raw.bio,
		avatar: raw.avatar,
		articles: Array.isArray(raw.articles) ? raw.articles.map(adaptArticle) : [],
		groups: Array.isArray(raw.groups) ? raw.groups.map(adaptProfileGroup) : [],
		can_edit: !!raw.can_edit,
		stats: {
			articles:
				raw.stats?.articles ??
				(Array.isArray(raw.articles) ? raw.articles.length : 0),
			groups:
				raw.stats?.groups ??
				(Array.isArray(raw.groups) ? raw.groups.length : 0),
		},
	}
}

export function adaptArticle(raw: any): ProfileArticle {
	return {
		id: raw.id,
		title: raw.title,
		abstract: raw.abstract ?? undefined,
		link: raw.link ?? undefined,
		authors: Array.isArray(raw.authors)
			? raw.authors.map((a: any) => ({
					id: a.id,
					full_name: a.full_name || a.name,
			  }))
			: [],
		can_edit: !!raw.can_edit,
	}
}

export function adaptProfileGroup(raw: any): ProfileGroup {
	return {
		id: raw.id,
		name: raw.name,
		description: raw.description ?? undefined,
		role: raw.role,
		leader_id: raw.leader_id,
		leader_name: raw.leader_name,
		members_count: raw.members_count,
		is_leader: !!raw.is_leader,
		can_manage: !!raw.can_manage,
		members: Array.isArray(raw.members)
			? raw.members.map((m: any) => ({
					id: m.id,
					full_name: m.full_name,
					is_leader: !!m.is_leader,
			  }))
			: undefined,
	}
}

export function adaptGroupDetail(raw: any): GroupDetail | null {
	if (!raw) return null
	return {
		id: raw.id,
		name: raw.name,
		description: raw.description ?? undefined,
		leader_id: raw.leader_id,
		leader_name: raw.leader_name,
		members: Array.isArray(raw.members)
			? raw.members.map((m: any) => ({
					id: m.id,
					full_name: m.full_name,
					is_leader: !!m.is_leader,
			  }))
			: [],
		articles: Array.isArray(raw.articles) ? raw.articles.map(adaptArticle) : [],
		projects: Array.isArray(raw.projects)
			? raw.projects.map(adaptGroupProject)
			: [],
		members_count: raw.members_count ?? (raw.members?.length || 0),
		can_manage: !!raw.can_manage,
		is_member: !!raw.is_member,
		is_leader: !!raw.is_leader,
	}
}

export function adaptGroupProject(raw: any): GroupProject {
	return {
		id: raw.id,
		title: raw.title,
		description: raw.description ?? undefined,
		status: raw.status,
		start_date: raw.start_date,
		end_date: raw.end_date,
		supervisor_id: raw.supervisor_id,
		supervisor_name: raw.supervisor_name,
		can_edit: !!raw.can_edit,
	}
}

export function adaptProjectSummary(raw: any): ProjectSummary {
	return {
		id: raw.id,
		title: raw.title,
		status: raw.status,
		start_date: raw.start_date,
		end_date: raw.end_date,
		supervisor_name: raw.supervisor_name,
		group_id: raw.group_id ?? null,
	}
}

export function adaptProjectDetail(raw: any): ProjectDetail {
	return {
		id: raw.id,
		title: raw.title,
		description: raw.description ?? undefined,
		status: raw.status,
		start_date: raw.start_date,
		end_date: raw.end_date,
		budget: raw.budget,
		currency: raw.currency,
		grant_id: raw.grant_id ?? null,
		group_id: raw.group_id ?? null,
		supervisor_name: raw.supervisor_name,
		tags: raw.tags || [],
		website: raw.website,
	}
}
