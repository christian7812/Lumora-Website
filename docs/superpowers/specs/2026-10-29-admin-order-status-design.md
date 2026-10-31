# Admin Order Status Design

## Intent and goals

Let an authenticated Cruiser Store admin update an order's fulfillment status from the existing order details page. The change should use the existing Better Auth admin allowlist, Express/Drizzle backend, Refine data provider, and Shadcn UI. The saved status must be visible after reload.

## Approaches

1. **Status control on order details (selected):** add an admin-only `PATCH /api/orders/:id` status endpoint and a status selector with an explicit save action on the order details page. This keeps the action beside the order being managed and fits the existing Refine page and provider.
2. **Inline status control in the order list:** use the same endpoint but place a selector on each list row. This speeds up bulk processing but adds controls and interaction state to a dense table; the existing details page is a clearer starting point.

The user asked for the modern approach; the details-page control is selected for clear, focused order management.

## Behavior

- Support exactly `pending`, `processing`, `shipped`, `delivered`, and `cancelled`; new orders remain `pending`.
- `PATCH /api/orders/:id` accepts only a valid status. It requires the existing Better Auth session and `ADMIN_EMAILS` allowlist. Return 401 when signed out, 403 when signed in without admin access, 400 for invalid UUID/status, 404 for a missing order, and 500 for unexpected errors (logged server-side).
- Update the order row's status only. Do not alter order items, totals, inventory, payments, or trigger charges/refunds.
- Add a status control and explicit save action to the existing order details page. Show loading/saving/error/success states, keep the current status visible, and refresh the displayed order after a successful update.
- Preserve checkout POST, order list and detail responses, pagination, and current authorization behavior.

## Constraints and implementation calls

- Use the existing Refine `useUpdate` hook and simple REST provider; no new dependencies or schema migration are expected because `orders.status` is already text.
- Reuse `requireAdmin` and existing UUID validation patterns where appropriate.
- No automated tests unless requested; verify with TypeScript/build checks and source review.

## Non-goals

- Payment capture, refunds, customer notifications, stock changes, status history/audit records, bulk status updates, or a customer-facing tracking page.
