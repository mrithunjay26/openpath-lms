import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { GoogleButton } from "@/components/auth/google-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { googleEnabled } from "@/auth";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <div className="animate-rise">
      <div className="mb-6 text-center">
        <Badge tone="primary" className="mb-3">
          Start free
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 text-muted">
          Sign up to join or manage a workspace.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <SignupForm />

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
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
