# Cloudinary Product Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins upload product images to Cloudinary and save each Cloudinary secure URL in the existing product record.

**Architecture:** Express will issue an admin-only signed upload payload using Node's built-in crypto. The Admin browser will upload directly to Cloudinary using that signature, then store the returned `secure_url` in the current product form image field.

**Tech Stack:** Express, Better Auth admin authorization, Node crypto, React, TypeScript, browser FormData/XMLHttpRequest, Cloudinary Upload API.

**Spec:** `docs/superpowers/specs/2026-10-29-cloudinary-product-image-upload-design.md`

## Global Constraints

- Keep the Cloudinary API secret server-only; only cloud name, API key, timestamp, fixed folder, generated public ID, and signature may be sent to the browser.
- Reuse `requireAdmin(req, res, "products")` for upload-signature authorization.
- Keep remote HTTPS URL entry as a fallback and preserve the existing `products.image` database field and product API.
- Accept image files up to 5 MB in the Admin UI.
- Add no dependencies and make no database schema or migration changes.
- Do not add or run automated tests unless requested; use builds, lint, source review, and `git diff --check`.

## Review Focus

- Missing Cloudinary environment configuration must return a clear server error without leaking settings.
- Unauthenticated/non-admin requests must not obtain signatures.
- File type/size validation and Cloudinary HTTP failures must leave the existing image value intact.
- Browser upload parameters must match the values signed by the server, including timestamp, folder, and generated public ID.
- Uploaded Cloudinary `secure_url` must pass the existing product URL validation and save through ordinary product create/update.

---

### Task 1: Add the protected Cloudinary signing endpoint

**Files:**
- Modify: `Server/src/routes/productRoutes.ts`
- Modify: `Server/.env.example`

**Interface:**
- Add `POST /api/products/upload-signature`, protected by `requireAdmin` for products.
- Return `{ cloudName: string, apiKey: string, timestamp: number, folder: "cruiser-store/products", publicId: string, signature: string }`.
- Require `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`; return HTTP 503 when configuration is incomplete.

- [x] Generate a server-side timestamp and UUID-based public ID in the fixed folder; sign the alphabetically ordered Cloudinary parameters with SHA-1 and the private API secret.
- [x] Return only Cloudinary's public upload fields and signature; do not log secrets or include them in responses.
- [x] Add empty Cloudinary setting names to `.env.example` with comments identifying the API secret as server-only.
- [x] Run `npm run build` from `Server/` and inspect authorization/error responses in source.

### Task 2: Upload from the Admin product form

**Files:**
- Modify: `Admin/src/pages/Products/ProductForm.tsx`

**Interface:**
- Request `POST ${API_URL}/products/upload-signature` with `credentials: "include"` and no image bytes.
- Upload the image to `https://api.cloudinary.com/v1_1/{cloudName}/image/upload` with `file`, `api_key`, `timestamp`, `folder`, `public_id`, and `signature`.
- On success, set the existing `form.image` to Cloudinary `secure_url`; product save continues using existing `onSave`.

- [x] Add an image file chooser accepting `image/*`; reject non-image files and files larger than 5 MB before requesting a signature.
- [x] Upload with `XMLHttpRequest` progress events; show progress and disable conflicting form actions while uploading.
- [x] Validate the signing and Cloudinary responses, show actionable errors, and preserve URL entry as a fallback.
- [x] Show a preview of the selected/current image and keep existing HTTPS URL validation.
- [x] Run Admin TypeScript check, changed-file ESLint, and Vite production build.

### Task 3: Verify integration

- [x] Run Server build, Admin TypeScript/build/lint, and `git diff --check`.
- [x] Review that the secret is only read by Server, existing remote URLs still work, and product create/edit persists the Cloudinary secure URL.
