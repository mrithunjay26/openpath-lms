// One-time local setup: create a .env with strong generated secrets.
// Safe to re-run — it never overwrites an existing .env.
import crypto from "node:crypto";
import fs from "node:fs";

const path = ".env";
if (fs.existsSync(path)) {
  console.log(".env already exists — leaving it untouched.");
  process.exit(0);
}

const enc = crypto.randomBytes(32).toString("base64");
const sec = crypto.randomBytes(32).toString("base64");

const content = `# Auto-generated local dev env. Replace DATABASE_URL/DIRECT_URL with your
# Supabase connection strings to enable sign-up, onboarding, and the LMS.
DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/openpath?schema=public"
DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/openpath?schema=public"
AUTH_SECRET="${sec}"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
OPENPATH_ENC_KEY="${enc}"
NEXT_PUBLIC_SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_STORAGE_BUCKET="branding"
`;

fs.writeFileSync(path, content);
console.log("Wrote .env with generated AUTH_SECRET and OPENPATH_ENC_KEY.");
