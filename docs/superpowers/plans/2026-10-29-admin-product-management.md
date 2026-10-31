# Admin Product Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect admin product CRUD to PostgreSQL, normalize categories with a data-preserving migration, and keep the public storefront product API compatible.

**Architecture:** Add a UUID-backed `categories` table and replace the product category text column with a foreign key, migrating existing names before dropping the text column. Reuse shared Better Auth admin authorization in the order and catalog routes; add public product/category reads and protected admin catalog APIs. Replace the admin product sample screen with Refine-backed list and create/edit forms.

**Tech Stack:** TypeScript, React, Refine, Shadcn UI, Express, Better Auth, Zod, Drizzle ORM, Neon PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-10-29-admin-product-management-design.md`

## Global Constraints

- Preserve the current public `GET /api/products` response shape, including a string `category`.
- Preserve checkout's product IDs, database-trusted prices, and existing order behavior.
- Use Better Auth sessions and the `ADMIN_EMAILS` allowlist for admin catalog endpoints.
- Archive products with `isActive = false`; do not hard-delete products.
- Add no dependencies.
- Do not apply the generated database migration to Neon as part of this implementation; applying the schema change is a separate operational action.
- Do not add or run automated tests unless the user asks; use TypeScript/build checks and focused review for verification.

## Review Focus

- Existing category labels with surrounding whitespace or duplicates: migration must map all products to a category row and avoid losing catalog records.
- Existing product IDs stored as numeric strings: remain valid after the foreign-key migration and keep matching order item IDs.
- Inactive category referenced by an existing product: admin edit must still display the product's category.
- Missing or invalid `categoryId`, malformed image URL, negative price, or invalid old price: reject without a database write.
- Unauthorized requests to admin list and mutation routes: return 401/403 and never expose inactive products.

---

### Task 1: Normalize product categories

**Files:**
- Modify: `Server/src/schema/schema.ts`
- Create: `Server/drizzle/0004_category_catalog.sql`
- Create: `Server/drizzle/meta/0004_snapshot.json`
- Modify: `Server/drizzle/meta/_journal.json`

**Interfaces:**
- Produces `categories` with `id: uuid`, `name: text`, and `isActive: boolean`.
- Produces `products.categoryId` as a non-null UUID foreign key.
- Migration inserts one category per distinct trimmed existing product category, maps every product, then removes the legacy text column.

- [x] Update Drizzle schema with the categories table and product foreign key.
- [x] Generate or write the `0004_category_catalog.sql` migration that backfills categories before enforcing the foreign key and removing the old column; handle blank legacy labels as `Uncategorized`.
- [x] Inspect the migration SQL and schema diff for a complete backfill and no unrelated schema changes.
- [x] Check the migration files with `git diff --check`; compile the Server after Task 2 updates all API consumers of the changed schema.

### Task 2: Add shared authorization and catalog APIs

**Files:**
- Create: `Server/src/lib/requireAdmin.ts`
- Modify: `Server/src/routes/orderRoutes.ts`
- Modify: `Server/src/routes/productRoutes.ts`
- Modify: `Server/src/routes/categoriesRoutes.ts`
- Modify: `Server/src/index.ts`

**Interfaces:**
- `requireAdmin(req: Request, res: Response, resource: "orders" | "products" | "categories"): Promise<boolean>` checks Better Auth session and normalized comma-separated `ADMIN_EMAILS`; retains current order 503/401/403 messages.
- Public `GET /api/categories` returns active `{id, name}` options.
- Admin `GET /api/categories/admin` returns all category options for editing existing products.
- Admin products use `GET /api/products/admin` with `_start`, `_end`, and `q`; response is an array with `x-total-count`.
- Admin product detail uses protected `GET /api/products/:id` for the Refine edit form.
- Admin product create/update use `categoryId`; returned admin product rows include `category` and `categoryId`.
- `POST /api/products`, `PATCH /api/products/:id`, and soft-archive `DELETE /api/products/:id` validate with Zod and generate new product IDs with `randomUUID()`.
- Public `GET /api/products` joins categories and preserves its current `{id,name,category,image,price,oldPrice?}` response.

- [x] Extract the existing order authorization helper and update both order list/detail routes to use it without changing responses.
- [x] Implement public and admin category list routes.
- [x] Implement paginated/searchable admin product reads, protected single-product reads, and validated create/update/archive endpoints.
- [x] Update the public product query to join categories while retaining active filtering and the current response shape.
- [x] Mount the category router and verify route ordering does not shadow public/admin product paths.
- [x] Run `npm run build` in `Server/` and inspect `git diff --check`.

### Task 3: Connect the Admin Products workflow

**Files:**
- Modify: `Admin/src/App.tsx`
- Modify: `Admin/src/pages/Products/index.tsx`
- Create: `Admin/src/pages/Products/create.tsx`
- Create: `Admin/src/pages/Products/edit.tsx`
- Create: `Admin/src/pages/Products/ProductForm.tsx`
- Modify: `Admin/src/providers/data.ts`

**Interfaces:**
- Product fields: `id`, `name`, `categoryId`, `category`, `image`, `price`, nullable `oldPrice`, and `isActive`.
- Product list query uses 20-item server pagination and search across product name/category.
- Product form loads category options from `/api/categories/admin` and submits only product fields accepted by the API.

- [x] Replace hard-coded sample products with Refine `useList`, pagination, and loading/error/empty states.
- [x] Add search, active/archive status, and Add/Edit/Archive/Restore actions.
- [x] Add create/edit routes and a form with category selection, URL validation, current price, and optional old price.
- [x] Ensure 401/403 responses are visible and do not render sample data; preserve the existing admin sign-in path.
- [x] Route product list queries to `/products/admin` in the data provider while keeping create/update/delete on `/products`.
- [x] Run `npx tsc --noEmit` and ESLint on modified Admin files; inspect `git diff --check`.

### Task 4: Verify the integrated workflow

**Files:**
- Review: all files changed in Tasks 1–3

- [x] Run `npm run build` in `Server/` and `Admin/`.
- [x] Run `npm run build` in `Client/shopping-frontend/` to confirm the public product response remains compatible.
- [x] Review route authorization, migration backfill order, total-count pagination, archive behavior, and the untouched checkout payload.
- [x] Report that the migration file is generated but not applied to Neon; provide the command the user can run after reviewing the migration.

