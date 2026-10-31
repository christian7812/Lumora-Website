# Admin Order Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to update an order's fulfillment status from its details page.

**Architecture:** Add a protected `PATCH /api/orders/:id` handler that accepts only a status value from the approved set. Use Refine `useUpdate` on the existing order details screen, with an explicit save action and visible mutation states.

**Tech Stack:** TypeScript, Express, Zod, Drizzle ORM, Better Auth, Refine, Shadcn UI.

**Spec:** `docs/superpowers/specs/2026-10-29-admin-order-status-design.md`

## Global Constraints

- Checkout `POST /api/orders` remains available to unauthenticated customers.
- Existing order list/detail endpoints, pagination, payloads, and admin authorization remain intact.
- Order status values are `pending`, `processing`, `shipped`, `delivered`, and `cancelled`.
- Status changes do not modify payment, inventory, totals, or order items.
- Do not add dependencies or migrations.
- Do not add or run automated tests unless requested; verify with builds/typechecks and source review.

## Review Focus

- Missing or expired session: protected update returns 401.
- Authenticated non-admin: protected update returns 403.
- Malformed UUID or unsupported status: return 400 without writing.
- Valid UUID without a matching order: return 404.
- Unexpected database failure: log on server and return 500.

---

### Task 1: Add the protected order status endpoint

**Files:**
- Modify: `Server/src/routes/orderRoutes.ts`

**Interfaces:**
- `PATCH /api/orders/:id` accepts `{ status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" }` and returns the updated order row.
- Uses the existing `requireAdmin(req, res, "orders")` helper and UUID validation.

- [x] Validate admin session, UUID, and status; update only `orders.status`; return 401/403 via the helper, 400 for invalid input, 404 when missing, and logged 500 for unexpected failure.
- [x] Preserve GET list/detail and checkout POST behavior; run `npm run build` in `Server/`.

### Task 2: Add status editing to order details

**Files:**
- Modify: `Admin/src/pages/Orders/show.tsx`

**Interfaces:**
- Uses Refine `useUpdate` with resource `orders`, current order ID, and `{ status }`; the existing simple REST provider sends PATCH and includes session credentials.

- [x] Add a Shadcn status select and explicit save button with unchanged/saving/success/error states; keep the persisted status visible and refresh order details after success.
- [x] Preserve loading, not-found, auth, and existing details/item display; run Admin TypeScript/build checks and lint the changed file.

### Task 3: Integrated verification

**Files:**
- Review: `Server/src/routes/orderRoutes.ts`, `Admin/src/pages/Orders/show.tsx`

- [x] Review authorization, validation, not-found and error paths, and confirm checkout/list/detail behavior was preserved.
- [x] Run `git diff --check` and report verification results.
