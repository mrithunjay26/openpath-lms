import { Skeleton } from "@/components/ui/skeleton";

// Shown instantly while any workspace tab's data loads — the persistent shell
// (sidebar/topbar) stays put, so navigation feels immediate.
export default function WorkspaceLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Skeleton className="h-40 w-full" />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-52" />
          <Skeleton className="h-72" />
        </div>
      </div>
    </div>
  );
}
