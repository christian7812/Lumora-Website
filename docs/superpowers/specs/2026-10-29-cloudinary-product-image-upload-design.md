# Cloudinary Product Image Upload Design

## Intent

Allow an authorized Admin to select an image file while creating or editing a product. Upload product images to Cloudinary and continue saving the resulting HTTPS URL in the existing `products.image` column.

## Approaches

1. **Signed direct upload (selected working assumption):** the Admin requests a signature from an admin-protected Express endpoint, then uploads the file directly to Cloudinary. This keeps the API secret on the server and avoids streaming image bytes through Express.
2. **Server proxy:** the Admin posts the file to Express and Express sends it to Cloudinary. This keeps credentials private, but requires multipart parsing and consumes application-server bandwidth and memory.
3. **Unsigned upload preset:** the browser uploads without a server signature. It is simpler, but an exposed preset can be abused and is less suitable for an authenticated product manager.

## Scope and behavior

- Add Cloudinary account settings to server environment configuration: cloud name, API key, and API secret. Keep the secret server-only and never expose it through the Vite client environment.
- Add an admin-only endpoint that returns a Cloudinary upload signature for a server-generated public ID under a fixed product-image folder. Reuse existing `requireAdmin` authorization.
- Admin validates that the selected file is an image and is at most 5 MB, requests the signature, and sends the file directly to Cloudinary with signed parameters.
- On successful upload, place the returned secure URL in the existing image field and save the product with the existing product create/update request.
- Show upload progress and actionable errors. Keep URL entry as a fallback for existing remote images and environments without Cloudinary credentials.
- Do not change the database schema, add a Cloudinary SDK, or automatically delete prior Cloudinary assets. Replaced/deleted image cleanup is outside this change.

## Constraints

- Product CRUD and its HTTPS URL validation remain compatible.
- Cloudinary signing uses Node's built-in crypto module; no new dependency is needed.
- The upload signature endpoint must fail clearly when Cloudinary server configuration is missing.
- Do not log Cloudinary secrets or signed request contents.

## Acceptance

- A signed-in allowlisted admin can upload an image and save its Cloudinary secure URL to a product.
- Unauthenticated and non-admin callers cannot obtain upload signatures.
- Invalid file types and files over 5 MB are rejected before upload.
- Existing products with remote image URLs remain editable and visible.
- Server and Admin builds and changed-file lint pass.
