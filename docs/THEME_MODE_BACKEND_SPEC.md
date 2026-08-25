# FanMeet – Theme Mode (Light / Dark) Backend Spec

## 1. Overview

The web app now ships a **Light Mode** alongside the existing Dark Mode. The
frontend is complete; it needs the backend to **persist the user's theme
preference** so it follows them across devices and sessions.

The user model gains one field:

```
theme_mode: "light" | "dark"      // default "light"
```

**Default is `light`.** A user with no stored preference — and every
unauthenticated visitor — gets Light Mode.

### What happens until this is implemented

Nothing breaks. The theme is stored in `localStorage` and applied immediately on
toggle; the persistence call is fire-and-forget and its failure is swallowed.
Until the endpoint exists the preference simply does not follow the user to a
new device or browser.

---

## 2. Summary of required changes

| # | Change | Endpoint / Model |
|---|--------|------------------|
| 1 | Add `theme_mode` to the user model | User schema |
| 2 | Return `theme_mode` on every user object | all endpoints in §4 |
| 3 | Accept optional `theme_mode` on login | `POST /api/auth/login` |
| 4 | Accept optional `theme_mode` on registration | `POST /api/auth/fans/register`, `POST /api/auth/creators/register` |
| 5 | **New** endpoint to update the preference | `PATCH /api/user/theme` |

Model this on the **existing `language` preference** — same shape, same
envelope, same auth. `PATCH /api/user/language` is the direct precedent.

---

## 3. Model

```js
theme_mode: {
  type: String,
  enum: ['light', 'dark'],
  default: 'light',
}
```

**Migration:** existing users need backfilling to `'light'` (or rely on the
schema default if your ORM applies it on read). Either way the frontend treats a
missing value as `light`.

### Naming note

The field is `theme_mode` (snake_case) while the rest of this API is camelCase
(`userName`, `refreshToken`) and the sibling preference is plain `language`.
The frontend sends and reads **`theme_mode` exactly**, per the agreed contract.
If you would rather align it to `themeMode`, that is fine — tell us and we will
change the four call sites in `src/services/api.js`. Do not silently rename it:
the frontend would read `undefined` and fall back to `light` on every load.

---

## 4. Endpoints that must return `theme_mode`

Add the field to the serialised **user object** returned by:

| Method | Endpoint | Where the frontend reads it |
|--------|----------|-----------------------------|
| POST | `/api/auth/login` | `response.data.user.theme_mode` |
| POST | `/api/auth/fans/register` | `response.data.user.theme_mode` |
| POST | `/api/auth/creators/register` | `response.data.user.theme_mode` |
| GET | `/api/auth/profile` | user object |
| GET | `/api/profile/me` | user object |

The frontend caches the user blob in `localStorage['user']` and reads
`theme_mode` from it on boot, so any endpoint that refreshes that blob should
carry the field.

---

## 5. `POST /api/auth/login`

The request body gains **one optional field**.

**Request**

```json
{
  "email": "user@example.test",
  "password": "••••••••",
  "role": "fan",
  "theme_mode": "light"
}
```

- `theme_mode` is **optional**. It is present when the visitor toggled the theme
  before logging in. If absent, leave the stored value untouched.
- When present and valid, **persist it** to the user record before responding.
- If the value is anything other than `"light"` or `"dark"`, ignore it. Never
  fail a login over a bad theme value.

**Response** (existing envelope, one field added)

```json
{
  "StatusCode": 200,
  "data": {
    "token": "…",
    "refreshToken": "…",
    "user": {
      "id": "usr_000",
      "email": "user@example.test",
      "userName": "example",
      "role": "fan",
      "language": "de",
      "theme_mode": "light"
    }
  },
  "error": null
}
```

The returned `theme_mode` is **authoritative** — the frontend applies it
immediately after login, overriding whatever was set locally.

---

## 6. Registration

`POST /api/auth/fans/register` and `POST /api/auth/creators/register`.

These are **`multipart/form-data`** (they carry an avatar), so `theme_mode`
arrives as a **form field**, not JSON:

```
email:        user@example.test
password:     ••••••••
userName:     example
theme_mode:   light
avatar:       <file, optional>
```

- Always sent by the frontend (it defaults to `light`).
- Persist it on the new user record.
- Echo it back in `data.user.theme_mode`.

---

## 7. `PATCH /api/user/theme` — new

Mirrors `PATCH /api/user/language`.

- **Auth:** required (`Authorization: Bearer <token>`, same `authMiddleware`).
- **Content-Type:** `application/json`

**Request**

```json
{ "theme_mode": "light" }
```

**Success — 200**

```json
{
  "StatusCode": 200,
  "data": { "theme_mode": "light" },
  "error": null
}
```

**Validation failure — 400**

```json
{
  "StatusCode": 400,
  "data": null,
  "error": "theme_mode must be one of: light, dark"
}
```

**Behaviour notes**

- Validate against the enum and reject anything else with 400.
- Idempotent — setting the current value again is a success, not an error.
- The frontend calls this **fire-and-forget** after it has already repainted the
  UI. It does not read the response body and ignores errors, so latency here is
  invisible to the user. Prefer correctness over speed.
- It may be called in quick succession if a user toggles repeatedly. Last write
  wins; no locking needed.

---

## 8. Frontend behaviour (for context)

```
Launch app
  ↓
Inline script reads localStorage 'theme' → cached user.theme_mode → "light"
  ↓
Theme applied before first paint (no flash)
  ↓
On login/signup → server's user.theme_mode becomes authoritative
  ↓
On toggle → UI changes instantly → PATCH /api/user/theme in background
```

Resolution order: `localStorage['theme']` → `user.theme_mode` → `"light"`.

**Unauthenticated users** get Light Mode and may toggle freely; that choice is
kept in `localStorage` and sent as `theme_mode` on the next login or signup.

---

## 9. Acceptance checklist

- [ ] `theme_mode` exists on the user model, enum `light|dark`, default `light`
- [ ] Existing users backfilled
- [ ] `theme_mode` returned by login, both registers, `/auth/profile`, `/profile/me`
- [ ] `POST /auth/login` accepts and persists optional `theme_mode`
- [ ] Both register endpoints accept and persist the `theme_mode` form field
- [ ] `PATCH /api/user/theme` implemented, auth-guarded, enum-validated
- [ ] Invalid `theme_mode` on login/register is ignored, never fatal
- [ ] Invalid `theme_mode` on `PATCH` returns 400 with the standard envelope

---

## 10. Frontend call sites

All in `src/services/api.js`:

| Line | Function | Call |
|------|----------|------|
| 127 | `authAPI.login` | `POST /auth/login` with optional `theme_mode` |
| 150 | `authAPI.registerFan` | `POST /auth/fans/register` (FormData) |
| 156 | `authAPI.registerCreator` | `POST /auth/creators/register` (FormData) |
| 209 | `userAPI.updateTheme` | `PATCH /user/theme` |

Theme state lives in `src/context/ThemeContext.js`; storage and DOM application
in `src/utils/themeStorage.js`.
