import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function getSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Require an authenticated user or redirect to login. */
export async function requireUser(callbackUrl?: string) {
  const user = await getCurrentUser();
  if (!user?.id) {
    redirect(
      callbackUrl
        ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/login",
    );
  }
  return user;
}
