# Frontend API Layer

This directory contains the frontend abstraction for interacting with the (future) backend. It is designed so the UI code does not need to change when the real server endpoints become available.

## Toggle Mock vs HTTP

Set `API_USE_MOCK` in `config.ts` (or provide `VITE_API_USE_MOCK=false` at build time) to switch from in-memory mock data to real HTTP calls.

```
export const API_USE_MOCK = true // <- set false when backend ready
```

`http.ts` supplies:

- Base URL resolution (`VITE_API_BASE` or `/api`)
- JSON fetch wrapper with 401 refresh retry (`/auth/refresh/`)
- Access token setter/getter and cookie helpers

## Projects

| Function                 | Method / Endpoint                     | Notes                                        |
| ------------------------ | ------------------------------------- | -------------------------------------------- |
| listProjects(params)     | GET /projects/?search=&status=&group= | Returns `ProjectSummary[]`                   |
| getProject(id)           | GET /projects/{id}/                   | Returns `ProjectDetail`                      |
| createProject(data)      | POST /projects/                       | Use `prepareCreateProject` to sanitize input |
| updateProject(id, patch) | PATCH /projects/{id}/                 | Build diff via `buildProjectPatch`           |
| deleteProject(id)        | DELETE /projects/{id}/                | 204 on success                               |

Normalization uses `adaptProjectSummary` / `adaptProjectDetail` (see `adapters.ts`). Removed fields (budget, currency, tags) are already pruned from types.

## Articles (Publications)

| Function                                             | Method / Endpoint      | Notes                                    |
| ---------------------------------------------------- | ---------------------- | ---------------------------------------- |
| listArticles({ search, author_id, page, page_size }) | GET /articles/         | Returns `{results,count,page,page_size}` |
| getArticle(id)                                       | GET /articles/{id}/    | Normalized authors                       |
| updateArticleApi(id, patch)                          | PATCH /articles/{id}/  | Partial update                           |
| deleteArticleApi(id)                                 | DELETE /articles/{id}/ | 204 on success                           |

Authors array is normalized to `{ id, full_name }[]`.

## Admin Users

| Function                   | Endpoint                  | Notes                               |
| -------------------------- | ------------------------- | ----------------------------------- |
| listAdminUsers({search})   | GET /admin/users/?search= | Pagination TBD                      |
| createAdminUser(payload)   | POST /admin/users/        | Requires superuser/staff privileges |
| updateAdminUser(id, patch) | PATCH /admin/users/{id}/  | Partial                             |
| deleteAdminUser(id)        | DELETE /admin/users/{id}/ |                                     |

Helper utilities build clean payloads and avoid sending unchanged fields.

Per-domain mock override: admin users now ignore the global `API_USE_MOCK` flag by default and go straight to HTTP.
To force mock mode only for this domain set env:

```
VITE_API_USE_MOCK_ADMIN_USERS=true
```

To explicitly ensure HTTP (even if future logic changes), set:

```
VITE_API_USE_MOCK_ADMIN_USERS=false
```

## Groups

Current minimal read helpers:

- `listAllGroups()` -> GET /groups/
- `getGroup(id)` -> GET /groups/{id}/
  (Mutation endpoints can be added similarly when needed.)

## Grants

Grants API now supports full CRUD (frontend-prepared; backend endpoints assumed):

Functions:

- `listGrants()` -> GET /grants/
- `getGrant(id)` -> GET /grants/{id}/
- `createGrant(payload, { link_project_id? })` -> POST /grants/ then optional PATCH /projects/{pid}/ { grant_id }
- `updateGrant(id, patch, { link_project_id? })` -> PATCH /grants/{id}/ then optional project relink
- `deleteGrant(id)` -> DELETE /grants/{id}/

Linking logic: if the options object includes `link_project_id`, after successful create/update the specified project is patched with the new grant_id. In mock mode this is a no-op placeholder.

Extended fields (frontend-prepared):

- `amount` (number) – суммарный бюджет гранта.
- `leader_id` – пользователь-руководитель гранта; в ответах может сопровождаться `leader_name`.

Backend should accept/emit these fields; mock layer synthesizes `leader_name` as `User #<id>` if not provided.

## Departments (Academic)

| Function                    | Method / Endpoint             | Notes                                          |
| --------------------------- | ----------------------------- | ---------------------------------------------- |
| listDepartments({search})   | GET /departments/?search=     | Returns basic department list                  |
| getDepartment(id)           | GET /departments/{id}/        | Detail (includes employees/groups in mock)     |
| getDepartmentInfo(id)       | GET /departments/{id}/info/   | Extended textual info (history, mission, etc.) |
| listDepartmentEmployees(id) | GET /departments/{id}/staff/  | Staff list (id, full_name, position, contacts) |
| listDepartmentGroups(id)    | GET /departments/{id}/groups/ | Research groups under department               |
| createDepartment(data)      | POST /departments/            | (Mock + future real)                           |
| updateDepartment(id, patch) | PATCH /departments/{id}/      | Partial update (name, head, deputy...)         |
| deleteDepartment(id)        | DELETE /departments/{id}/     | Remove department                              |

Mock variant eagerly returns `employees`, `groups`, `info`; real backend may choose lazy pattern (fetch info/staff/groups separately).

### Department Types

Defined in `types/department.ts`:

- `Department` / `DepartmentDetail` / `DepartmentInfo`
- `DepartmentEmployee` / `ResearchGroup`
- `buildDepartmentPayload` helper for create/update.

### Normalization Guidelines

If backend exposes nested user objects for head/deputy, adapt to `{ head_id, head_name }` (extend adapter later). For now IDs only.

## User Search / Profile

- `searchUsers(query)` -> GET /users/?search=
- `getProfileDetailHttp(id)` -> GET /users/{id}/profile/

## Patterns & Conventions

- All HTTP functions accept an `auth` flag to include `Authorization: Bearer <token>`.
- Normalization happens as close to fetch boundary as possible (see `adapters.ts`).
- Mock and HTTP share the same function signatures so UI stays stable.
- Dates are raw ISO strings; formatting is handled in components.
- Diff builders (`buildProjectPatch`) keep PATCH payloads minimal.

## Adding a New Domain

1. Define shared types in `types/*.ts`.
2. Create `api/<domain>.ts` with mock branch guarded by `API_USE_MOCK`.
3. Add normalization adapters if backend fields differ from UI model.
4. Export from `api/index.ts`.
5. Use helpers to sanitize and diff payloads.
6. Update `api/README.md` & `api/index.ts`.

## Error Handling

HTTP errors throw `HttpError` containing `status` and `payload`. UI layer can catch and surface `err.message`.

## Refresh Logic

401 responses trigger a single refresh attempt (`/auth/refresh/`). On success the original request is retried transparently.

---

This layer is now ready to plug into a real backend by switching `API_USE_MOCK` to `false` and pointing `VITE_API_BASE` to the server root.

## Integration Playbook

1. Set `API_USE_MOCK = false` (or `VITE_API_USE_MOCK=false`).
2. Configure `VITE_API_BASE` to your backend root (e.g. `https://api.example.com`).
3. Ensure auth refresh endpoint `/auth/refresh/` returns `{ access: "<jwt>" }`.
4. Adjust adapters (`adapters.ts`) if backend field names differ.
5. Incrementally remove mock-only branches after verification.
6. Add domain-specific validation before dispatching create/update to reduce server 400s.
7. Log unexpected shapes (`console.warn`) during initial integration for faster backend alignment.

### PATCH Strategy

Use diff builders (`buildProjectPatch`, extend similar for departments if needed) so backend receives only changed fields; simplifies audit logs and reduces payload size.

### Error Reporting

Catch `HttpError`, surface `err.message`, optionally inspect `err.payload` for field-level validation errors (map to form inputs).

---

Happy building!
