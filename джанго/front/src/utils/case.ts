// Utility functions for converting snake_case object keys (shallow or deep) to camelCase.
// Keeps arrays intact and skips Date / File / Blob instances.

export function toCamel(str: string) {
	return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

export function camelize<T = any>(input: any, depth = 3): T {
	if (input == null) return input
	if (typeof input !== 'object') return input
	if (Array.isArray(input)) return input.map(i => camelize(i, depth)) as any
	// Do not attempt to mutate special objects
	if (input instanceof Date || input instanceof File || input instanceof Blob)
		return input as any
	const out: any = {}
	for (const k of Object.keys(input)) {
		const v = (input as any)[k]
		const nk = toCamel(k)
		out[nk] = depth > 0 ? camelize(v, depth - 1) : v
	}
	return out as T
}

export function camelizeResponse<T = any>(data: any): T {
	return camelize<T>(data)
}
