"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function CourseTabs({
  workspace,
  courseId,
  staff,
}: {
  workspace: string;
  courseId: string;
  staff: boolean;
}) {
  const pathname = usePathname();
  const base = `/${workspace}/courses/${courseId}`;
  const tabs: { href: string; label: string; exact?: boolean }[] = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/modules`, label: "Modules" },
    { href: `${base}/assessments`, label: "Quizzes" },
    { href: `${base}/discussions`, label: "Discussions" },
    ...(staff ? [{ href: `${base}/gradebook`, label: "Gradebook" }] : []),
  ];
  const isActive = (t: { href: string; exact?: boolean }) =>
    t.exact ? pathname === t.href : pathname.startsWith(t.href);

  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
            isActive(t)
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-ink",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
