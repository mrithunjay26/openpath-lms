"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { loginSchema, registerSchema } from "@/lib/validations";
import { writeAudit } from "@/lib/audit";

export type AuthActionState = { error?: string } | undefined;

const DB_UNAVAILABLE =
  "The platform database is unreachable right now. Check your Supabase project status, database connection string, or network access to Supabase Postgres ports 6543/5432.";

function sanitizeCallback(url: string) {
  if (url && url.startsWith("/") && !url.startsWith("//")) return url;
  return "/app";
}

function isDatabaseReachabilityError(error: unknown) {
  const text =
    error instanceof Error
      ? `${error.name}\n${error.message}\n${JSON.stringify(error)}`
      : String(error);
  return (
    text.includes("PrismaClientInitializationError") ||
    text.includes("Can't reach database server") ||
    text.includes("P1001")
  );
}

async function databasePreflight(): Promise<AuthActionState> {
  try {
    await prisma.$queryRaw`select 1`;
    return undefined;
  } catch (error) {
    if (isDatabaseReachabilityError(error)) {
      return { error: DB_UNAVAILABLE };
    }
    throw error;
  }
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const data = {
    email: String(formData.get("email") || "").toLowerCase().trim(),
    password: String(formData.get("password") || ""),
  };
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const callbackUrl = sanitizeCallback(String(formData.get("callbackUrl") || ""));
  const db = await databasePreflight();
  if (db?.error) return db;

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (isDatabaseReachabilityError(error)) {
      return { error: DB_UNAVAILABLE };
    }
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  redirect(callbackUrl);
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const data = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").toLowerCase().trim(),
    password: String(formData.get("password") || ""),
  };
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      return {
        error: "An account with this email already exists. Try signing in.",
      };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      },
    });
    await writeAudit({ action: "user.register", actorId: user.id });

    // Auto-accept any pending invitations addressed to this email.
    const invites = await prisma.invitation.findMany({
      where: { email: parsed.data.email, acceptedAt: null },
    });
    if (invites.length > 0) {
      await prisma.$transaction([
        ...invites.map((inv) =>
          prisma.membership.upsert({
            where: {
              userId_tenantId: { userId: user.id, tenantId: inv.tenantId },
            },
            update: { role: inv.role, status: "ACTIVE" },
            create: {
              userId: user.id,
              tenantId: inv.tenantId,
              role: inv.role,
              status: "ACTIVE",
            },
          }),
        ),
        prisma.invitation.updateMany({
          where: { id: { in: invites.map((i) => i.id) } },
          data: { acceptedAt: new Date() },
        }),
      ]);
    }
  } catch (error) {
    if (isDatabaseReachabilityError(error)) {
      return { error: DB_UNAVAILABLE };
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login");
    throw error;
  }

  redirect("/app");
}

export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/app" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
