# Integrated Commerce MVP Design

## Intent

Connect the remaining store and admin placeholders so Cruiser Store can manage real inventory, orders, payments handled manually, customer history, contact messages, and dashboard totals. The user approved one coordinated database-backed release and selected cash plus manual mobile money, with no payment gateway.

## Goals

- Track product stock in PostgreSQL and prevent checkout from selling inactive or insufficiently stocked products, including under concurrent checkouts.
- Keep guest checkout. Attach an order to a Better Auth user when a valid session exists, and let that user view only their own order history and details.
- Let admins update fulfillment and manually record payment as unpaid, paid, or refunded.
- Restore stock when an eligible order is cancelled; prevent invalid lifecycle changes and avoid claiming a refund happened automatically.
- Persist contact form messages and provide an admin-only inbox to review and archive them.
- Replace sample customer rows and dashboard figures with protected, database-backed data.
- Make cart shipping and checkout shipping use the same existing rule: GH₵25 below GH₵500, free at or above GH₵500.
- Keep existing product/category catalog management and checkout response behavior compatible where possible.

## Non-goals

- Online card/MoMo gateway integration or automated payment verification.
- Sending email (contact acknowledgements, MoMo instructions, order notifications, or replies). The admin inbox is the delivery mechanism for contact messages; staff may reply out of band.
- Shipping carrier integration, tax calculation, returns after shipment/delivery, inventory audit history, or bulk order updates.
- Requiring a customer account to place an order. Guest checkout remains available.
- Applying migrations to Neon during implementation.

## Approaches

1. **Unified database-backed release (selected):** extend the existing order/product models, add contact message storage, and connect the storefront and Refine admin to protected API reads and writes. Checkout performs stock validation, price calculation, decrement, order creation, and line-item creation in one transaction. This supports the user's request to integrate the remaining pieces together and keeps displayed data based on the same records used by checkout.
2. **Connect only the existing admin placeholders:** add contact/customer/dashboard reads but defer stock and payment state. This is a smaller change, but checkout would continue accepting orders beyond available inventory and the admin could not distinguish unpaid from paid orders. The user selected the unified approach.

## Data and migration behavior

- Add non-negative integer `products.stock_quantity` with a default of `0`. Existing products start at zero because real on-hand quantities are unknown; admins must enter actual stock before those items can be purchased. Newly created products also start at zero unless the admin enters a quantity.
- Add nullable `orders.user_id` referencing Better Auth `user.id` with `ON DELETE SET NULL`, so guest orders and order history remain intact if an account is removed.
- Add `orders.payment_status` with `unpaid`, `paid`, or `refunded`; existing orders migrate as `unpaid`. Payment status is separate from fulfillment `status`.
- Add `contact_messages` with UUID id, trimmed name/email/subject/message, status (`new`, `read`, `archived`), and creation timestamp.
- Generate additive Drizzle migrations after the existing migration sequence. Preserve migrations `0004_category_catalog.sql` and `0005_category_descriptions.sql`; do not apply any migrations to Neon.

## Inventory and checkout rules

- Admin product list/forms show and edit `stockQuantity`; reject negative or non-integer quantities. Public product data includes stock availability/quantity so the storefront can disable unavailable items and constrain cart controls. Checkout remains authoritative and rechecks stock.
- The checkout UI keeps cash on delivery and manual mobile money. It tells customers that mobile money instructions will be provided after submission; no merchant number is invented. New orders start with fulfillment `pending` and payment `unpaid`.
- Checkout aggregates repeated product IDs, locks the matching product rows in stable ID order inside a transaction, validates every product is active and has enough stock, calculates prices and shipping from database values, decrements stock, then inserts the order and its line items. Any failure rolls back the entire transaction. Stock conflicts return HTTP 409 with an actionable message; no partial order is created.
- Product admin updates lock their product row and save stock with the rest of the product fields, preventing a stock edit from racing checkout.
- Cart quantity controls cannot exceed the latest known stock. If stock changed since the cart was saved, checkout returns a conflict and the customer can update the cart.

## Order and manual payment lifecycle

- Fulfillment statuses are `pending`, `processing`, `shipped`, `delivered`, and `cancelled`; new orders remain `pending`.
- Allowed transitions: `pending` → `processing` or `cancelled`; `processing` → `shipped` or `cancelled`; `shipped` → `delivered`; `delivered` and `cancelled` are terminal. No return workflow is implied.
- Payment transitions are `unpaid` → `paid` → `refunded`. Admins record these only after receiving or refunding money outside the website. There is no gateway call.
- A cancelled order's payment state is final. The only valid cancelled-order payment states are `unpaid` or `refunded`; payment status cannot be changed after cancellation.
- A paid order must be manually marked `refunded` before it can be cancelled. Cancellation is allowed only before shipment, and the status change plus stock restoration happen atomically. Unpaid or refunded orders can be cancelled; a cancellation cannot be reversed.
- Order updates require the existing Better Auth admin allowlist. Keep list/detail endpoints and checkout POST working; extend detail responses with payment status.

## Customer accounts and customer directory

- Checkout attempts to read the optional Better Auth session. A valid session attaches `user_id`; no session creates a guest order as today. A session lookup failure returns an error rather than creating an ambiguously linked order.
- Add authenticated customer endpoints for listing the signed-in user's orders and reading one of their own orders. Every query filters by the session user ID; guessing another order UUID never exposes its details.
- Add a customer-facing order history page and navigation entry for signed-in users, while preserving guest checkout and the existing success page.
- Admin customer records are derived from normalized order email addresses, because checkout currently supports guest buyers and there is no customer table. Show latest submitted name/phone, order count excluding cancelled orders, paid total from `paid` orders, latest order date, and links to that email's orders. Do not present a fabricated account-active flag.
- Protect customer list/detail data with `requireAdmin`; return pagination headers and stable sorting for Refine.

## Contact messages

- Add public `POST /api/contact` with Zod validation, trimmed name/email/subject/message, bounded lengths, and a generic success response that does not expose database details.
- Add admin-only paginated/searchable `GET /api/contact/admin`, protected `GET /api/contact/:id`, and `PATCH /api/contact/:id` for `new`/`read`/`archived` state changes. Invalid IDs return 400, missing messages 404, and unexpected failures are logged and return 500.
- Admins can move `new` ↔ `read`, archive a message, and restore an archived message to `new`; archive is reversible and does not delete the message.
- Connect the existing storefront contact form to the endpoint with submitting, success, and error states and clear the form only on success.
- Add Refine contact list/detail routes with search, message contents, timestamp, state changes, empty/loading/error states, and the existing admin sign-in path. No outbound email is sent.

## Dashboard and storefront behavior

- Add a protected aggregate endpoint for paid revenue (exclude refunded orders), order count, active product count, distinct customer-email count, unpaid order count, out-of-stock product count, and recent orders. The dashboard labels revenue as paid revenue and uses a recent orders table rather than sample totals.
- Replace static Admin customer rows with the customer API and give the existing View action a real customer/order view.
- Update product types/provider/cart so unavailable items cannot be newly added, saved cart quantities refresh from current product data, and quantity controls respect stock. Checkout remains the final authority.
- Update CartPage to show the same shipping charge/free-shipping threshold used at checkout; preserve server-side total calculation as authoritative.
- Keep Better Auth admin protection on all dashboard, customer, contact, product, and order admin endpoints. Do not rely on hidden UI controls for security.

## Constraints and builder calls

- Reuse Express, Better Auth, Refine simple REST, Drizzle, Zod, and existing UI components; add no dependencies.
- Keep guest checkout. Link orders only when the Better Auth session can be read successfully.
- Start unknown stock at zero; this makes existing products unavailable until the admin enters real quantities, but avoids inventing stock.
- Fulfillment cancellation after shipment/delivery is rejected because returns/restocking are outside this release.
- Admins mark manual payment/refunds themselves after handling money externally. The app never describes an order as paid based only on method selection.
- After cancellation, payment state is immutable; a paid order must be manually marked refunded before it can be cancelled.
- Contact archive is reversible and restore always returns the message to `new`.
- Paid revenue means the sum of orders manually marked `paid`; exclude `refunded` orders.
- Do not add/run automated tests unless requested; use TypeScript builds, lint, source review, and `git diff --check`.

## Acceptance checks

- Existing catalog rows migrate without loss; their stock is zero until entered by an admin.
- Concurrent checkout attempts cannot drive stock negative or create orders with unavailable products; failed checkout creates no order or line items.
- Guest checkout still succeeds; signed-in users can see only their own linked orders.
- Admin stock, fulfillment state, and manual payment state persist and remain consistent after reload.
- Cancelling an eligible unpaid/refunded order restores stock once; invalid transitions and cancellation of a paid, unrefunded order are rejected.
- Contact messages persist and appear only through protected admin APIs; the public form reports success only after persistence.
- Customer and dashboard data reflect stored orders and products, with revenue limited to paid, non-refunded orders.
- Cart shipping display matches checkout's GH₵25 / GH₵500 rule.
- All existing category/product management, public product responses (additive stock availability), order pagination, order details, and customer guest checkout remain usable.
