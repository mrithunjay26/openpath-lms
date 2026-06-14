"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, LayoutGrid, MoonStar, Paintbrush, SunMedium } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { signOutAction } from "@/lib/actions/auth";

type ThemeMode = "light" | "dark";
const THEME_KEY = "openpath-theme-mode";

export function UserMenu({
  name,
  email,
  image,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    const mode: ThemeMode =
      stored === "light" || stored === "dark"
        ? stored
        : document.documentElement.dataset.themeMode === "light"
          ? "light"
          : "light";
    setThemeMode(mode);
  }, []);

  const applyMode = (mode: ThemeMode) => {
    window.localStorage.setItem(THEME_KEY, mode);
    document.documentElement.dataset.themeMode = mode;
    document.documentElement.style.colorScheme = mode;
    setThemeMode(mode);
    setAppearanceOpen(false);
  };

  const modeLabel = useMemo(
    () => (themeMode === "light" ? "Light mode" : "Dark mode"),
    [themeMode],
  );

  return (
    <details ref={detailsRef} className="group relative [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-pill border border-line bg-surface py-1.5 pl-1.5 pr-3 shadow-sm transition-colors hover:border-ink/20">
        <Avatar name={name} email={email} src={image} className="size-7" />
        <span className="hidden max-w-32 truncate text-sm font-semibold text-ink sm:block">
          {name || email}
        </span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-line bg-surface p-2 shadow-card">
        <div className="border-b border-line px-3 py-2.5">
          <p className="truncate text-sm font-bold text-ink">{name || "Account"}</p>
          <p className="truncate text-xs text-muted">{email}</p>
        </div>
        <Link
          href="/app"
          className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink hover:bg-ink/5"
        >
          <LayoutGrid className="size-4 text-muted" />
          Your workspaces
        </Link>
        <button
          type="button"
          onClick={() => {
            detailsRef.current?.removeAttribute("open");
            setAppearanceOpen(true);
          }}
          className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink hover:bg-ink/5"
        >
          <Paintbrush className="size-4 text-muted" />
          Appearance
        </button>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
      </div>
      <Modal
        open={appearanceOpen}
        onClose={() => setAppearanceOpen(false)}
        title="Appearance"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Choose how OpenPath looks across your browser. This is saved on this
            device.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => applyMode("light")}
              className={`rounded-[var(--radius-card)] border p-4 text-left transition-colors ${
                themeMode === "light"
                  ? "border-primary bg-primary/10"
                  : "border-line bg-surface hover:border-primary/40"
              }`}
            >
              <SunMedium className="size-5 text-yellow" />
              <p className="mt-3 font-bold text-ink">Light mode</p>
              <p className="mt-1 text-sm text-muted">
                Bright canvas, softer contrast, and airy panels.
              </p>
            </button>
            <button
              type="button"
              onClick={() => applyMode("dark")}
              className={`rounded-[var(--radius-card)] border p-4 text-left transition-colors ${
                themeMode === "dark"
                  ? "border-primary bg-primary/10"
                  : "border-line bg-surface hover:border-primary/40"
              }`}
            >
              <MoonStar className="size-5 text-primary" />
              <p className="mt-3 font-bold text-ink">Dark mode</p>
              <p className="mt-1 text-sm text-muted">
                The original aurora canvas with richer contrast.
              </p>
            </button>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-line bg-background/50 px-4 py-3">
            <span className="text-sm text-muted">Active</span>
            <span className="text-sm font-semibold text-ink">{modeLabel}</span>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setAppearanceOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </details>
  );
}
