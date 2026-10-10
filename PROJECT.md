# Project: Hanela Admin Redesign (Mobbin Luxury Minimalist + Realtime Firebase + Resend)

## Architecture
- **Framework**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + Bun runtime
- **Design System**: Mobbin-grade luxury minimalist aesthetic
  - Canvas: Cream/off-white `#FAF8F5`, Card surface `#FFFFFF`, Contrast panel `#F4EFE7`
  - Deep Espresso/Plum typography: `#261B24`, Secondary text `#6B5B65`, Muted `#9E8E98`
  - Fine borders: `#EAE5DC` (default), `#DFD8CD` (strong/input)
  - Subtle brand accent: `#a62891`, tint `#FAF1F8`
  - Minimalist tone-on-tone status badges with 6px status dots:
    - Nová: bg `#FAF1F8`, text `#a62891`, border `#ECD9E8`
    - Vo výrobe: bg `#261B24`/5%, text `#261B24`, border `#DFD8CD`
    - Pripravená: bg `#F8F4EE`, text `#6E5335`, border `#EADFCF`
    - Odovzdaná: bg `#F3F6F3`, text `#345139`, border `#DCE4DC`
    - Zrušená: bg `#FBF2F2`, text `#7A2E2E`, border `#EDD5D5`
- **Real-Time Data Layer**:
  - Firebase Firestore (project `hanela-cukraren`)
  - Collections: `orders`, `blocked_dates`, `prices`
  - Bi-directional live sync via `onSnapshot` listeners
  - Firebase Auth: Google Sign-In with popup + fallback demo mode
- **Email Infrastructure**:
  - Next.js Server Route Handler: `POST /api/send-email`
  - Resend API (3,000 emails/month free)
  - Luxury responsive HTML templates for Customer Confirmation & Bakery Owner Alert
  - Complete elimination of Google Sheets and Google Apps Script dependencies
- **Admin Modules (Strict 4 Pillars)**:
  1. `Kalendár výroby`: Monthly calendar + daily pickup schedule (11:00, 11:30, 15:00, 15:30, 16:00, 16:30), cake/sponge/cream details, allergy notes, kitchen print receipt.
  2. `Objednávky`: Real-time order list, search, filter pills, 1-click status progression, phone/email quick actions.
  3. `Kapacita dní`: 1-click day blocking with preset reasons (Plná kapacita výroby, Dovolenka majiteľky), active blocked days list with unblock button, live sync to `/rezervacia`.
  4. `Zmena cien`: Product catalog list with direct numeric price inputs, availability toggles, live sync to `/rezervacia` and `/ponuka`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Firebase Real-Time Data Services | Firestore `orders`, `blocked_dates`, `prices` collections with `onSnapshot` real-time listeners and Google Auth | M1 | ORIGINAL_REQUEST §R3 |
| F2 | Resend API Email Sending & Templates | `POST /api/send-email` route handler, luxury customer & owner HTML templates, removal of Google Sheets/webhooks | M1 | ORIGINAL_REQUEST §R4 |
| F3 | Mobbin Luxury Admin Shell & Design Tokens | Monochromatic cream/espresso palette, typography, tone-on-tone status badges, navigation bar with 4 pillars, header stats | M2 | ORIGINAL_REQUEST §R1 |
| F4 | Module 1: Kalendár výroby | Monthly calendar grid + daily pickup timeline (11:00, 11:30, 15:00, 15:30, 16:00, 16:30), item details, kitchen print receipt | M3 | ORIGINAL_REQUEST §R2.1 |
| F5 | Module 2: Objednávky | Order list, search, status filters, 1-click status transition, customer detail modal, phone/email contact links | M3 | ORIGINAL_REQUEST §R2.2 |
| F6 | Module 3: Kapacita dní | 1-click date blocking with preset reasons & unblock, instant sync to customer booking calendar | M4 | ORIGINAL_REQUEST §R2.3 |
| F7 | Module 4: Zmena cien | Product price inline editor and availability toggles with live sync to customer pages | M4 | ORIGINAL_REQUEST §R2.4 |
| F8 | Customer Reservation Integration | `/rezervacia` live Firestore order creation, Resend email dispatch, and live blocked dates/prices subscription | M4 | ORIGINAL_REQUEST §R3, §R4 |
| F9 | E2E Testing & Verification Track | Comprehensive multi-tier test suite (Tiers 1-4), adversarial hardening (Tier 5), `bun run build` 100% clean verification | M5 | ORIGINAL_REQUEST §Verification |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend, Firebase Real-Time & Resend Email Services | `orders-service.ts`, `types.ts`, `firebase.ts`, `resend.ts`, `/api/send-email`, delete Google Sheets code | none | DONE |
| M2 | Mobbin Luxury Admin Shell & Design System | Admin shell, navigation, header, stats, auth guard, typography & status badge design tokens | M1 | DONE |
| M3 | Admin Core Modules (Kalendár výroby & Objednávky) | `CalendarTab.tsx`, `OrdersTab.tsx`, `PrintReceipt.tsx`, chronological daily schedule, search/filters | M2 | DONE |
| M4 | Admin Modules (Kapacita dní & Zmena cien) + Live Customer Sync | `CapacityTab.tsx`, `PricingTab.tsx`, `/rezervacia` and `/ponuka` live sync | M3 | DONE |
| M5 | Final Milestone: E2E Test Suite Pass & Adversarial Hardening | Pass 100% E2E tests (Tiers 1-4), Tier 5 adversarial hardening, `bun run build` verification | M4, E2E Test Track | DONE |

## Verification Summary
- **Bun Test**: 179/179 pass (0 fail) across 7 suites.
- **E2E Requirements Runner**: 104/104 pass across Tiers 1-4.
- **Production Build**: `bun run build` compiled 100% cleanly with zero errors.
- **Endpoints**: `/`, `/admin/`, `/ponuka/`, `/rezervacia/`, `POST /api/send-email/` all return HTTP 200.
