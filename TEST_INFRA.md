# Test Infrastructure & Architecture Specification — Hanela E2E Test Suite

## 1. Overview
The Hanela E2E Test Suite provides an exhaustive, requirement-driven, opaque-box test framework for the Hanela artisan confectionery platform. It verifies user-facing contracts, real-time Firestore synchronization, Resend transactional email payloads, Mobbin-standard admin workflows, calendar production timelines, date capacity blocking, product catalog pricing overrides, and customer reservation flows.

## 2. Test Framework & Runtime
- **Runtime**: Bun v1.4.2 (Native high-performance TypeScript execution engine)
- **Test Runner**: `bun test` (`bun:test` native test runner module)
- **Execution Speed**: Sub-second full suite execution (< 500ms for 104+ test cases)
- **Isolation Level**: Complete in-memory state isolation per test case; zero global state leaks or execution order dependencies.

## 3. Directory Layout & Organization
```
tests/e2e/
├── harness.ts                       # Shared test harness, mock stores, domain contracts, validation logic
├── tier1-feature-coverage.test.ts   # Tier 1: 45 feature coverage tests (5 tests × 9 features F1-F9)
├── tier2-boundary-corner.test.ts    # Tier 2: 45 boundary & corner case tests (5 tests × 9 features F1-F9)
├── tier3-interactions.test.ts       # Tier 3: 9 pairwise cross-feature interaction tests
├── tier4-scenarios.test.ts          # Tier 4: 5 realistic real-world bakery ordering & admin workflows
└── runner.ts                        # Standalone execution script with formatted terminal reporting
```

## 4. Systematic 4-Tier Test Architecture

### Tier 1: Feature Coverage (>= 45 tests)
Verifies the core happy path behavior and contract requirements for all 9 project features:
- **F1: Firebase Real-Time Data Services** (5 tests): Order subscription, order persistence, status transitions, blocked dates subscription, price override subscription.
- **F2: Resend API Email Sending & Templates** (5 tests): Endpoint dispatch, customer HTML rendering, owner alert template, legacy webhook removal, environment configuration.
- **F3: Mobbin Luxury Admin Shell & Design Tokens** (5 tests): 4 navigation pillars, status badge colors & dots, daily pickups calculation, revenue calculation, auth guard.
- **F4: Module 1: Kalendár výroby** (5 tests): Date grouping, chronological slot sorting, standard pickup slots, cake customization extraction, kitchen print receipt formatting.
- **F5: Module 2: Objednávky** (5 tests): Name search, order number search, status filter pills, 1-click status progression, contact URI generation.
- **F6: Module 3: Kapacita dní** (5 tests): Preset reason blocking, preset chip definitions, `isDateBlocked` evaluation, unblocking, createdAt timestamps.
- **F7: Module 4: Zmena cien** (5 tests): Effective price resolution, default catalog fallback, availability toggles, cake size overrides, real-time sync event dispatch.
- **F8: Customer Reservation Integration** (5 tests): Cart item price calculation, minimum 5 ks rule for zákusky, customer detail validation, blocked date booking prevention, order dispatch payload.
- **F9: E2E Testing & Verification Track** (5 tests): Runner execution capture, zero test pollution, deterministic exit codes, Next.js build verification, tier metric reporting.

### Tier 2: Boundary & Corner Cases (>= 45 tests)
Adversarial and boundary test verification across all 9 features:
- **F1 Boundary** (5 tests): Empty collections, idempotent blocking, non-existent unblock, listener unsubscribe cleanup, invalid status string handling.
- **F2 Boundary** (5 tests): Empty request body (400), malformed emails, HTML injection escaping in customer notes, empty cart handling, API network error (500).
- **F3 Boundary** (5 tests): Zero orders stats (no NaN), unauthorized tab filtering, unknown status fallback, canceled order revenue exclusion, rapid auth toggling.
- **F4 Boundary** (5 tests): Zero orders on calendar day, non-standard pickup slots, multi-cake custom details preservation, missing allergy note handling, month navigation across year boundary.
- **F5 Boundary** (5 tests): Special characters and diacritics in search, whitespace search, "all" filter completeness, terminal status progression limit, order cancellation data integrity.
- **F6 Boundary** (5 tests): Past date blocking, ISO `YYYY-MM-DD` format validation, bulk multi-date blocking, emoji/quote reason escaping, unblocking on empty list.
- **F7 Boundary** (5 tests): Negative and zero price rejection, decimal float precision (42.50 €), override reset to default, unknown product ID handling, extreme price bounds.
- **F8 Boundary** (5 tests): Missing required fields rejection, empty cart rejection, multi-add-on price accumulation, international phone number formats (+421, +420), zero quantity item removal.
- **F9 Boundary** (5 tests): XSS script tag injection safety, multi-byte UTF-8 emoji handling, extreme payload size (100 items), concurrent execution isolation, async timeout bounds.

### Tier 3: Cross-Feature Interactions (>= 9 tests)
Pairwise verification between interconnected modules:
- `T3-01` (F1 ↔ F6): Firestore date block immediately updates customer calendar availability.
- `T3-02` (F1 ↔ F7): Price override in Firestore immediately syncs to customer catalog & cart unit price.
- `T3-03` (F1 ↔ F2): Firestore order persistence triggers Resend transactional email with identical orderNumber.
- `T3-04` (F4 ↔ F5): Status update in Objednávky module instantly updates pickup item badge in Kalendár výroby.
- `T3-05` (F3 ↔ F5): Status advancement updates Admin Header metrics (Today's pickups & Revenue).
- `T3-06` (F6 ↔ F8): Unblocking previously blocked date re-enables customer reservation.
- `T3-07` (F7 ↔ F8): Product disabled in Zmena cien cannot be selected/added in reservation cart.
- `T3-08` (F2 ↔ F8): Customer allergy notes from reservation flow are correctly passed into Resend email template.
- `T3-09` (F1 ↔ F4): Kitchen print receipt formats real order data synchronized from Firestore.

### Tier 4: Real-World Application Scenarios (>= 5 tests)
Realistic end-to-end bakery workflows:
- `T4-01`: Complete custom wedding cake reservation flow with customizations, add-ons, pricing, email dispatch, and calendar entry.
- `T4-02`: Emergency capacity blocking workflow: Saturday filled, blocked with preset reason, customer redirected to Sunday.
- `T4-03`: Seasonal price surge & catalog update: price increased, sold out item disabled, customer carts item at new price.
- `T4-04`: Full order lifecycle progression: `nova` -> search -> `vyroba` -> `pripravena` -> print receipt -> `odovzdana` -> stats update.
- `T4-05`: Customer booking error recovery: invalid email and blocked date corrected, successful submission and alert dispatch.

## 5. Execution Commands
- **Standard Bun Test Runner**:
  ```bash
  export PATH="$HOME/.bun/bin:$PATH"
  bun test tests/e2e
  ```
- **Custom Formatted Runner with Summary**:
  ```bash
  export PATH="$HOME/.bun/bin:$PATH"
  bun run tests/e2e/runner.ts
  ```
- **Next.js Production Build Verification**:
  ```bash
  export PATH="$HOME/.bun/bin:$PATH"
  bun run build
  ```

## 6. Pass/Fail Criteria
- Total test count must be >= 104 tests.
- 100% of tests must pass (0 failures, 0 skipped, 0 flakiness).
- Test execution time must complete in < 2 seconds.
- Next.js build (`bun run build`) must exit with code 0 without TypeScript errors.
