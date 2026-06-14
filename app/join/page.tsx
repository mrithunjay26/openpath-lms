import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Ticket } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { JoinForm } from "@/components/workspace/join-form";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Join a workspace" };

export default async function JoinPage() {
  await requireUser("/join");

  return (
    <div className="min-h-dvh bg-soft">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo href="/app" />
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Your workspaces
        </Link>
      </header>

      <Container className="max-w-md py-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Ticket className="size-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Enter your join code
          </h1>
          <p className="mt-2 text-muted">
            Your teacher gave you a code to join their class.
          </p>
        </div>
        <Card className="p-6 sm:p-8">
          <JoinForm />
        </Card>
      </Container>
    </div>
  );
}
