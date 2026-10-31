# Admin Category Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Admin Categories sample screen with protected Refine-backed category management, descriptions, product counts, and safe archive/restore behavior.

**Architecture:** Add an optional description column in a new additive migration. Extend category routes with protected CRUD and derived counts; archive uses a transaction and category row lock, while product writes lock their category row to prevent conflicting state changes. Route Refine's category and product lists to their admin endpoints and add category forms using existing Shadcn components.

**Tech Stack:** TypeScript, React, Refine, Shadcn UI, Express, Better Auth, Zod, Drizzle ORM, Neon PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-10-29-admin-category-management-design.md`

## Global Constraints

- Keep public `GET /api/categories` active-only and preserve public product response behavior.
- Use the existing categories/product foreign key and leave order item/product IDs unchanged.
- Every category admin endpoint uses `requireAdmin` and the `ADMIN_EMAILS` allowlist.
- Category archive is soft and returns HTTP 409 while active products reference the category.
- Do not auto-archive or hard-delete products/categories.
- Add no dependencies.
- Do not apply migrations to Neon during implementation.
- Do not add or run automated tests unless the user asks; use TypeScript/build checks, lint, and source review.

## Review Focus

- Category has active products at archive time: reject with HTTP 409 and return an actionable message.
- Product create/update races category archive: category row lock serializes both operations; no active product can be committed into an archived category.
- Archived product retains its inactive category: edit options must include that category, but only an inactive product may retain it.
- Duplicate or whitespace-only category names/descriptions: trim inputs, reject invalid names, and convert unique-name conflicts to HTTP 409.
- Product category selection loads all options even when the admin category list is paginated.

---

### Task 1: Add category descriptions

**Files:**
- Modify: `Server/src/schema/schema.ts`
- Create: `Server/drizzle/0005_category_descriptions.sql`
- Create: `Server/drizzle/meta/0005_snapshot.json`
- Modify: `Server/drizzle/meta/_journal.json`

**Interfaces:**
- `categories.description` is nullable text; existing categories migrate with `NULL` descriptions.
- Keep migration `0004_category_catalog.sql` unchanged because it may already have been applied outside this workspace.

- [x] Add nullable `description` to the Drizzle categories schema.
- [x] Generate `0005_category_descriptions.sql` and matching snapshot/journal updates; confirm it only adds the nullable description column.
- [x] Run `git diff --check` and inspect migration metadata.

### Task 2: Implement category CRUD and lifecycle protection

**Files:**
- Modify: `Server/src/routes/categoriesRoutes.ts`
- Modify: `Server/src/routes/productRoutes.ts`

**Interfaces:**
- `GET /api/categories/admin` accepts `_start`, `_end`, and `q`, returns a paginated array with `id`, `name`, `description`, `isActive`, `productCount`, and `activeProductCount`, and sets `x-total-count`.
- `GET /api/categories/admin/options` returns all `{id, name, isActive}` rows for the product form.
- `GET /api/categories/:id` returns one admin category with counts.
- `POST /api/categories` accepts `{name, description?}` and creates an active category.
- `PATCH /api/categories/:id` accepts `{name, description?, isActive}` for rename/restore; archiving through PATCH and DELETE both reject while active products exist.
- `DELETE /api/categories/:id` soft archives; active products cause HTTP 409, missing category causes 404.
- Category unique-name conflicts return HTTP 409. Unexpected errors are logged and return HTTP 500.
- Product POST/PATCH lock the target category with Drizzle `for("update")` inside the same transaction as the product write. Active products cannot use inactive categories.

- [x] Implement paginated/searchable admin category list and unpaginated protected options endpoint with derived product counts.
- [x] Implement protected category detail, create, rename/restore, and soft archive endpoints with Zod validation and 409 conflict handling.
- [x] Use a transaction and category row lock for archive checks; reject archive if the active product count is nonzero.
- [x] Update product POST/PATCH to lock category state and save within one transaction; reject reactivating a product with an inactive category.
- [x] Run `npm run build` in `Server/` and `git diff --check`.

### Task 3: Connect the Admin Categories resource

**Files:**
- Modify: `Admin/src/providers/data.ts`
- Modify: `Admin/src/App.tsx`
- Modify: `Admin/src/pages/Catergory/index.tsx`
- Create: `Admin/src/pages/Catergory/CategoryForm.tsx`
- Create: `Admin/src/pages/Catergory/create.tsx`
- Create: `Admin/src/pages/Catergory/edit.tsx`
- Modify: `Admin/src/pages/Products/ProductForm.tsx`

**Interfaces:**
- Category rows: `{id, name, description: string | null, isActive, productCount, activeProductCount}`.
- Refine `categories` list queries route to `/categories/admin`; create/update/delete remain `/categories` and `/categories/:id`.
- Product forms load all category options from `/categories/admin/options`.

- [x] Replace sample category cards with Refine list data, search, 20-row pagination, product counts, active/archive status, and loading/error/empty states.
- [x] Add Add/Edit forms for name and optional description; support restore through the edit form.
- [x] Disable Archive when `activeProductCount` is nonzero and explain that products must be reassigned or archived; show server 409 messages if the state changes concurrently.
- [x] Keep archived categories visible in edit options for archived products, while preventing active product writes to inactive categories.
- [x] Show the admin sign-in path on 401/403 and never render sample categories.
- [x] Route Refine category lists to the admin endpoint and update the product form options URL.
- [x] Run `npx tsc --noEmit`, ESLint on changed Admin files, and `git diff --check`.

### Task 4: Verify the integrated category workflow

**Files:**
- Review: all files changed in Tasks 1–3

- [x] Run Server, Admin, and Client production builds.
- [x] Review 409 archive behavior, row-lock transaction boundaries, product form options, Refine URL mapping, and public endpoint compatibility.
- [x] Report the new migration file and that neither it nor the earlier category migration was applied to Neon.

