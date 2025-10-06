// Central place for API layer configuration / toggles.
// Switch to false when backend endpoints become available.
export const API_USE_MOCK = true

// Helper to build full path if needed in non-mock mode (optional).
export function apiPath(p: string) {
	return p.startsWith('/') ? p : '/' + p
}
