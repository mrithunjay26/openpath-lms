"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  Compass,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Route,
  Settings,
  ShieldAlert,
  Sparkles,
  Trophy,
  Users,
  Video,
  X,
} from "lucide-react";
import type { MembershipRole } from "@prisma/client";
import { can, isStaff } from "@/lib/permissions";
import { BurstMark } from "@/components/brand/logo";
import { BackgroundBlobs } from "@/components/brand/background-blobs";
import { cn, initials } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ElementType };

const PRIMARY_COUNT = 4;

export function WorkspaceShell({
  slug,
  name,
  logoUrl,
  role,
  firebaseConnected,
  userMenu,
  children,
}: {
  slug: string;
  name: string;
  logoUrl?: string | null;
  role: MembershipRole;
  firebaseConnected: boolean;
  userMenu: React.ReactNode;
  children: React.ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const base = `/${slug}`;
  const staff = isStaff(role);

  // Ordered by everyday importance; the first few are surfaced as pills, the
  // rest fold into "More" — so the bar stays light no matter the role.
  const nav: NavItem[] = [
    { href: "", label: "Dashboard", icon: LayoutDashboard },
    { href: "/courses", label: staff ? "Courses" : "My courses", icon: BookOpen },
    { href: "/calendar", label: "Calendar", icon: Calendar },
  ];
  if (!staff) {
    nav.push({ href: "/opportunities", label: "Opportunities", icon: Compass });
    nav.push({ href: "/portfolio", label: "Portfolio", icon: Trophy });
    nav.push({ href: "/path", label: "Mastery path", icon: Route });
  }
  if (can(role, "people.manage"))
    nav.push({ href: "/people", label: "People", icon: Users });
  nav.push({ href: "/meetings", label: "Meetings", icon: Video });
  nav.push({ href: "/messages", label: "Messages", icon: MessageCircle });
  nav.push({ href: "/resources", label: "Resources", icon: Sparkles });
  if (staff) {
    nav.push({ href: "/programs", label: "Programs", icon: BookOpen });
    nav.push({ href: "/reports", label: "Reports", icon: FileText });
  }
  if (can(role, "files.manage"))
    nav.push({ href: "/files", label: "Files", icon: FolderOpen });
  if (can(role, "settings.manage"))
    nav.push({ href: "/settings", label: "Settings", icon: Settings });

  const isActive = (href: string) =>
    href === "" ? pathname === base : pathname.startsWith(base + href);

  const primary = nav.slice(0, PRIMARY_COUNT);
  const overflow = nav.slice(PRIMARY_COUNT);
  const moreActive = overflow.some((i) => isActive(i.href));

  return (
    <div className="isolate relative min-h-dvh overflow-hidden">
      <BackgroundBlobs />

      <header className="sticky top-0 z-40 border-b border-line bg-background/90">
        <div className="mx-auto flex h-16 max-w-[var(--workspace-shell-width)] items-center gap-2 px-4 sm:px-6">
          <Link
            href={base}
            className="flex shrink-0 items-center gap-2.5"
            aria-label={`${name} home`}
          >
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-sm font-extrabold text-primary-ink shadow-[var(--shadow-glow)]">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="size-full object-cover" />
              ) : (
                initials(name)
              )}
            </span>
            <span className="hidden max-w-40 truncate font-display text-base font-bold text-ink sm:block">
              {name}
            </span>
          </Link>

          {/* desktop primary nav */}
          <nav className="ml-3 hidden items-center gap-1 lg:flex">
            {primary.map((item) => (
              <NavPill
                key={item.href}
                href={base + item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(item.href)}
              />
            ))}

            {overflow.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-sm font-semibold transition-colors",
                    moreActive || moreOpen
                      ? "bg-primary/15 text-ink"
                      : "text-muted hover:bg-white/5 hover:text-ink",
                  )}
                >
                  More
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      moreOpen && "rotate-180",
                    )}
                  />
                </button>
                {moreOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-0"
                      onClick={() => setMoreOpen(false)}
                    />
                    <div className="absolute right-0 z-10 mt-2 w-56 rounded-2xl border border-line bg-surface p-2 shadow-card">
                      {overflow.map((item) => (
                        <Link
                          key={item.href}
                          href={base + item.href}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                            isActive(item.href)
                              ? "bg-primary/15 text-ink"
                              : "text-muted hover:bg-white/5 hover:text-ink",
                          )}
                        >
                          <item.icon className="size-4" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {userMenu}
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="grid size-10 place-items-center rounded-xl text-ink hover:bg-white/5 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {role === "OWNER" && !firebaseConnected ? (
        <Link
          href={`${base}/settings/firebase`}
          className="flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/15"
        >
          <ShieldAlert className="size-4" />
          Connect your Firebase to enable courses, files & assignments →
        </Link>
      ) : null}

      {/* mobile drawer */}
      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-bgdeep/70 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-72 flex-col bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line p-4">
              <span className="flex items-center gap-2 font-display font-bold text-ink">
                <BurstMark size={26} /> {name}
              </span>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                className="grid size-9 place-items-center rounded-xl text-muted hover:bg-white/5 hover:text-ink"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={base + item.href}
                  onClick={() => setDrawer(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    isActive(item.href)
                      ? "bg-primary/15 text-ink"
                      : "text-muted hover:bg-white/5 hover:text-ink",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      <main
        className="relative z-10 mx-auto px-4 py-7 sm:px-6 lg:px-10"
        style={{ maxWidth: "var(--workspace-shell-width)" }}
      >
        {children}
      </main>
    </div>
  );
}

function NavPill({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-pill px-3.5 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-primary/15 text-ink"
          : "text-muted hover:bg-white/5 hover:text-ink",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
