-- Supabase Security Advisor hardening for OpenPath's Prisma/Auth.js tables.
--
-- OpenPath uses Supabase as managed Postgres through Prisma, not Supabase Auth
-- or client-side PostgREST access. Enabling RLS with no public policies blocks
-- anon/authenticated API reads of these control-plane tables while preserving
-- server-side Prisma access through the database connection.

alter table public."User" enable row level security;
alter table public."Account" enable row level security;
alter table public."Session" enable row level security;
alter table public."VerificationToken" enable row level security;
alter table public."Tenant" enable row level security;
alter table public."FirebaseCredential" enable row level security;
alter table public."TenantAIConfig" enable row level security;
alter table public."Membership" enable row level security;
alter table public."Invitation" enable row level security;
alter table public."JoinCode" enable row level security;
alter table public."AuditLog" enable row level security;
alter table public."GuardianContact" enable row level security;
