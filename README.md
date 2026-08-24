# Last-Mile Delivery Tracker

A logistics management platform where customers place delivery orders with auto-calculated charges, admins configure zones/rates and assign agents, and everyone gets real-time status tracking with email notifications.

**Roles:** Customer · Delivery Agent · Admin

---

## Tech Stack

**Frontend**
- React (Vite) + React Router
- Axios for API calls
- Context API for auth/JWT state
- Tailwind CSS / MUI for styling
- `@react-oauth/google` (Google Sign-In for customers)

**Backend**
- Node.js + Express.js
- MongoDB (Atlas) + Mongoose
- JWT for authentication, `bcrypt` for password hashing
- `google-auth-library` (verifying Google ID tokens)
- Nodemailer (email notifications, Gmail SMTP / SendGrid free tier)

**Deployment**
- Frontend: Vercel
- Backend: Render / Railway
- Database: MongoDB Atlas (free tier)

---

## Key Features

- **Rate Calculation Engine** — zone detection, volumetric weight, B2B/B2C rate cards, COD surcharge — fully admin-configurable, no hardcoded prices.
- **Auto-Assignment** — assigns the nearest available delivery agent by location or zone (admin can also assign manually).
- **Immutable Tracking History** — every status change is logged with timestamp + actor, never overwritten.
- **Failed Delivery Recovery** — customer is notified, picks a reschedule date, agent is reassigned.
- **Google Sign-In** — customers can register/login with Google, in addition to email/password.

---

## Setup Guide

```bash
# 1. Clone the repo
git clone <repo-url>
cd last-mile-delivery-tracker

# 2. Backend setup
cd backend
npm install
cp .env.example .env   # add your own credentials — see .env.example for required keys
npm run dev             # starts Express server

# 3. Frontend setup
cd ../frontend
npm install
cp .env.example .env   # add your own credentials — see .env.example for required keys
npm run dev             # starts React app
```

Each of `backend/` and `frontend/` includes its own `.env.example` file listing the required variable names (database URI, JWT secret, Google OAuth credentials, email service credentials, API base URL). Copy it to `.env` and fill in your own values — never commit `.env` itself.

> **Security note:** `.env` is listed in `.gitignore` and must never be committed or shared. Only `.env.example` (with placeholder names, no real values) is tracked in the repo.

---

## API Documentation (Key Endpoints)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Customer registration |
| POST | `/api/auth/login` | Public | Email/password login |
| POST | `/api/auth/google` | Public | Google Sign-In |
| POST | `/api/orders` | Customer/Admin | Create order (returns charge breakdown) |
| GET | `/api/orders/:id` | Customer/Agent/Admin | Order detail + tracking history |
| GET | `/api/orders` | Admin | All orders (filter by status/zone/agent) |
| PATCH | `/api/orders/:id/assign` | Admin | Manual or auto agent assignment |
| PATCH | `/api/orders/:id/status` | Agent/Admin | Update order status |
| POST | `/api/orders/:id/reschedule` | Customer | Reschedule after failed delivery |
| GET/POST | `/api/zones` | Admin | Zone management |
| GET/POST | `/api/rate-cards` | Admin | Rate card management |
| GET/POST | `/api/agents` | Admin | Agent management |

All protected routes require `Authorization: Bearer <JWT>`.

---

## Database Schema (Summary)

- **User** — name, email, phone, passwordHash, googleId, role (`customer`/`agent`/`admin`)
- **AgentProfile** — user ref, currentLocation, assignedZones, availabilityStatus
- **Zone** — name, areasCovered (pincodes)
- **RateCard** — orderType (B2B/B2C), rateType (intra/inter-zone), ratePerKg, minCharge, codSurcharge
- **Order** — customer, pickup/drop address & zone, dimensions, weights, orderType, paymentType, charge breakdown (snapshotted), assignedAgent, status
- **TrackingHistory** — order ref, status, actor, timestamp (append-only)
- **Notification** — order ref, customer ref, type, channel, sentAt

Full field-level schema is in `/backend/models`.

---

## Rate Calculation Logic

1. **Zone detection** — pickup and drop addresses are mapped to their configured `Zone` via `areasCovered`.
2. **Volumetric weight** — `(L × B × H) / 5000`.
3. **Billable weight** — `max(actualWeight, volumetricWeight)`.
4. **Rate lookup** — based on order type (B2B/B2C) and zone relation (intra-zone if pickup zone = drop zone, else inter-zone), the matching `RateCard.ratePerKg` is applied (respecting `minCharge`).
5. **COD surcharge** — added if `paymentType === 'COD'`.
6. **Final charge** = `(billableWeight × rate)` + COD surcharge — shown to the customer for confirmation, then **snapshotted** on the order so it never changes even if rate cards are updated later.

All rates, zones, and surcharges are stored in the database and edited by admin — nothing is hardcoded in the calculation logic.

---

## Deployment

- Frontend deployed on **Vercel**: [https://last-mile-delivery-alpha.vercel.app](https://last-mile-delivery-alpha.vercel.app)
- Backend deployed on **Render**: https://last-mile-delivery-gew9.onrender.com

---

## Out of Scope (v1)

SMS notifications, live GPS tracking, payment gateway integration, multi-language support, customer support chat, bulk order upload.
