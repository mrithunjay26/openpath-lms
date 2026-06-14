import { Suspense } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { isStaff, requireMembership } from "@/lib/tenant";
import { listCourses, listCoursesForStudent, type Course } from "@/lib/firebase-data";
import { createCourseAction } from "@/lib/actions/lms";
import { PageHeader } from "@/components/workspace/page-header";
import { NotConnected } from "@/components/workspace/not-connected";
import { ModalForm } from "@/components/workspace/modal-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const ctx = await requireMembership(workspace);
  const staff = isStaff(ctx.role);
  const connected = ctx.tenant.firebase?.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Courses"
        description={staff ? "Create and manage your courses." : "Your enrolled courses."}
        action={
          staff && connected ? (
            <ModalForm
              triggerLabel="New course"
              title="Create a course"
              submitLabel="Create course"
              action={createCourseAction.bind(null, workspace)}
            >
              <div>
                <Label htmlFor="name">Course name</Label>
                <Input id="name" name="name" placeholder="Algebra II" required />
              </div>
              <div>
                <Label htmlFor="term">Term (optional)</Label>
                <Input id="term" name="term" placeholder="Spring 2026" />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea id="description" name="description" placeholder="What this course covers…" />
              </div>
              <div>
                <Label htmlFor="meetingLink">Meeting link (optional)</Label>
                <Input id="meetingLink" name="meetingLink" type="url" placeholder="https://meet.google.com/…" />
              </div>
              <div>
                <Label htmlFor="skills">Skills taught (optional)</Label>
                <Input id="skills" name="skills" placeholder="e.g. web development, python, writing" />
                <p className="mt-1.5 text-xs text-muted">
                  Comma-separated. Powers opportunity recommendations for
                  students.
                </p>
              </div>
            </ModalForm>
          ) : null
        }
      />

      {!connected ? (
        <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />
      ) : (
        <Suspense fallback={<CoursesSkeleton />}>
          <CoursesGrid
            workspace={workspace}
            tenantId={ctx.tenant.id}
            userId={ctx.user.id}
            staff={staff}
          />
        </Suspense>
      )}
    </div>
  );
}

async function CoursesGrid({
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
  let courses: Course[] = [];
  let loadError: string | null = null;
  try {
    courses = staff
      ? await listCourses(tenantId)
      : await listCoursesForStudent(tenantId, userId);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load courses.";
  }

  if (loadError) return <Alert tone="error">{loadError}</Alert>;
  if (courses.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No courses yet"
        description={
          staff
            ? "Click “New course” to create your first one."
            : "Once you join a course it'll show up here."
        }
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <Link key={c.id} href={`/${workspace}/courses/${c.id}`} className="group">
          <Card className="h-full p-6 transition-transform duration-200 group-hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <BookOpen className="size-5" />
              </span>
              {c.term ? <Badge>{c.term}</Badge> : null}
            </div>
            <h3 className="mt-4 font-bold text-ink">{c.name}</h3>
            {c.description ? (
              <p className="mt-1.5 line-clamp-2 text-sm text-muted">
                {c.description}
              </p>
            ) : null}
          </Card>
        </Link>
      ))}
    </div>
  );
}

function CoursesSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-40" />
      ))}
    </div>
  );
}
