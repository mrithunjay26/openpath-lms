import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background bg-soft">
      {/* decorative rings */}
      <div
        className="deco-ring -right-32 -top-32 size-96 border-[22px] border-teal/30"
        aria-hidden
      />
      <div
        className="deco-ring -bottom-40 -left-28 size-80 border-[20px] border-pink/30"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to home
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-84px)] w-full max-w-md items-start justify-center px-5 pb-20 pt-6 sm:items-center sm:pt-0">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
