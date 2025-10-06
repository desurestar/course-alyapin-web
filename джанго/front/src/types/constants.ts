// Shared constants & enums for the app.
// Extend as backend enumerations stabilize.

export const PROJECT_STATUSES = [
	'planned',
	'in_progress',
	'completed',
	'on_hold',
	'cancelled',
] as const
export type ProjectStatusEnum = (typeof PROJECT_STATUSES)[number]

export const GROUP_ROLES = ['Руководитель', 'Участник'] as const
export type GroupRoleEnum = (typeof GROUP_ROLES)[number]
