# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
	globalIgnores(['dist']),
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			// Other configs...

			// Remove tseslint.configs.recommended and replace with this
			...tseslint.configs.recommendedTypeChecked,
			// Alternatively, use this for stricter rules
			...tseslint.configs.strictTypeChecked,
			// Optionally, add this for stylistic rules
			...tseslint.configs.stylisticTypeChecked,

			// Other configs...
		],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.node.json', './tsconfig.app.json'],
				tsconfigRootDir: import.meta.dirname,
			},
			// other options...
		},
	},
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
	globalIgnores(['dist']),
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			// Other configs...
			// Enable lint rules for React
			reactX.configs['recommended-typescript'],
			// Enable lint rules for React DOM
			reactDom.configs.recommended,
		],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.node.json', './tsconfig.app.json'],
				tsconfigRootDir: import.meta.dirname,
			},
			// other options...
		},
	},
])
```

# Frontend

## Auth Integration Notes

Environment variable:

- `VITE_API_BASE` - Base URL of backend API (e.g. `http://localhost:8000/api`) fallback `/api`.

### Endpoints expected

```
POST /auth/register/  -> {full_name, email?, phone?, password} returns {access, user}
POST /auth/login/     -> {email|phone, password} returns {access, user}
POST /auth/refresh/   -> (uses refresh cookie) returns {access}
GET  /auth/me/        -> returns user object
POST /auth/logout/    -> clears refresh cookie server-side
```

Backend should set HttpOnly `refresh_token` (or similar) cookie on login & refresh. Access token is short-lived (e.g. 5-15 min) returned in JSON and stored only in memory (not localStorage) to reduce XSS risk. Refresh scheduled automatically ~30s before expiry; failing refresh logs user out in memory.

### User object shape

```
{
  id: number,
  first_name: string,
  last_name: string,
  email: string|null,
  phone?: string|null,
  full_name?: string // derived if absent
}
```

### Adding protected routes

Wrap route elements with `<RequireAuth>` (if implemented) or check `useAuth().loggedIn`.

### Error handling

The `useAuth()` hook exposes `error` and `loading`. Pages should show inline errors (already implemented in login page).

### Security considerations

- Do NOT store refresh token in JS; only HttpOnly secure cookie.
- Access token lives only in memory; page reload triggers silent refresh attempt.
- Consider adding CSRF protection for state-changing non-auth endpoints if using session or cookies beyond refresh.

### Future improvements

- Persist minimal session flag to attempt silent refresh only once per tab.
- Exponential backoff on network errors during scheduled refresh.
- Role/permissions field on user for conditional rendering.
