# Admin Category Management Design

## Intent

Replace the admin Categories page's sample cards with database-backed category management. Products already reference category rows, and both the storefront and product form read active categories from the database.

## Goals

- Admins can list active and archived categories and see total and active product counts.
- Admins can create a category, edit its name and optional description, archive it, and restore it.
- Category names are trimmed and non-empty; descriptions are optional; duplicate exact names return a clear conflict response.
- A category cannot be archived while any active products reference it. Admins must reassign or archive those products first.
- Category archival and product create/update operations cannot race and leave active products in an archived category.
- Public category reads return only active categories; product form category selection continues using the existing active and admin category endpoints.
- Every admin category read or write uses Better Auth session plus the `ADMIN_EMAILS` allowlist.
- The Refine Categories resource uses the existing simple-rest provider and Shadcn UI conventions.

## Non-goals

- Category descriptions or image assets; the current static descriptions are sample copy and not stored in the database.
- Hard deletion or cascading changes to products.
- Customer-facing category page redesign.
- Stock, payments, orders, or dashboard changes.

## Constraints and current data

- The normalized `categories` table contains UUID `id`, unique `name`, optional `description`, and `isActive`; `products.categoryId` is a non-null foreign key.
- The category table and data-preserving migration were introduced in the preceding product workflow. The migration has not yet been applied to Neon.
- Existing public `GET /api/categories` returns active `{id, name}` rows, and protected `GET /api/categories/admin` returns all categories.
- Admin categories currently use hard-coded cards; the resource already declares list/create/edit routes.
- Product management can move or archive products, which is how admins clear active product references before category archival.
- Add no dependencies and preserve the existing product API and checkout behavior.

## Approaches considered

1. **Refine resource CRUD (selected):** use Refine list/create/update/delete hooks and the existing simple-rest provider. Map only category `getList` to `/categories/admin`; use the existing resource endpoints for mutations and details. This matches the Admin architecture and keeps loading, pagination, and error handling consistent.
2. **Custom fetch screen:** implement all category queries and mutations directly in React. This gives direct control but duplicates API and loading behavior already handled by Refine.

The Refine approach was selected.

## Proposed API and data behavior

- Extend protected `GET /api/categories/admin` with `_start`, `_end`, and `q` parameters, stable name/id ordering, `x-total-count`, and `productCount` plus `activeProductCount` for each category.
- Add protected `GET /api/categories/admin/options` returning all category options for the product form; keep it separate from the paginated admin list.
- Keep public `GET /api/categories` returning active categories only.
- Add protected `GET /api/categories/:id`, `POST /api/categories`, and `PATCH /api/categories/:id` endpoints. Create accepts `{name, description?}` and always starts active; update accepts `{name, description?, isActive}`. The server trims and validates names and descriptions. Reactivate a category by updating `isActive: true`.
- Implement protected `DELETE /api/categories/:id` as a soft archive. In a transaction, lock the category row, count active products, and return HTTP 409 with the active product count when nonzero; otherwise set `isActive` false. Missing IDs return 404.
- Translate unique-name conflicts to HTTP 409 with a readable message; unexpected errors are logged and return HTTP 500.
- Protect product category lifecycle against races: product create/update locks its target category while checking it is active and saving; update may retain an inactive category only when the product remains inactive. This prevents an archive and product activation from succeeding concurrently.
- If a restore or rename encounters a unique-name conflict, return HTTP 409 and require the admin to resolve the duplicate name before retrying.
- Keep product counts derived from `products`; do not persist counters.

## Proposed Admin behavior

- Replace sample category cards with a Refine-backed table or card list showing category name, description, active/archive state, total product count, and active product count.
- Add search, 20-row server pagination, Add Category, Edit, Archive, and Restore actions with loading/error/empty states.
- Disable the Archive action when `activeProductCount > 0` and explain that active products must be reassigned or archived. Keep server-side HTTP 409 handling for concurrent changes.
- Add category create/edit forms using existing Shadcn UI components, including a name field and optional description field. Show the existing admin sign-in path on 401/403.
- Route category list queries through Refine to `/categories/admin`, leaving product category lookup and mutations unchanged.

## Acceptance checks

- Admin category list shows database values and correct total/active product counts.
- Create, rename, archive, and restore persist; archived categories no longer appear in public category options.
- Archive is blocked with HTTP 409 while active products use the category, and remains safe under concurrent product create/update.
- Product forms continue to show active category options and retain an inactive category on archived product edit.
- Unauthenticated and non-admin requests cannot access protected category routes.
- Loading, empty, not-found, validation, authorization, and server-error states are handled without sample data.

## Builder calls

- Use `productCount` for all linked products and `activeProductCount` for the archive guard.
- Store an optional description because the current Admin Categories page presents descriptions as part of category information. Existing rows start with blank descriptions because the current descriptions are sample data, not a reliable source to migrate.
- Use soft archive only; existing product and order history remain linked to category/product records.
- New categories always start active; only edit/restore controls the active flag.
- Use Drizzle PostgreSQL transactions and `.for("update")` row locks around category state checks and dependent writes. The `node-postgres` Drizzle adapter supports this lock mode.
- Unique-name conflicts, including a restore conflict, return HTTP 409 for the admin to resolve; do not silently rename or merge categories.
