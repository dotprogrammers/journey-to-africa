# 🌍 Journey to Africa — Developer Manual & Platform Documentation

**Journey to Africa** is a premium, enterprise-grade travel reservation system and content management platform (CMS) designed for luxury legacy tourism experiences in Ghana.

This guide covers architecture, setup, testing, security, API reference, and deployment.

---

## 🧭 Table of Contents

1. [Quick Start](#-quick-start)
2. [Architectural Design & Tech Stack](#%EF%B8%8F-architectural-design--tech-stack)
3. [Environment Configuration](#-environment-configuration)
4. [Database Schema & Relationships](#-database-schema--relationships)
5. [Authentication & Security](#-authentication--security)
6. [Payment Lifecycle (Paystack & Stripe)](#-payment-lifecycle-paystack--stripe)
7. [Transactional Email System](#-transactional-email-system)
8. [Invoice & PDF Generation](#-invoice--pdf-generation)
9. [Landing Page CMS](#-landing-page-cms)
10. [API Routes Reference](#-api-routes-reference)
11. [Swagger API Documentation](#-swagger-api-documentation)
12. [Testing Guide](#-testing-guide)
13. [Default Credentials & URLs](#-default-credentials--urls)
14. [Build & Deployment](#-build--deployment)
15. [Security Hardening](#-security-hardening)

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd journey-to-africa-vercel

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database URL and secrets (see Environment Configuration below)

# 4. Start MySQL and create the database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS journey_to_africa;"

# 5. Push the schema to the database
npx prisma db push

# 6. Generate the Prisma client
npx prisma generate

# 7. Seed the database with default data
npx prisma db seed

# 8. Start the development server
npm run dev
```

The application is now running at **http://localhost:3000**.

---

## 🏗️ Architectural Design & Tech Stack

### Core Technologies

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.x |
| **Language** | TypeScript | 5.x |
| **Database** | MySQL + Prisma ORM | 6.x |
| **Auth** | NextAuth.js (JWT) | 4.x |
| **UI** | Tailwind CSS + Radix UI (Shadcn) | 4.x |
| **State** | Tanstack Query + Zustand | 5.x |
| **Payments** | Paystack + Stripe | — |
| **Email** | Nodemailer (SMTP) | 7.x |
| **Encryption** | AES-256-CBC (Node crypto) | — |
| **PDF** | PDFKit | 0.18.x |
| **API Docs** | Swagger UI + swagger-jsdoc | 5.x |

### Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema (20 models)
│   └── seed.ts                # Database seeder
├── src/
│   ├── app/
│   │   ├── admin/             # Admin panel pages
│   │   ├── api/               # API route handlers
│   │   │   ├── auth/          # Authentication (NextAuth, register, password reset)
│   │   │   ├── admin/         # Admin-protected endpoints
│   │   │   ├── bookings/      # Booking CRUD
│   │   │   ├── payments/      # Payment gateway abstraction
│   │   │   ├── paystack/      # Paystack integration
│   │   │   ├── stripe/        # Stripe integration
│   │   │   ├── invoices/      # Invoice & PDF
│   │   │   ├── cms/           # CMS content APIs
│   │   │   └── health/        # Health check endpoint
│   │   ├── booking/           # Public booking page
│   │   ├── booking-confirmation/
│   │   ├── my-bookings/
│   │   ├── error.tsx          # Global error boundary
│   │   └── not-found.tsx      # Global 404 page
│   ├── components/
│   │   ├── admin/             # Admin-specific components
│   │   ├── sections/          # Landing page sections
│   │   └── ui/                # Shadcn UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── api-auth.ts        # Auth helpers (requireAuth, requireAdmin)
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── cloudinary.ts      # Cloudinary file uploads
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── email.ts           # Email service (Nodemailer)
│   │   ├── encryption.ts      # AES-256-CBC encrypt/decrypt
│   │   ├── invoice.ts         # PDF generation
│   │   ├── paystack.ts        # Paystack API client
│   │   ├── rate-limit.ts      # In-memory rate limiter
│   │   ├── stripe.ts          # Stripe API client
│   │   └── utils.ts           # Utility functions
│   ├── middleware.ts           # Next.js middleware (admin route protection)
│   └── types/                 # TypeScript type definitions
├── next.config.mjs            # Next.js config (security headers, CORS)
├── package.json
└── tsconfig.json
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Required Variables

```bash
# Database (REQUIRED)
DATABASE_URL="mysql://user:password@localhost:3306/journey_to_africa"

# NextAuth (REQUIRED — generate a strong secret)
NEXTAUTH_SECRET=    # Generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Encryption (REQUIRED — must be exactly 32 bytes)
ENCRYPTION_KEY=     # Generate: openssl rand -base64 24
```

### Optional Variables (can be set via Admin Panel → API Keys)

```bash
# Paystack
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# SMTP Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@journeytoafrica.com
```

### App URLs

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **⚠️ Security**: Never commit `.env` to version control. The `.env` file is already in `.gitignore`. For production, set these as environment variables in your hosting platform (Vercel, etc.).

---

## 📊 Database Schema & Relationships

The application uses MySQL with 20 Prisma models. Schema is defined in `prisma/schema.prisma`.

### Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ bookings : "creates"
    users ||--o{ payments : "makes"
    users ||--o{ invoices : "receives"
    users ||--o{ activityLogs : "generates"
    admin_users ||--o{ activityLogs : "generates"
    admin_users ||--o{ adminIpWhitelists : "has"
    pricing_tiers ||--o{ bookings : "applies to"
    bookings ||--o{ booking_travelers : "includes"
    bookings ||--o{ payments : "bills"
    bookings ||--o{ invoices : "triggers"
    bookings ||--o{ emailLogs : "receives"
    sections ||--o{ section_items : "contains"
    navigation_links ||--o{ navigation_links : "parent"
    email_templates ||--o{ email_logs : "records"
    system_configurations ||--o{} : "stores secrets"
    password_reset_tokens ||--o{} : "OTP tokens"
```

### Key Models

| Model | Purpose |
|-------|---------|
| `User` | Customer accounts with bookings, payments, invoices |
| `AdminUser` | Admin accounts with hashed passwords, roles (super_admin/admin) |
| `AdminIpWhitelist` | IP-based access control for admin accounts |
| `Booking` | Travel reservations with status tracking |
| `BookingTraveler` | Individual traveler details per booking |
| `Payment` | Payment transactions (Paystack/Stripe) |
| `Invoice` | Billing records with PDF generation |
| `PricingTier` | Travel packages with capacity management |
| `Section` / `SectionItem` | Landing page CMS content |
| `NavigationLink` | Header/footer menu items |
| `EmailTemplate` / `EmailLog` | Email templates and delivery audit trail |
| `SystemConfiguration` | Encrypted API keys and settings |
| `PasswordResetToken` | OTP tokens for password reset |
| `ActivityLog` | Admin action audit trail |
| `StripeWebhook` / `PaystackWebhook` | Webhook event deduplication |
| `MediaFile` | Uploaded file records |
| `SiteSetting` | Site configuration key-value pairs |

---

## 🔐 Authentication & Security

### Authentication Flow

```
[Login Page] → [NextAuth Credentials Provider]
       │
       ├── Check AdminUser table first (admin login)
       │     ├── Verify bcrypt password hash
       │     ├── Check IP whitelist (if configured)
       │     └── Log activity + return JWT session
       │
       └── Fall back to User table (customer login)
             ├── Verify bcrypt password hash
             └── Return JWT session
```

### Security Features

| Feature | Implementation |
|---------|---------------|
| **JWT Sessions** | 24-hour expiry, signed with `NEXTAUTH_SECRET` |
| **Password Hashing** | bcrypt with 12 rounds |
| **IP Whitelisting** | Optional per-admin IP restriction |
| **Rate Limiting** | In-memory sliding window on all sensitive endpoints |
| **Input Validation** | Zod schemas on all mutation endpoints |
| **Encryption** | AES-256-CBC for API keys stored in database |
| **Security Headers** | CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| **CORS** | Configured for API routes |
| **Error Boundaries** | Global and admin-specific error pages |
| **Webhook Verification** | HMAC signature validation (Paystack/Stripe) |

### Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/register` | 5 requests/IP | 15 minutes |
| `POST /api/auth/forgot-password` | 5 requests/IP | 15 minutes |
| `POST /api/auth/resend-otp` | 5 requests/IP | 15 minutes |
| `POST /api/bookings` | 10 requests/IP | 1 hour |
| `POST /api/payments/initialize` | 10 requests/IP | 1 hour |
| `POST /api/paystack/initialize` | 10 requests/IP | 1 hour |
| `POST /api/stripe/initialize` | 10 requests/IP | 1 hour |
| `GET /api/payments/config` | 30 requests/IP | 1 minute |

---

## 💳 Payment Lifecycle (Paystack & Stripe)

### Payment Flow

```
[Customer Books] → [POST /api/payments/initialize]
       │
       ├── Creates Payment record (status: "initialized")
       ├── Creates Booking record (status: "pending")
       │
       ├── Paystack → /api/paystack/initialize → Returns authorization_url
       └── Stripe   → /api/stripe/initialize   → Returns session.url
       │
       ▼
[Customer Redirected to Payment Gateway]
       │
       ▼
[Payment Gateway Webhook]
       │
       ├── /api/paystack/webhook  → HMAC signature verification
       └── /api/stripe/webhook    → Stripe signature verification
       │
       ├── Deduplication check ( eventId unique constraint )
       │
       ▼
[Process Payment]
       ├── Update Payment status → "success"
       ├── Update Booking status → "paid"
       ├── Decrement PricingTier capacity
       ├── Generate Invoice + PDF
       └── Send confirmation email
```

### Dev Mode Simulation

In development (when `NODE_ENV=development` and no `PAYSTACK_SECRET_KEY` is set), the Paystack verify endpoint simulates a successful payment for testing. **This is disabled in production.**

---

## 📧 Transactional Email System

### Email Engine

- **Transport**: Nodemailer with SMTP (configurable via admin panel or `.env`)
- **Templates**: Stored in `email_templates` table with `{{variable}}` placeholders
- **Delivery Logging**: All emails logged to `email_logs` table with status tracking
- **Dev Mode**: When no SMTP host is configured, emails are logged to console

### Email Templates

| Template Slug | Trigger |
|---------------|---------|
| `booking_received` | New booking created |
| `booking_confirmed` | Booking confirmed by admin |
| `payment_successful` | Payment verified successfully |
| `booking_completed_with_invoice` | Booking marked completed |
| `booking_cancelled` | Booking cancelled |
| `booking_status_changed` | Any status change |

### Placeholder Variables

Templates use `{{variable}}` syntax:
- `{{name}}` — Customer name
- `{{bookingReference}}` — Booking reference code
- `{{tierName}}` — Pricing tier name
- `{{totalAmount}}` — Total amount
- `{{currency}}` — Currency code
- `{{paymentReference}}` — Payment gateway reference

---

## 📄 Invoice & PDF Generation

1. When a booking is marked "completed", an invoice is automatically generated
2. Invoice data is stored in the `invoices` table with line items as JSON
3. PDF is generated on-the-fly using PDFKit when downloaded
4. Users can download via `GET /api/invoices/[id]?download=true`
5. Admins can resend invoice emails via the admin panel

---

## 🎛️ Landing Page CMS

The homepage is modular, built from database-driven sections.

### Available Sections

| Section Slug | Component | Description |
|-------------|-----------|-------------|
| `hero` | HeroSection | Main hero banner |
| `philosophy` | PhilosophySection | Brand philosophy |
| `pillars` | PillarsSection | Core pillars |
| `experience` | ExperienceSection | Travel experience highlights |
| `gallery` | GallerySection | Photo gallery |
| `inclusions` | InclusionsSection | What's included |
| `pricing` | PricingSection | Pricing tiers display |
| `stats` | StatsSection | Statistics counters |
| `reserve` | ReserveSection | CTA reservation section |
| `not_included` | NotIncludedSection | What's not included |
| `who` | WhoSection | Target audience |
| `host` | HostSection | Host introduction |
| `editorial` | EditorialSection | Editorial content |
| `testimonials` | TestimonialsSection | Customer reviews |
| `footer` | FooterSection | Footer content |

### Admin CMS Features

- Toggle section visibility (`isActive`)
- Drag-and-drop reordering (updates `sortOrder`)
- Edit texts, images, CTAs, and items in real-time
- Changes reflect immediately (no-cache API routes)

---

## 🔌 API Routes Reference

### Public Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Health check (DB connectivity) |
| `/api/site-settings` | GET | Site settings grouped by category |
| `/api/pricing-tiers` | GET | Active pricing tiers with availability |
| `/api/navigation` | GET | Navigation menu links |
| `/api/cms/[slug]` | GET | CMS content by section slug |
| `/api/cms/blocks` | GET | All visible CMS blocks |
| `/api/cms/features` | GET | Features, pillars, inclusions |
| `/api/cms/trips` | GET | Trips and pricing data |
| `/api/cms/settings` | GET | Settings as key-value map |
| `/api/bookings` | POST | Create a new booking |
| `/api/payments/config` | GET | Active payment gateway config |
| `/api/paystack/verify/[ref]` | GET | Verify Paystack transaction |
| `/api/stripe/verify/[sessionId]` | GET | Verify Stripe session |

### Admin Routes (require authentication)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/stats` | GET | Dashboard statistics |
| `/api/admin/bookings` | GET | List all bookings |
| `/api/admin/bookings/[id]` | GET/PUT | Booking detail & status update |
| `/api/admin/admins` | GET/POST | List/create administrators |
| `/api/admin/admins/[id]` | PUT/DELETE | Update/delete administrator |
| `/api/admin/admins/[id]/ips` | GET/POST | IP whitelist management |
| `/api/admin/admins/[id]/ips/[ipId]` | PUT/DELETE | Toggle/remove IP |
| `/api/admin/admins/[id]/activity-logs` | GET | Admin activity logs |
| `/api/admin/users` | GET | List customers |
| `/api/admin/users/[id]` | PUT | Update customer |
| `/api/admin/payments` | GET | List all payments |
| `/api/admin/invoices` | GET | List invoices + resend |
| `/api/admin/sections` | GET/POST | Section management |
| `/api/admin/sections/[id]` | GET/PUT/DELETE | Section CRUD |
| `/api/admin/settings` | GET/PUT | Site settings |
| `/api/admin/settings/configs` | GET/POST/DELETE | Encrypted API key management |
| `/api/admin/emails` | GET | Email templates |
| `/api/admin/emails/[id]` | PUT | Update email template |
| `/api/admin/media` | GET/POST | Media file management |
| `/api/admin/media/[id]` | PUT/DELETE | Media file CRUD |
| `/api/admin/profile` | GET/PUT | Admin profile |
| `/api/admin/profile/password` | PUT | Change admin password |

### Webhook Routes (external services)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/paystack/webhook` | POST | Paystack webhook receiver |
| `/api/stripe/webhook` | POST | Stripe webhook receiver |

---

## 📖 Swagger API Documentation

Interactive API documentation is available at:

**http://localhost:3000/api-docs**

### How It Works

- `src/lib/swagger.ts` uses `swagger-jsdoc` to scan all API route files for JSDoc annotations
- The OpenAPI 3.0 spec is generated at build time
- `src/app/api-docs/page.tsx` renders the Swagger UI with the generated spec
- API routes with `@openapi` JSDoc comments are automatically documented

### Adding Documentation to an API Route

```typescript
/**
 * @openapi
 * /api/your-endpoint:
 *   get:
 *     tags:
 *       - Your Tag
 *     summary: Short description
 *     description: Longer description
 *     responses:
 *       200:
 *         description: Success response
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  // ...
}
```

---

## 🧪 Testing Guide

### Prerequisites

Ensure MySQL is running locally and the database is set up:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS journey_to_africa;"
npx prisma db push
npx prisma generate
npx prisma db seed
npm run dev
```

### 1. Smoke Test — Basic Pages

Open in browser and verify each loads:

| URL | Expected |
|-----|----------|
| `http://localhost:3000` | Landing page with hero, sections |
| `http://localhost:3000/booking` | Booking form with pricing tiers |
| `http://localhost:3000/admin/login` | Admin login page |
| `http://localhost:3000/api/health` | `{"status":"ok","service":"journey-to-africa"}` |
| `http://localhost:3000/api-docs` | Swagger UI documentation |

### 2. Authentication Testing

#### Admin Login
```
1. Go to http://localhost:3000/admin/login
2. Login: super_admin@journeytoafrica.com / admin123
3. Verify: Dashboard loads with stats
4. Verify: API Keys page visible (super_admin only)
5. Logout → Login: admin@journeytoafrica.com / admin123
6. Verify: API Keys page NOT visible (regular admin)
```

#### Password Reset Flow
```
1. Go to http://localhost:3000/admin/forgot-password
2. Enter: super_admin@journeytoafrica.com
3. Check server console for OTP (dev mode prints to console)
4. Enter the 6-digit OTP
5. Set new password: Admin123! (8+ chars, uppercase, lowercase, number)
6. Login with new password → verify it works
```

### 3. Rate Limiting Tests

Run in terminal — should get 429 after 5 attempts:

```bash
# Registration rate limit
for i in {1..7}; do
  echo "Attempt $i:"
  curl -s -o /dev/null -w "  HTTP %{http_code}\n" \
    -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"rate'${i}'@test.com","password":"Test1234"}'
done
```

Expected: First 5 return `201` or `409`, attempts 6-7 return `429`.

```bash
# Forgot password rate limit
for i in {1..7}; do
  echo "Attempt $i:"
  curl -s -o /dev/null -w "  HTTP %{http_code}\n" \
    -X POST http://localhost:3000/api/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email":"super_admin@journeytoafrica.com"}'
done
```

### 4. Security Header Tests

```bash
# Verify all security headers are present
curl -s -I http://localhost:3000 | grep -iE \
  "x-frame-options|x-content-type|strict-transport|content-security-policy|x-xss-protection|permissions-policy"
```

Expected: All headers should be present. `X-Powered-By` should NOT appear.

### 5. Authentication Required Tests

```bash
# Payment endpoint without auth → should return 401
curl -s -X POST http://localhost:3000/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"test","gateway":"paystack"}' | python3 -m json.tool

# Expected: {"success":false,"error":"Authentication required"} with HTTP 401
```

### 6. Error Format Consistency Tests

```bash
# All error responses should use {success: false, error: "..."}
curl -s http://localhost:3000/api/admin/bookings | python3 -m json.tool
curl -s http://localhost:3000/api/paystack/verify/INVALID_REF | python3 -m json.tool
```

### 7. Type Safety Verification

```bash
# Should return ZERO results
rg "as any" src/ --include "*.ts" --include "*.tsx" -n
rg ": any" src/ --include "*.ts" --include "*.tsx" -n
```

### 8. Build Verification

```bash
npx prisma generate
npm run build
# Should output "Compiled successfully" with no TypeScript errors
```

### 9. Admin Panel Functional Tests

```
□ Dashboard loads with booking/user/revenue stats
□ Bookings list loads with status badges
□ Click booking → detail view with travelers, payments, emails
□ Update booking status (confirmed, completed, cancelled)
□ Users tab → customer list loads with search
□ Toggle customer active/inactive status
□ Admins tab → admin list with role badges
□ Click admin → detail dialog with overview/activity/IP tabs
□ Sections → drag-and-drop reordering works
□ Media → upload image, verify Cloudinary or local storage
□ Email Templates → preview renders, edit saves
□ Site Settings → edit and save changes
□ API Keys → add/edit/delete encrypted keys
□ Profile → update name, change password
```

### 10. Booking Flow End-to-End Test

```
□ Go to /booking → pricing tiers load
□ Select a tier → form shows traveler fields
□ Fill in details → submit → redirected to confirmation
□ Confirmation page shows booking reference
□ If payment gateway configured → redirect to payment
□ After payment → booking status updates to "paid"
□ Admin sees new booking in /admin/bookings
□ Admin marks booking → "completed" → invoice generated
□ User can download invoice PDF from /my-bookings
```

---

## 🔑 Default Credentials & URLs

### Local Development URLs

| URL | Description |
|-----|-------------|
| [http://localhost:3000](http://localhost:3000) | Public landing page |
| [http://localhost:3000/admin/login](http://localhost:3000/admin/login) | Admin login |
| [http://localhost:3000/api-docs](http://localhost:3000/api-docs) | Swagger API docs |
| [http://localhost:3000/api/health](http://localhost:3000/api/health) | Health check |
| [http://localhost:5555](http://localhost:5555) | Prisma Studio (`npx prisma studio`) |

### Default Admin Accounts

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | `super_admin@journeytoafrica.com` | `admin123` |
| **Admin** | `admin@journeytoafrica.com` | `admin123` |

> **⚠️ Change these passwords immediately in production.**

---

## 🚀 Build & Deployment

### Local Development

```bash
npm run dev          # Start dev server with hot reload
```

### Production Build

```bash
# 1. Generate Prisma client (ALWAYS do this before building)
npx prisma generate

# 2. Build the application
npm run build

# 3. Start the production server
npm run start
```

### Database Commands

```bash
npx prisma db push     # Push schema changes to database
npx prisma generate    # Regenerate Prisma client
npx prisma db seed     # Seed database with default data
npx prisma db reset    # Reset database and re-seed
npx prisma studio      # Open database GUI at localhost:5555
```

### Vercel Deployment

1. Push code to GitHub/GitLab
2. Import project in Vercel dashboard
3. Set environment variables in Vercel project settings
4. Deploy — Vercel auto-detects Next.js

**Required Vercel Environment Variables:**
```
DATABASE_URL=mysql://...
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
ENCRYPTION_KEY=<generate with: openssl rand -base64 24>
```

**Post-Deployment:**
```bash
# Run against production database
npx prisma db push
npx prisma db seed
```

### Pre-Deployment Checklist

```bash
# 1. Generate production secrets
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "ENCRYPTION_KEY=$(openssl rand -base64 24)"

# 2. Ensure .env is not tracked by git
git rm --cached .env

# 3. Verify no hardcoded secrets
rg "admin123" src/ --include "*.ts" --include "*.tsx"
rg "lCol" src/ --include "*.ts" --include "*.tsx"

# 4. Run type safety check
rg "as any" src/ --include "*.ts" --include "*.tsx" -n
rg ": any" src/ --include "*.ts" --include "*.tsx" -n

# 5. Build and test
npx prisma generate
npm run build
npm run start
# Then run through the Testing Guide above
```

---

## 🛡️ Security Hardening

### What's Protected

| Area | Protection |
|------|-----------|
| **Authentication** | JWT with 24h expiry, bcrypt password hashing (12 rounds) |
| **Authorization** | Role-based access (super_admin, admin, user), IP whitelisting |
| **Rate Limiting** | In-memory sliding window on all sensitive endpoints |
| **Input Validation** | Zod schemas on all mutation endpoints |
| **Output Sanitization** | HTML escaping in email templates |
| **Encryption** | AES-256-CBC for API keys at rest in database |
| **Security Headers** | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, XSS Protection |
| **CORS** | Configured for API routes |
| **Webhook Security** | HMAC signature verification (Paystack SHA-512, Stripe signatures) |
| **Error Handling** | Consistent error format, no internal details leaked |
| **Payment Safety** | Dev simulation gated behind NODE_ENV, auth required for payment init |
| **Database** | Connection pooling, no raw SQL queries |

### Security Headers (set in next.config.mjs)

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; ...
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-DNS-Prefetch-Control: on
```

---

## 📝 NPM Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start development server |
| `build` | `next build` | Build production bundle |
| `start` | `next start` | Start production server |
| `lint` | `eslint .` | Run ESLint |
| `db:push` | `prisma db push` | Push schema to database |
| `db:generate` | `prisma generate` | Regenerate Prisma client |
| `db:migrate` | `prisma migrate dev` | Create and run migrations |
| `db:reset` | `prisma migrate reset` | Reset database |
| `db:seed` | `prisma db seed` | Seed database |

---

## 📄 License

Private — Journey to Africa. All rights reserved.
