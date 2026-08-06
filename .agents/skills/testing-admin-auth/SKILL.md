---
name: testing-admin-auth
description: How to run the Geza Dream Homes Next.js app locally and test the /admin token-gated pages and /api/admin/* routes end-to-end.
---

# Local setup & testing for Geza Dream Homes (Next.js 15 + Prisma)

## Getting a runnable local stack

1. `npm ci` (deps).
2. Create `.env.local`. Minimum set that makes the app boot without route-level throws:
   ```
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   DATABASE_URL="postgresql://pg:pg@localhost:55432/gdh"
   ADMIN_TOKEN=correct-token-123
   AUTH_JWT_SECRET=<any long random string>
   RESEND_API_KEY=re_test123
   LISTINGS_PROVIDER=mock
   ```
   `RESEND_API_KEY` must be non-empty or the signup route throws "Missing API key" at
   build/collect time (pre-existing, unrelated to any given PR).
3. **The Prisma datasource is `postgresql`, not SQLite** (`prisma/schema.prisma`). A
   `DATABASE_URL="file:./dev.db"` will fail `prisma db push` with `P1012 Environment variable not
   found / provider mismatch`. If no Postgres is present, the quickest path is Docker:
   ```
   docker run -d --name gdh-pg -e POSTGRES_PASSWORD=pg -e POSTGRES_USER=pg -e POSTGRES_DB=gdh \
     -p 55432:5432 postgres:16-alpine
   ```
   If the schema provider ever changes to sqlite, `file:./dev.db` becomes valid again — check the
   schema first rather than assuming.
4. **The Prisma CLI reads `.env`, not `.env.local`.** Either `cp .env.local .env` or prefix commands
   with `DATABASE_URL=... npx prisma ...`. Then:
   `npx prisma generate && npx prisma db push`.
5. `npm run dev` (port 3000).

## Seeding data so admin pages show something

The admin dashboard/user/review/lead pages are empty shells against an empty DB, which makes it hard
to prove an authenticated API call really succeeded. Seed from the **repo root** (node must resolve
`@prisma/client` from `node_modules`) with `DATABASE_URL` inline:

```
DATABASE_URL="postgresql://pg:pg@localhost:55432/gdh" node seed.js
```

Useful minimal rows: a `user` with `approved:false`, a `review` with `approved:false`, and a `lead`.
These surface as "Pending User Approvals" / "Pending Reviews" on `/admin` and a row on
`/admin/leads`, which is much stronger evidence than a bare authenticated shell.

## Admin auth model (what to exercise)

- Token lives in `localStorage` under `admin_token` / `admin_authenticated` (`lib/admin-auth.ts`).
- `AdminAuth.login(token)` POSTs `/api/admin/verify` and only persists on 200; on 401 it calls
  `logout()` and the page shows **"Invalid admin token."**
- All five pages (`/admin`, `/admin/users`, `/admin/reviews`, `/admin/leads`, `/admin/photos`) gate
  on `if (!authenticated)` and re-verify a saved token on mount.
- `lib/admin-token.ts` compares sha256 digests with `timingSafeEqual`. **If `ADMIN_TOKEN` is unset it
  allows everything outside production** — so always set `ADMIN_TOKEN` in `.env.local` or every
  negative test silently passes for the wrong reason.
- `GET /api/admin/photos` and `GET /api/admin/photos/albums` are intentionally public (the
  public `/gallery` page consumes them). Only the mutating photo routes require a token. Always
  re-check `/gallery` as a regression when touching photo route auth.

## Testing tips

- **Stale/rotated-token test without devtools:** `next dev` hot-reloads `.env.local`, so you can
  change `ADMIN_TOKEN` to a new value, wait ~6-8s, and reload the page. An active session drops back
  to the auth screen. This is more realistic than hand-editing localStorage and needs no devtools —
  much nicer in a recording. Confirm the flip server-side first with
  `curl -X POST localhost:3000/api/admin/verify -d '{"token":"<old>"}' -H 'Content-Type: application/json'`
  (expect 401), then restore the original value afterwards.
- **Clean session between negative tests:** every authenticated admin page has a red **Sign Out**
  button top-right; click it rather than clearing storage manually.
- **Chrome URL-bar autocomplete will bite you.** Typing `localhost:3000/admin` frequently
  autocompletes to a previously-visited `/admin/leads` etc. Type the full `http://localhost:3000/...`,
  press `Delete` to drop the inline completion, then `Enter` — and verify the URL in the screenshot.
- Auth card coordinates at 1024x768 maximized: token input ~(511, 279), submit button ~(511, 316).
- Verify a 401 on a mutating route actually blocked the side effect (e.g. after a rejected
  `POST /api/admin/photos/albums`, confirm no new directory under `public/uploads`).

## Devin Secrets Needed

None. `ADMIN_TOKEN` is a value you choose locally in `.env.local`; `RESEND_API_KEY` can be any
non-empty placeholder (`re_test123`) since no mail is actually sent during these tests.
