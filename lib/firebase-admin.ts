import "server-only";
import {
  cert,
  getApps,
  initializeApp,
  deleteApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getDatabase, type Database } from "firebase-admin/database";
import { getStorage } from "firebase-admin/storage";
import { prisma } from "@/lib/prisma";
import { open, type SealedSecret } from "@/lib/crypto";

/**
 * Per-tenant Firebase Admin access.
 *
 * Each tenant brings their OWN Firebase project. We decrypt their service
 * account on demand (server-only) and initialize a named Admin app cached by
 * tenant id. All tenant data access is mediated here so credentials never leave
 * the server.
 */

type ParsedServiceAccount = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  [k: string]: unknown;
};

type ParsedClientConfig = {
  databaseURL?: string;
  databaseUrl?: string;
  [k: string]: unknown;
};

function toServiceAccount(json: ParsedServiceAccount): ServiceAccount {
  return {
    projectId: json.project_id,
    clientEmail: json.client_email,
    privateKey: json.private_key,
  };
}

function appName(tenantId: string) {
  return `tenant:${tenantId}`;
}

function existingApp(name: string): App | undefined {
  return getApps().find((a) => a.name === name);
}

function databaseUrlForCredential(cred: {
  projectId: string;
  clientConfig: unknown;
}): string | undefined {
  const cfg =
    cred.clientConfig && typeof cred.clientConfig === "object"
      ? (cred.clientConfig as ParsedClientConfig)
      : undefined;
  const explicit = cfg?.databaseURL || cfg?.databaseUrl;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  return cred.projectId ? `https://${cred.projectId}-default-rtdb.firebaseio.com` : undefined;
}

/** Build (or reuse) an Admin app for a tenant from its stored credential. */
export async function appForTenant(tenantId: string): Promise<App> {
  const name = appName(tenantId);
  const found = existingApp(name);
  if (found) return found;

  const cred = await prisma.firebaseCredential.findUnique({
    where: { tenantId },
  });
  if (!cred) {
    throw new Error("This workspace has not connected a Firebase project yet.");
  }

  const sealed: SealedSecret = {
    ciphertext: cred.ciphertext,
    iv: cred.iv,
    authTag: cred.authTag,
    wrappedKey: cred.wrappedKey,
  };
  const sa = JSON.parse(open(sealed)) as ParsedServiceAccount;
  const databaseURL = databaseUrlForCredential({
    projectId: cred.projectId,
    clientConfig: cred.clientConfig,
  });

  return initializeApp(
    {
      credential: cert(toServiceAccount(sa)),
      storageBucket: cred.storageBucket ?? undefined,
      databaseURL,
    },
    name,
  );
}

export async function firestoreForTenant(
  tenantId: string,
): Promise<Firestore> {
  const app = await appForTenant(tenantId);
  return getFirestore(app);
}

export async function databaseForTenant(
  tenantId: string,
): Promise<Database> {
  const app = await appForTenant(tenantId);
  return getDatabase(app);
}

export async function bucketForTenant(tenantId: string) {
  const app = await appForTenant(tenantId);
  return getStorage(app).bucket();
}

export interface VerifyResult {
  ok: boolean;
  projectId?: string;
  error?: string;
}

/**
 * Validate a service-account JSON (and optional bucket) by spinning up a
 * throwaway Admin app, doing a lightweight Firestore + Storage probe, then
 * tearing it down. Used during onboarding before we mark a credential ACTIVE.
 */
export async function verifyServiceAccount(
  serviceAccountJson: string,
  storageBucket?: string,
): Promise<VerifyResult> {
  let parsed: ParsedServiceAccount;
  try {
    parsed = JSON.parse(serviceAccountJson) as ParsedServiceAccount;
  } catch {
    return { ok: false, error: "Service account is not valid JSON." };
  }
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    return {
      ok: false,
      error:
        "Service account JSON is missing project_id, client_email, or private_key.",
    };
  }

  const tempName = `verify:${parsed.project_id}:${Date.now()}`;
  let app: App | undefined;
  try {
    app = initializeApp(
      {
        credential: cert(toServiceAccount(parsed)),
        storageBucket: storageBucket || undefined,
      },
      tempName,
    );

    // Firestore probe (also confirms the API is enabled + creds are valid).
    await getFirestore(app).listCollections();

    // Optional Storage probe.
    if (storageBucket) {
      const [exists] = await getStorage(app).bucket().exists();
      if (!exists) {
        return {
          ok: false,
          projectId: parsed.project_id,
          error: `Storage bucket "${storageBucket}" was not found in this project.`,
        };
      }
    }

    return { ok: true, projectId: parsed.project_id };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error verifying Firebase.";
    return { ok: false, projectId: parsed.project_id, error: message };
  } finally {
    if (app) await deleteApp(app).catch(() => undefined);
  }
}

/** Drop a cached tenant app (e.g. after credentials are rotated). */
export async function disposeTenantApp(tenantId: string) {
  const found = existingApp(appName(tenantId));
  if (found) await deleteApp(found).catch(() => undefined);
}
