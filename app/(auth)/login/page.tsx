import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";
import { Card } from "@/components/ui/card";
import { googleEnabled } from "@/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="animate-rise">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-muted">Sign in to your OpenPath account.</p>
      </div>

      <Card className="p-6 sm:p-8">
        <LoginForm callbackUrl={callbackUrl} />

        {googleEnabled ? (
          <>
            <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted/70">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>
            <GoogleButton />
          </>
        ) : null}
      </Card>

      <p className="mt-6 text-center text-sm text-muted">
        New to OpenPath?{" "}
        <Link
          href="/signup"
          className="font-semibold text-primary hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
