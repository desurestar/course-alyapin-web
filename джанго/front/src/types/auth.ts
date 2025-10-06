export interface UserPublic {
	id: number
	first_name: string
	last_name: string
	email: string | null
	phone?: string | null
	full_name?: string
	is_superuser?: boolean
	is_staff?: boolean
}

export interface AuthTokens {
	access: string
	accessExp: number | null
}

export interface AuthContextValue {
	user: UserPublic | null
	loading: boolean
	error: string | null
	loggedIn: boolean
	/** @deprecated use loggedIn */
	authed?: boolean
	loginEmail: (email: string, password: string) => Promise<void>
	loginPhone: (phone: string, password: string) => Promise<void>
	register: (data: {
		full_name: string
		email?: string
		phone?: string
		password: string
	}) => Promise<void>
	logout: () => Promise<void>
	refresh: () => Promise<void>
}
