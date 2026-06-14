# OpenPath LMS

OpenPath is a multi-tenant learning management platform for educators, cohort programs, nonprofits, and student communities. It lets each workspace bring its own Firebase project, customize branding, manage people and roles, and run course operations through a shared Next.js control plane.

This repository is a migration-focused rebuild of an earlier Flask application. The rewrite moves the project from a single-tenant Python app with tightly coupled Firebase logic into a modular web platform with typed data models, server actions, tenant-aware routing, encrypted credential storage, and a modern React interface.

## What It Does

- Creates tenant workspaces with custom slugs, branding, and membership roles
- Supports email/password auth and optional Google OAuth through Auth.js
- Stores platform accounts, workspaces, memberships, invitations, join codes, and audit logs in Postgres through Prisma
- Lets each workspace connect its own Firebase project for course data, discussions, files, assessments, attendance, messaging, and gradebook workflows
- Encrypts tenant Firebase service-account credentials before storing them
- Includes course pages, assignment submissions, assessments, gradebook views, discussions, file management, people management, reports, messaging, opportunities, and admin surfaces
- Includes a self-hosting page and legal pages for privacy and terms drafts

## Tech Stack

- Next.js 15 App Router
- React 19 and TypeScript
- Tailwind CSS v4
- Prisma with Supabase/Postgres
- Auth.js / NextAuth v5
- Firebase Admin SDK
- MongoDB-backed opportunities integration
- AES-256-GCM envelope encryption for tenant secrets

## Architecture

OpenPath splits platform data from workspace learning data.

```text
Control plane
  Postgres via Prisma
  Users, sessions, tenants, memberships, invitations, join codes,
  encrypted Firebase credentials, AI settings, and audit logs

Tenant data plane
  Each workspace's Firebase project
  Courses, assignments, submissions, files, discussions, attendance,
  assessments, messages, and gradebook records

Application layer
  Next.js routes, server actions, Auth.js sessions, tenant-aware helpers,
  Firebase Admin adapters, and UI components
```

Key directories:

```text
app/(marketing)        Landing, privacy, terms, and self-host pages
app/(auth)             Login and signup
app/app                Workspace switcher
app/onboarding         Workspace creation
app/[workspace]        Tenant dashboard and LMS surfaces
components/            UI, auth, marketing, onboarding, and workspace components
lib/actions/           Server actions for tenant, LMS, files, people, messages, and AI
lib/firebase-*.ts      Firebase Admin data-plane adapters
prisma/schema.prisma   Postgres control-plane schema
scripts/               Local setup and database utility scripts
```

## Local Setup

```bash
npm install
node scripts/gen-env.mjs
npx prisma db push
npm run dev
```

Open `http://localhost:3000`.

`scripts/gen-env.mjs` creates a local `.env` with generated development secrets. Replace the placeholder database URLs before running Prisma against a real database.

## Environment Variables

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled Postgres connection string for the app |
| `DIRECT_URL` | Direct Postgres connection string for Prisma migrations |
| `AUTH_SECRET` | Auth.js signing secret |
| `AUTH_URL` | Base URL of the app |
| `AUTH_GOOGLE_ID` | Optional Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Optional Google OAuth client secret |
| `OPENPATH_ENC_KEY` | Base64 32-byte key for tenant credential encryption |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional Supabase project URL for branding uploads |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional Supabase service-role key for server-side storage actions |
| `SUPABASE_STORAGE_BUCKET` | Bucket used for branding assets |
| `RESEND_API_KEY` | Optional email provider key |
| `EMAIL_FROM` | Sender identity for outbound email |
| `OPENPATH_EMAIL_NOTIFICATIONS` | Set to `on` to enable notification sending |
| `MONGODB_URI` | Optional opportunities database connection string |
| `MONGODB_DB` | Opportunities database name |
| `MONGODB_COLLECTION` | Opportunities collection name |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma client and build the Next.js app |
| `npm run start` | Run the production build |
| `npm run typecheck` | Run TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push the Prisma schema to the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:check` | Validate database connectivity |

## Security Model

- Tenant Firebase service-account JSON is accepted only through server-side workspace settings.
- Tenant credentials are encrypted with AES-256-GCM envelope encryption in `lib/crypto.ts`.
- Firebase credentials are decrypted server-side on demand and are never sent to the browser.
- Tenant mutations flow through authenticated server actions and tenant permission helpers.
- Real `.env` files, local migration references, and local credential files are ignored by Git.

## Migration Notes

The earlier Flask version is intentionally not part of the public source tree. This repo keeps the migrated platform code focused on the current Next.js architecture while preserving the important product direction from the original app: self-serve education workspaces, Firebase-backed classroom data, and fast setup for small teams.

## Current Status

The app typechecks and builds with generated Prisma types. The remaining work is mostly production hardening:

- Add integration tests around tenant permissions and server actions
- Add a seed/demo workspace for local review
- Expand deployment docs for Vercel/Supabase/Firebase setup
- Replace draft legal pages with reviewed copy before production use
- Decide whether to split background jobs, email delivery, and analytics into separate services
