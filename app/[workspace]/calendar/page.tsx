import { Suspense } from "react";
import Link from "next/link";
import { CalendarClock, ClipboardCheck, FileText } from "lucide-react";
import { isStaff, requireMembership } from "@/lib/tenant";
import { getCalendar, calendarItemHref, type CalendarItem } from "@/lib/calendar";
import { PageHeader } from "@/components/workspace/page-header";
import { NotConnected } from "@/components/workspace/not-connected";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDateTime } from "@/lib/utils";

function dayLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const ctx = await requireMembership(workspace);
  const connected = ctx.tenant.firebase?.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Planning"
        title="Calendar"
        description="A month view for the big picture and an agenda for the next deadlines."
      />
      {!connected ? (
        <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />
      ) : (
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarBody
            workspace={workspace}
            tenantId={ctx.tenant.id}
            userId={ctx.user.id}
            staff={isStaff(ctx.role)}
          />
        </Suspense>
      )}
    </div>
  );
}

async function CalendarBody({
  workspace,
  tenantId,
  userId,
  staff,
}: {
  workspace: string;
  tenantId: string;
  userId: string;
  staff: boolean;
}) {
  const items = await getCalendar(tenantId, { staff, userId });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthItems = items.filter((item) => {
    const d = new Date(item.dueAt);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  });
  const upcoming = items.filter((item) => new Date(item.dueAt).getTime() >= now.getTime());

  const byDay = new Map<number, CalendarItem[]>();
  monthItems.forEach((item) => {
    const day = new Date(item.dueAt).getDate();
    byDay.set(day, [...(byDay.get(day) ?? []), item]);
  });

  const days: Array<Date | null> = [];
  for (let i = 0; i < monthStart.getDay(); i += 1) days.push(null);
  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    days.push(new Date(now.getFullYear(), now.getMonth(), day));
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Nothing due"
        description="When assignments and quizzes get due dates, they'll appear here."
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-3 pb-3">
          <div>
            <CardTitle>{monthLabel(now)}</CardTitle>
            <p className="mt-1 text-sm text-muted">
              {monthItems.length} items due this month
            </p>
          </div>
          <Badge tone="primary">Calendar view</Badge>
        </CardHeader>
        <CardContent className="pt-[var(--workspace-card-padding)]">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wide text-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="pb-1">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`pad-${index}`} className="min-h-28 rounded-[var(--radius-card)]" />;
              }
              const dayItems = byDay.get(date.getDate()) ?? [];
              const isToday =
                date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear();
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "min-h-28 rounded-[var(--radius-card)] border p-2",
                    isToday ? "border-primary bg-primary/8" : "border-line bg-background/50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-semibold", isToday ? "text-primary" : "text-ink")}>
                      {date.getDate()}
                    </span>
                    {dayItems.length > 0 ? (
                      <Badge tone="neutral">{dayItems.length}</Badge>
                    ) : null}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {dayItems.slice(0, 2).map((item) => (
                      <Link
                        key={`${item.type}-${item.id}`}
                        href={calendarItemHref(workspace, item)}
                        className="block rounded-xl bg-surface/80 px-2 py-1 text-left text-xs font-semibold text-ink hover:bg-primary/10"
                      >
                        <span className="flex items-center gap-1.5">
                          {item.type === "quiz" ? (
                            <ClipboardCheck className="size-3.5 text-purple" />
                          ) : (
                            <FileText className="size-3.5 text-primary" />
                          )}
                          <span className="line-clamp-1">{item.title}</span>
                        </span>
                      </Link>
                    ))}
                    {dayItems.length > 2 ? (
                      <p className="px-1 text-[11px] font-semibold text-muted">
                        +{dayItems.length - 2} more
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Agenda</CardTitle>
          <p className="mt-1 text-sm text-muted">
            The next assignments and quizzes in chronological order.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-[var(--workspace-card-padding)]">
          {upcoming.slice(0, 12).map((item) => (
            <Link key={`${item.type}-${item.id}`} href={calendarItemHref(workspace, item)}>
              <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-background/50 p-3 transition-colors hover:border-primary/40">
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-2xl",
                    item.type === "quiz"
                      ? "bg-purple/12 text-purple"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {item.type === "quiz" ? (
                    <ClipboardCheck className="size-5" />
                  ) : (
                    <FileText className="size-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{item.title}</p>
                  <p className="truncate text-xs text-muted">{item.courseName}</p>
                  <p className="mt-1 text-xs text-muted">{dayLabel(new Date(item.dueAt))}</p>
                </div>
                <Badge tone="neutral">{formatDateTime(item.dueAt)}</Badge>
              </div>
            </Link>
          ))}
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">
              Nothing upcoming right now. Add due dates to assignments and quizzes.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Skeleton className="h-[680px]" />
      <Skeleton className="h-[680px]" />
    </div>
  );
}
