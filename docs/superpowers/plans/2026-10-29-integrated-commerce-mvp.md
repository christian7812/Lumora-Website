# Integrated Commerce MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect inventory, guest/account orders, manual payment tracking, contact messages, customer data, and dashboard metrics across Cruiser Store.

**Architecture:** Add additive Drizzle schema/migrations, then make checkout and order mutations transactional so inventory, payment, and fulfillment states stay consistent. Connect the existing React storefront and Refine Admin to protected Express endpoints, preserving guest checkout and existing catalog management.

**Tech Stack:** React, TypeScript, Refine, Express, Better Auth, Zod, Drizzle ORM, Neon PostgreSQL, existing Shadcn UI.

**Spec:** `docs/superpowers/specs/2026-10-29-integrated-commerce-mvp-design.md`

## Global Constraints

- Keep guest checkout; link orders to Better Auth users only when session lookup succeeds.
- Product stock is a non-negative integer; existing products start at zero until an admin enters actual quantities.
- Manual payment states are `unpaid`, `paid`, and `refunded`; no payment gateway or automatic verification.
- Do not send email; contact messages are persisted for the Admin inbox.
- Keep shipping at GH₵25 below GH₵500 and free at or above GH₵500.
- Do not add dependencies.
- Generate additive migrations and preserve migrations `0004_category_catalog.sql` and `0005_category_descriptions.sql`; do not apply migrations to Neon.
- Do not add or run automated tests unless requested; use TypeScript builds, lint, source review, and `git diff --check`.
- Preserve existing user changes in the current workspace; do not commit or merge.

## Review Focus

- Duplicate product IDs or concurrent checkout: aggregate quantities, serialize stock checks, and never create a partial order or negative stock.
- Cancellation of paid/unpaid/refunded orders: enforce payment and fulfillment transitions and restore stock at most once.
- Guest and signed-in checkout: keep guest checkout working and ensure customer order endpoints filter by authenticated user ID.
- Invalid/stale product stock or archived products: return actionable checkout conflicts and keep cart quantity UI advisory only.
- Public contact abuse and admin PII: bound/validate input and protect message, customer, and dashboard reads with `requireAdmin`.

---

### Task 1: Extend the commerce schema and add migrations

**Files:**
- Modify: `Server/src/schema/schema.ts`
- Modify: `Server/src/db/seedProducts.ts`
- Create: `Server/drizzle/0006_integrated_commerce.sql` and matching metadata snapshot
- Modify: `Server/drizzle/meta/_journal.json`

**Interfaces:**
- `products.stockQuantity: number` maps to non-negative `stock_quantity`.
- `orders.userId: string | null` maps to the nullable Better Auth user FK.
- `orders.paymentStatus` is `unpaid | paid | refunded`, default `unpaid`.
- `contactMessages` rows contain `id`, `name`, `email`, `subject`, `message`, `status`, and `createdAt`; status is `new | read | archived`.

- [x] Add the stock, user link, payment status, and contact message schema fields/table with indexes/check constraints where defined by the spec.
- [x] Generate the additive `0006_integrated_commerce.sql`, snapshot, and journal entry; confirm existing catalog migrations are unchanged.
- [x] Keep seed-created products at stock zero unless an explicit stock value is supplied; do not invent inventory.
- [x] Inspect migration SQL/metadata and run `git diff --check`; do not apply migrations.

### Task 2: Make catalog and checkout stock-aware

**Files:**
- Modify: `Server/src/routes/productRoutes.ts`
- Modify: `Server/src/routes/orderRoutes.ts`

**Interfaces:**
- Public and admin product responses include `stockQuantity`.
- Product create/update accepts a non-negative integer `stockQuantity`.
- Checkout POST continues accepting `{fullName,email,phone,address,city,region,paymentMethod,items}` and returns the current `{message,orderId,total}` shape; stock conflicts return HTTP 409.
- New orders contain `userId` when an authenticated session exists, `paymentStatus: "unpaid"`, and fulfillment `status: "pending"`.
- New orders also record `stock_deducted`; older migrated orders default false so cancelling a historic order cannot add inventory that was never removed.

- [x] Add stock to product validation, reads, create/update responses, and save it under the existing product-row lock.
- [x] In checkout, aggregate duplicate product IDs, read optional Better Auth session, lock products in stable ID order, validate active status and available quantity, compute trusted price/shipping, decrement stock, and insert order/items in one transaction.
- [x] Return 409 for unavailable/out-of-stock items and ensure every rejection rolls back order, line items, and stock changes.
- [x] Update admin order PATCH to accept exactly one of fulfillment `status` or `paymentStatus`; enforce the specified transitions, manual paid/refunded states, and status-only/payment-only updates.
- [x] Cancel only `pending`/`processing` orders; require unpaid or refunded payment state and restore item quantities atomically with cancellation, only for orders marked `stock_deducted`. Prevent any payment change after cancellation.
- [x] Run `npm run build` in `Server/` and inspect that GET list/detail and guest checkout routes remain intact.

### Task 3: Add customer, contact, and dashboard API workflows

**Files:**
- Modify: `Server/src/lib/requireAdmin.ts`
- Modify: `Server/src/routes/contactRoutes.ts`
- Create: `Server/src/routes/customerRoutes.ts`
- Create: `Server/src/routes/accountRoutes.ts`
- Create: `Server/src/routes/dashboardRoutes.ts`
- Modify: `Server/src/index.ts`

**Interfaces:**
- `POST /api/contact` stores a validated public message and returns a generic success response.
- `GET /api/contact/admin` returns paginated/searchable rows with `x-total-count`; `GET /api/contact/:id` and `PATCH /api/contact/:id` return protected message data/state.
- `GET /api/customers/admin` returns paginated normalized-email customer aggregates; `GET /api/customers/:email` returns one customer's profile and order summaries.
- `GET /api/account/orders` and `GET /api/account/orders/:id` require a Better Auth session and return only the current user's orders.
- `GET /api/dashboard` is admin-only and returns paidRevenue, totalOrders, activeProducts, customerCount, unpaidOrders, outOfStockProducts, and recentOrders.

- [x] Add contact validation, persistence, protected list/detail/state changes, reversible archive, pagination, search, and logged error handling.
- [x] Add protected customer aggregates from normalized order emails with cancelled orders excluded from orderCount and paid-only totals; validate the email detail key.
- [x] Add account order reads filtered by session user ID; return 401 when signed out and 404 for orders owned by another user or missing.
- [x] Add protected dashboard aggregates; exclude refunded orders from paid revenue and use distinct normalized emails for customer count.
- [x] Expand `requireAdmin` resource names and mount all new routers without changing existing paths.
- [x] Run `npm run build` in `Server/` and `git diff --check`.

### Task 4: Connect the storefront to inventory, orders, and contact

**Files:**
- Modify: `Client/shopping-frontend/src/components/ui/ProductCard.tsx`
- Modify: `Client/shopping-frontend/src/contexts/ProductContext.ts`
- Modify: `Client/shopping-frontend/src/contexts/ProductProvider.tsx`
- Modify: `Client/shopping-frontend/src/contexts/CartContext.ts`
- Modify: `Client/shopping-frontend/src/contexts/CartProvider.tsx`
- Modify: `Client/shopping-frontend/src/pages/CartPage.tsx`
- Modify: `Client/shopping-frontend/src/pages/CheckoutPage.tsx`
- Modify: `Client/shopping-frontend/src/pages/OrderSuccessPage.tsx`
- Modify: `Client/shopping-frontend/src/pages/ContactPage.tsx`
- Modify: `Client/shopping-frontend/src/components/layout/Navbar.tsx`
- Create: `Client/shopping-frontend/src/pages/AccountOrdersPage.tsx`
- Create: `Client/shopping-frontend/src/pages/AccountOrderDetailsPage.tsx`
- Modify: `Client/shopping-frontend/src/App.tsx`

**Interfaces:**
- Storefront `Product` includes `stockQuantity: number`.
- Cart operations cannot add or raise quantity above latest known stock; checkout remains authoritative.
- Account order endpoints use the existing Better Auth client/session and credentials.

- [x] Parse stock in the public product response; disable adding zero-stock products and clamp/reject cart quantity changes above available stock.
- [x] Make CartPage show the checkout shipping fee and free-shipping threshold accurately.
- [x] Send checkout requests with credentials, handle 409 stock conflicts, and show accurate cash/manual mobile-money wording; preserve guest checkout.
- [x] Show the saved order/payment details on the success page without claiming payment is complete.
- [x] Submit contact form data to `/api/contact`, with disabled submit/loading, success/error states, and clear-on-success behavior.
- [x] Add a signed-in customer's order-history page and navigation link; ensure guest users are directed to sign in and cannot request other customers' orders.
- [x] Add a customer order-detail route/page that reads only the signed-in customer's selected order.
- [x] Run `npm run build` in `Client/shopping-frontend/`.

### Task 5: Connect Admin product, order, customer, inbox, and dashboard pages

**Files:**
- Modify: `Admin/src/providers/data.ts`
- Modify: `Admin/src/App.tsx`
- Modify: `Admin/src/pages/Products/ProductForm.tsx`
- Modify: `Admin/src/pages/Products/index.tsx`
- Modify: `Admin/src/pages/Orders/list.tsx`
- Modify: `Admin/src/pages/Orders/show.tsx`
- Modify: `Admin/src/pages/Customers/index.tsx`
- Modify: `Admin/src/pages/Dashoard/index.tsx`
- Create: `Admin/src/pages/Customers/show.tsx`
- Create: `Admin/src/pages/ContactMessages/list.tsx`
- Create: `Admin/src/pages/ContactMessages/show.tsx`
- Delete: sample-only `Admin/src/pages/Customers/data.ts`
- Delete: sample-only `Admin/src/pages/Dashoard/data.ts`
- Delete: sample-only `Admin/src/pages/Orders/data.ts` only if no live page still imports it

**Interfaces:**
- Refine list routing maps products to `/products/admin`, categories to `/categories/admin`, customers to `/customers/admin`, and the `contact` resource list to `/contact/admin`; contact detail/update use `/contact/:id`.
- Product payloads include `stockQuantity`; order updates send either `{status}` or `{paymentStatus}`.
- Dashboard consumes the aggregate `/dashboard` response; customer and contact pages use the existing REST provider.

- [x] Add stock quantity to product form/list and display out-of-stock status while preserving category and archive behavior.
- [x] Add payment-status management and transition-aware fulfillment controls to order details; show manual payment/refund instructions and conflicts clearly.
- [x] Replace sample customers with searchable/paginated guest/account order aggregates and implement the View details action.
- [x] Replace sample dashboard cards with real protected metrics and a recent-orders view, including loading/error/empty/auth states.
- [x] Add Refine contact-message list/detail routes, search, message content, date, new/read/archive/restore actions, and authorization states.
- [x] Run Admin TypeScript and a Vite production build. Changed-file lint remains to be checked.

### Task 6: Verify the integrated release

**Files:**
- Review: all files changed in Tasks 1–5

- [x] Run final Server and Client builds, Admin typecheck/Vite build, Client lint, changed Admin lint, and `git diff --check`.
- [x] Review transaction boundaries, stock restoration, guest/account order privacy, manual payment state, contact authorization, customer aggregates, dashboard revenue, and shipping consistency against the design; follow-up review confirmed customer search keeps full-order aggregates.
- [x] Confirm migration files are generated only and none was applied to Neon; report the required migration command for the user to run.
