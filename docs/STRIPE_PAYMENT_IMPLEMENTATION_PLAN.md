# Stripe Payment Implementation Plan – FanMeet React Web App

## 1. Objective

Integrate Stripe payment into the **fanmeet_frontend** React web application so that when a fan clicks **“Book now”** on an offer:

1. A payment screen opens where the fan can enter **card details** and see the **offer price**.
2. The payment UI is **Stripe-based** (secure, PCI-compliant) and **visually aligned** with the application theme.
3. When the fan clicks **Pay**, the amount is **authorized** (and, per backend design, **captured** when the creator ends the session).
4. **No changes** are made to existing backend payment APIs; the React app will only consume them.

---

## 2. Backend APIs Used (No Modifications)

The following existing endpoints will be used as-is:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| **GET** | `/api/payments/stripe-key` | No | Returns `publishableKey` for initializing Stripe.js on the frontend. |
| **POST** | `/api/payments/bookings/:bookingId` | Yes (Bearer), role: **fan** | Creates a PaymentIntent for the booking (manual capture). Returns `clientSecret`, `paymentIntentId`, `amountCents`, `currency`, `bookingId`, `status`, etc. Booking must be in `pending_payment`. |
| **GET** | `/api/payments/bookings/:bookingId/status` | Yes (Bearer) | Returns current payment status; can be used after confirmation to sync booking status. |

**Backend behavior (for context):**

- **Create payment** (`POST .../payments/bookings/:bookingId`): Creates a Stripe PaymentIntent with **manual capture**. The backend stores the payment and updates the booking to `paid` once the PaymentIntent is in a confirmable/confirmed state (e.g. `requires_capture`).
- **Capture**: The actual charge (capture) is performed by the backend when the **creator ends the session** (existing flow). The React app only needs to **confirm** the payment (attach card and authorize); it does **not** call any capture endpoint.

**Important:** If in the future you want the amount to be **charged immediately** when the fan clicks Pay (instead of captured at session end), that would require a backend change (e.g. automatic capture or a new flow). This plan uses the current backend behavior only.

---

## 3. Current Frontend Flow (To Change)

**Current behavior** (`FanCreatorOffers.js`):

1. Fan clicks **“Book now”** on an offer.
2. Frontend calls `bookingAPI.createBooking({ creatorId, offerId, startTime })`.
3. Frontend then calls `bookingAPI.confirmBooking(bookingId, { paymentProvider: 'stripe', paymentIntentId: 'test_skip_payment' })` (bypasses real payment).
4. Navigate to `/fan/bookings`.

**Problem:** No real Stripe payment; card details are never collected.

---

## 4. New Flow (After Implementation)

1. Fan clicks **“Book now”** on an offer.
2. **Create booking**  
   Call `bookingAPI.createBooking({ creatorId, offerId, startTime })`.  
   Backend returns a booking in status `pending_payment` with `id` (e.g. `booking_<mongoId>`).
3. **Create payment intent**  
   Call new `paymentAPI.createPayment(bookingId)`, which calls `POST /api/payments/bookings/:bookingId`.  
   Backend returns `clientSecret`, `amountCents`, `currency`, `bookingId`, etc.
4. **Show Stripe payment UI**  
   - Open a **payment step/modal/page** (e.g. route `/fan/bookings/:bookingId/pay` or a modal on the same page).  
   - Display the **offer summary** (date, time, duration, **price** from `amountCents` / `currency`).  
   - Load Stripe.js with `publishableKey` from `GET /api/payments/stripe-key`.  
   - Mount **Stripe Elements** (e.g. Payment Element or Card Element) so the fan can enter card details in a Stripe-hosted, PCI-compliant way.  
   - Apply **Stripe appearance options** so colors/fonts match the app theme (dark background, accent yellow/gold, etc.).
5. **Fan clicks Pay**  
   - Call `stripe.confirmPayment({ elements, clientSecret, confirmParams: { return_url, receipt_email?, ... } })` (or equivalent for Card Element).  
   - Stripe validates the card and **confirms** the PaymentIntent (authorization only; capture remains on backend when session ends).
6. **After successful confirmation**  
   - Optionally call `GET /api/payments/bookings/:bookingId/status` to ensure booking status is `paid`.  
   - Show a short success message, then **navigate** to `/fan/bookings` (or booking detail).
7. **Error handling**  
   - If create booking fails: show error, leave fan on offers list.  
   - If create payment fails: show error, optionally allow retry or cancel.  
   - If Stripe confirmation fails: show Stripe error message, keep user on payment screen to correct card or try again.

---

## 5. Implementation Steps (High Level)

### 5.1 Dependencies

- Add **`@stripe/stripe-js`** and **`@stripe/react-stripe-js`** to the React app (recommended for loading Stripe.js and wrapping the payment form in `<Elements>`).
- No backend dependency changes.

### 5.2 Environment

- Ensure the frontend can reach the backend API (e.g. `REACT_APP_API_URL`).  
- The **Stripe publishable key** is fetched at runtime from `GET /api/payments/stripe-key`; no need to put the key in the frontend env unless you want a fallback.

### 5.3 API Service (`src/services/api.js`)

- Add a **payment API** object that:
  - **getStripePublishableKey()**  
    `GET /api/payments/stripe-key` → returns `{ publishableKey }` (from `res.data`).
  - **createPayment(bookingId)**  
    `POST /api/payments/bookings/:bookingId` (with auth) → returns `clientSecret`, `amountCents`, `currency`, `bookingId`, etc. (from `res.data`).
  - **getPaymentStatus(bookingId)**  
    `GET /api/payments/bookings/:bookingId/status` (with auth) → returns payment and booking status.
- Use the same axios instance (Bearer token) and the same response shape (`StatusCode`, `data`, `error`) as the rest of the app.

### 5.4 Stripe Provider and Key Loading

- At app or route level, fetch the publishable key once (e.g. on first visit to payment or on app load) and store it in state or context.
- Wrap the payment UI in **`<Elements stripe={loadStripe(publishableKey)} options={{...}}>`**.
- Pass **appearance** (and optionally **locale**) in `options` so the Stripe form matches the app theme (see section 6).

### 5.5 Payment UI (Stripe form + offer summary)

- **Option A – Dedicated route (recommended):**  
  e.g. `/fan/creators/:creatorId/offers` → on “Book now” navigate to `/fan/bookings/:bookingId/pay`.  
  Payment page responsibilities:
  - Read `bookingId` from the URL.
  - If needed, fetch booking details (or use data passed via state/location) to show offer summary.
  - Call `paymentAPI.createPayment(bookingId)` to get `clientSecret` (and amount, currency). If booking is not `pending_payment`, show an error.
  - Render **Payment Element** (or Card Element) with `clientSecret` and **appearance** set from theme (section 6).
  - Show **price** clearly (e.g. “Total: 75,00 EUR” from `amountCents` and `currency`).
  - Submit via `stripe.confirmPayment(...)` with a **return_url** pointing back to the app (e.g. `/fan/bookings` or a success page).
- **Option B – Modal:**  
  Same flow, but open a modal instead of navigating; after success, close modal and navigate to `/fan/bookings`.

### 5.6 “Book now” in `FanCreatorOffers.js`

- Remove the fake `confirmBooking(..., 'test_skip_payment')` call.
- After `createBooking` succeeds:
  - Navigate to the new payment route with `bookingId` (e.g. `navigate(\`/fan/bookings/${createRes.data.id}/pay\`)`) **or**
  - Open the payment modal and pass `bookingId` and offer summary (e.g. from `createRes.data`).
- Ensure loading and error states are handled (e.g. “Booking…” while creating booking, then redirect to payment or show error).

### 5.7 Success and Return URL

- **return_url**: Use a URL in your app (e.g. `window.location.origin + '/fan/bookings'` or a dedicated `/fan/bookings/:bookingId/success`). Stripe will redirect here after confirmation; you can detect success/failure via query params Stripe appends (e.g. `payment_intent_client_secret`, `redirect_status`) and show a message or redirect again if needed.
- After successful payment, optionally call `getPaymentStatus(bookingId)` and then navigate to the list or detail of bookings.

### 5.8 Theming (Stripe appearance)

- Use Stripe **Elements appearance** options so the payment form matches the app:
  - **Theme:** `night` or `flat` with custom variables.
  - **Variables:**  
    Map app CSS variables to Stripe, e.g.  
    `--primary-color` / `--bg-primary` → background,  
    `--secondary-color` (e.g. #F4C046) → accent (focus, buttons),  
    `--text-primary` / `--white` → text,  
    `--dark-blue-shade-3` → secondary background for inputs/cards.
  - **Rules:** Adjust border radius, font family (`var(--font-sans)` if you expose it), etc., so the form feels consistent with `CreatorOffers.css` and `theme.css`.

This keeps the “payment page” feeling like part of the same app while card input remains fully on Stripe (PCI-compliant).

---

## 6. Stripe Appearance (Theme Match)

Application theme (from `src/styles/theme.css`):

- **Background:** `--bg-primary` (#0F1115), **Cards/surfaces:** `--bg-secondary` (#1C1F26).
- **Accent / buttons:** `--secondary-color` (#F4C046).
- **Text:** `--text-primary` (#FFFFFF), **Secondary text:** `--text-secondary` / `--dark-grey-text`.
- **Inputs:** `--input-background` (#16191F), **Borders:** e.g. `--border-input` / `--outline-input-border`.
- **Focus ring:** `--focus-ring` (e.g. rgba(244, 192, 70, 0.35)).
- **Font:** `var(--font-sans)`.

Stripe Elements **appearance** object (conceptual):

- `theme: 'night'` (or custom).
- `variables`:  
  `primaryColor`, `backgroundColor`, `textPrimaryColor`, `textSecondaryColor`, `borderRadius`, `fontFamily`, etc., set from the CSS variables above so the Stripe form matches the dark, yellow-accent FanMeet look.

---

## 7. Capture Behavior (Clarification)

- **On “Pay” click:** The frontend only **confirms** the PaymentIntent (card is authorized; funds are held). No capture is called from the React app.
- **Actual charge (capture):** Done by the **backend** when the creator **ends the session** (existing logic in `bookingController` / payment controller). So the “deduct and capture” from the user’s card is split: **authorize** at pay time in the web app, **capture** at session end on the server.
- If you later want **immediate capture** (charge as soon as the fan pays), that would require a backend change (e.g. switching to automatic capture or calling capture right after create); this plan does not modify the backend.

---

## 8. File and Route Summary

| Item | Action |
|------|--------|
| `package.json` (frontend) | Add `@stripe/stripe-js`, `@stripe/react-stripe-js`. |
| `src/services/api.js` | Add `paymentAPI` with `getStripePublishableKey`, `createPayment`, `getPaymentStatus`. |
| New payment page/component | e.g. `src/pages/FanBookingPayment.js` (and `FanBookingPayment.css` if needed). |
| New route | e.g. `/fan/bookings/:bookingId/pay` → `FanBookingPayment`. |
| `src/App.js` (or router config) | Register the new route. |
| `FanCreatorOffers.js` | After successful `createBooking`, navigate to payment route (or open modal) and remove `confirmBooking` with `test_skip_payment`. |
| Theme | Use existing `theme.css` variables when building the Stripe `appearance` object. |

---

## 9. Testing Checklist

- [ ] Fan can click “Book now” and is taken to the payment screen (or modal) with the correct offer price.
- [ ] Stripe publishable key is loaded from the backend; Stripe form loads without errors.
- [ ] Card input is displayed and styled according to app theme (dark background, accent color).
- [ ] Invalid card shows Stripe error; valid card completes confirmation and redirects/updates UI.
- [ ] After success, booking appears in “My bookings” with status consistent with backend (e.g. `paid`).
- [ ] No backend API changes; all calls use existing endpoints and response shapes.
- [ ] Capture still happens when the creator ends the session (backend flow unchanged).

---

## 10. Summary

- **Backend:** Use existing payment APIs only; no changes.
- **Frontend:** Add Stripe.js + React Stripe, payment API in `api.js`, a dedicated payment page/modal with Stripe Elements and themed appearance, and update “Book now” to create booking then open payment; on success, redirect to bookings.
- **User experience:** Fan sees offer price, enters card on a Stripe form that matches the app theme; on Pay, the amount is authorized and will be captured when the creator ends the session.

Once you approve this plan, implementation can proceed step by step as described above.
