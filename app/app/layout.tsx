import { Logo } from "@/components/brand/logo";
import { UserMenu } from "@/components/app/user-menu";
import { BackgroundBlobs } from "@/components/brand/background-blobs";
import { requireUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/app");

  return (
    <div className="isolate relative min-h-dvh overflow-hidden bg-soft">
      <BackgroundBlobs className="opacity-70" />
      <header className="relative z-40 border-b border-line/70 bg-background/95">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Logo href="/app" />
          <UserMenu name={user.name} email={user.email} image={user.image} />
        </div>
      </header>
      <main className="relative z-10">{children}</main>
    </div>
  );
}
