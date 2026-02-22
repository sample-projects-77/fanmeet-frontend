# FanMeet Backend & Frontend Overview

## Project summary

- **Roles**: **Fan** and **Creator**
- **Creator**: Creates profile, meetings (offers), availability, has dashboard (earnings, sessions, rating, upcoming).
- **Fan**: Browses creators, books meetings, pays, sees bookings, can review.
- **Backend**: Node/Express at `J:\workspace\FANMEET_BACKEND`, base URL `http://localhost:5000`, API under `/api`.
- **Frontend**: React (Create React App) in this repo; currently Login, Signup, and basic `api.js` (auth only).

---

## Backend API summary

Base URL: `http://localhost:5000/api` (or `REACT_APP_API_URL` ending with `/api`).

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/fans/register` | No | Register fan. Body (form): `email`, `password`, `userName`. |
| POST | `/auth/creators/register` | No | Register creator. Body (form): `email`, `password`, `userName`, `bio` (optional). |
| POST | `/auth/login` | No | Login. Body (JSON): `email`, `password`, **`role`** (`"fan"` or `"creator"`). |
| GET | `/auth/profile` | Yes | Current user profile. |
| PUT | `/auth/change-password` | Yes | Body: `oldPassword`, `newPassword`. |
| POST | `/auth/forgot-password` | No | Body: `email`. |
| POST | `/auth/verify-code` | No | Body: `email`, `code`. |
| POST | `/auth/reset-password` | No | Body: `email`, `code`, `newPassword`. |
| POST | `/auth/logout` | Yes | Logout. |
| DELETE | `/auth/delete-account` | Yes | Delete account. |

**Login response**: `{ StatusCode: 200, data: { user: {...}, token } }`. Store `token` and use as `Authorization: Bearer <token>`.

---

### Profiles (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile/me` | Yes | Full profile (fan or creator). |
| PATCH | `/fans/me` | Yes, fan | Update fan: multipart `avatarUrl` (file), `userName`. |
| PATCH | `/fans/me/bio` | Yes, fan | JSON: `bio`. |
| PATCH | `/creators/me` | Yes, creator | Update creator: multipart `avatarUrl`, `coverPhoto`, `hourlyRateCents`, `location`. |
| PATCH | `/creators/me/bio-category` | Yes, creator | JSON: `bio`, `category`. |
| GET | `/creators` | Optional | List creators. Query: `page`, `itemsPerPage`, `q` (search), `category`. |
| GET | `/creators/:creatorId` | No | Creator public profile. |

---

### Offers (meetings) (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/creators/me/offers` | Yes, creator | My offers (paginated). |
| GET | `/creators/:creatorId/offers` | No | Creator’s offers (public). |
| POST | `/creators/me/offers` | Yes, creator | Create offer. JSON: `title`, `durationMinutes`, `priceCents`. |
| PATCH | `/creators/me/offers/:offerId` | Yes, creator | Update offer. |
| DELETE | `/creators/me/offers/:offerId` | Yes, creator | Delete/deactivate offer. |
| POST | `/creators/me/offers/scheduled` | Yes, creator | Create scheduled offer. JSON: `date`, `startTime`, `endTime`, `duration`, `priceCents`. |
| PATCH | `/creators/me/offers/scheduled/:offerId` | Yes, creator | Update scheduled offer. |
| GET | `/creators/:creatorId/offers/scheduled` | No | Scheduled offers for creator. Query: `page`, `itemsPerPage`, `status`, `timezone`. |
| GET | `/offers/scheduled` | No | All scheduled offers. Query: `page`, `itemsPerPage`, `status`, `timezone`. |

---

### Availability (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/creators/me/settings` | Yes, creator | Set timezone. JSON: `timezone`. |
| PUT | `/creators/me/availability/weekly` | Yes, creator | Weekly availability. JSON: `effectiveFrom`, `effectiveTo`, `weekly` (dayOfWeek, ranges). |
| POST | `/creators/me/availability/one-time` | Yes, creator | One-time availability. |
| POST | `/creators/me/availability/overrides` | Yes, creator | Override (block/add). |
| GET | `/creators/:creatorId/availability` | No | Available slots. Query: `from`, `to`, `durationMinutes`, `bufferMinutes`. |

---

### Bookings (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/bookings` | Yes, fan | Create booking. JSON: `creatorId`, `offerId`, `startTime`, `meetingProvider` (optional). |
| POST | `/bookings/hold` | Yes, fan | Create hold. JSON: `creatorId`, `start`, `end`. |
| POST | `/bookings/:bookingId/confirm` | Yes, fan | Confirm after payment. JSON: `paymentProvider`, `paymentIntentId`. |
| POST | `/bookings/:bookingId/cancel` | Yes | Cancel booking. |
| GET | `/fans/me/bookings` | Yes, fan | My bookings. Query: `status`, `page`, `itemsPerPage`. |
| GET | `/creators/me/bookings` | Yes, creator | Creator bookings. Query: `status`, `page`, `itemsPerPage`. |
| GET | `/bookings/:bookingId` | No | Booking details (e.g. for payment/status page). |
| POST | `/bookings/:bookingId/start` | Yes | Start session. |
| POST | `/bookings/:bookingId/end` | Yes | End session. |

---

### Payments (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/payments/stripe-key` | No | Stripe publishable key. |
| POST | `/payments/bookings/:bookingId` | Yes, fan | Create payment intent (authorize). |
| POST | `/payments/bookings/:bookingId/capture` | Yes, creator | Capture payment. |
| POST | `/payments/bookings/:bookingId/cancel` | Yes | Cancel payment. |
| GET | `/payments/bookings/:bookingId/status` | Yes | Payment status. |

---

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/fan` | Yes, fan | totalSpent, totalSessions, rating, upcomingSessions. |
| GET | `/dashboard/creator` | Yes, creator | totalEarnings, totalSessions, rating, upcomingSessions. |

---

### Reviews (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/reviews` | Yes | Create review. JSON: `bookingId`, `rating`, `comment` (optional). |
| GET | `/reviews/me` | Yes | Reviews I wrote. |
| GET | `/reviews/about-me` | Yes | Reviews about me. |
| GET | `/users/:userId/reviews` | Yes | Reviews for user. Query: `role`, `page`, `itemsPerPage`. |
| GET | `/bookings/:bookingId/reviews` | Yes | Reviews for booking. |
| PUT | `/reviews/:reviewId` | Yes | Update review. |
| DELETE | `/reviews/:reviewId` | Yes | Delete review. |

---

### User (`/api/user`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/user/language` | Yes | JSON: `locale` (e.g. en, de). |

---

### Other

- **Upload**: `/api` upload routes (e.g. for avatars) — see `uploadRoutes.js`.
- **Chat**: `/api` chat routes.
- **Video**: `/api` video routes + webhook.
- **Blocking**: `/api` blocking routes.

---

## Response format (backend)

- Success: `{ StatusCode: 200, data: <payload>, error: null }`
- Error: `{ StatusCode: 4xx/5xx, data: null, error: "<message>" }`
- Auth: token in `data.token`, user in `data.user`.

---

## Frontend current state

- **Router**: React Router; routes: `/`, `/login`, `/signup` (default redirects to `/login`).
- **API**: `src/services/api.js` — axios instance with base URL and Bearer token; only **auth** methods: `login`, `registerFan`, `registerCreator`.
- **Login**: Does not send `role`; backend requires `role` (`"fan"` or `"creator"`).
- **Signup**: Sends `firstName`, `lastName`, `category`, `avatar`; backend expects **`userName`** for both fan and creator, and for creator optional `bio` (no firstName/lastName in signup).

---

## Aligning frontend with backend

1. **Login**: Send `role` in body (e.g. from a role selector or separate fan/creator login flows).
2. **Signup**: Use `userName` instead of firstName/lastName for both; for creator add optional `bio`; keep avatar if backend supports it via upload route.
3. **api.js**: Add functions for profile, offers, availability, bookings, payments, dashboard, reviews, user (and others as needed for each screen).

---

## Next steps (screen by screen)

You will provide Flutter designs one by one. For each screen we will:

1. Replicate layout and behavior in React.
2. Use the backend APIs above for data and actions.
3. Make the page responsive (mobile-first where it matches the app).

When you share the first screen (e.g. login, signup, fan home, creator dashboard), we can implement it and wire it to the correct endpoints.
