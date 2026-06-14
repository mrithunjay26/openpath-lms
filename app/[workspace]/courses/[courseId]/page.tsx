import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  Megaphone,
  Users,
  Video,
} from "lucide-react";
import { isStaff, requireMembership } from "@/lib/tenant";
import {
  getCourse,
  listAnnouncements,
  listAssignments,
  listEnrollments,
  type Announcement,
  type Assignment,
  type Enrollment,
} from "@/lib/firebase-data";
import {
  createAnnouncementAction,
  createAssignmentAction,
} from "@/lib/actions/lms";
import { PageHeader } from "@/components/workspace/page-header";
import { NotConnected } from "@/components/workspace/not-connected";
import { CourseTabs } from "@/components/workspace/course-tabs";
import { ModalForm } from "@/components/workspace/modal-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ workspace: string; courseId: string }>;
}) {
  const { workspace, courseId } = await params;
  const ctx = await requireMembership(workspace);
  const staff = isStaff(ctx.role);

  if (ctx.tenant.firebase?.status !== "ACTIVE") {
    return (
      <div className="mx-auto max-w-5xl">
        <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/${workspace}/courses`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> All courses
      </Link>
      <CourseTabs workspace={workspace} courseId={courseId} staff={staff} />

      <Suspense fallback={<CourseSkeleton staff={staff} />}>
        <CourseBody
          workspace={workspace}
          courseId={courseId}
          tenantId={ctx.tenant.id}
          staff={staff}
        />
      </Suspense>
    </div>
  );
}

async function CourseBody({
  workspace,
  courseId,
  tenantId,
  staff,
}: {
  workspace: string;
  courseId: string;
  tenantId: string;
  staff: boolean;
}) {
  // Fetch everything in parallel so the title paints after one round-trip.
  const [course, assignments, announcements, roster] = await Promise.all([
    getCourse(tenantId, courseId),
    listAssignments(tenantId, courseId),
    listAnnouncements(tenantId, courseId),
    staff ? listEnrollments(tenantId, courseId) : Promise.resolve([]),
  ]);
  if (!course) notFound();

  return (
    <>
      <PageHeader
        title={course.name}
        description={course.description || undefined}
        action={
          course.meetingLink ? (
            <a
              href={course.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Video className="size-4" /> Join meeting
            </a>
          ) : null
        }
      />
      {course.term ? <Badge className="mb-4">{course.term}</Badge> : null}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Section
            icon={FileText}
            title="Assignments"
            action={
              staff ? (
                <ModalForm
                  triggerLabel="New"
                  triggerSize="sm"
                  title="New assignment"
                  submitLabel="Create assignment"
                  action={createAssignmentAction.bind(null, workspace, courseId)}
                >
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" placeholder="Problem set 4" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="points">Points</Label>
                      <Input id="points" name="points" type="number" min={0} placeholder="100" />
                    </div>
                    <div>
                      <Label htmlFor="dueAt">Due date</Label>
                      <Input id="dueAt" name="dueAt" type="datetime-local" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="details">Details</Label>
                    <Textarea id="details" name="details" placeholder="Instructions…" />
                  </div>
                </ModalForm>
              ) : null
            }
          >
            {assignments.length === 0 ? (
              <EmptyState icon={FileText} title="No assignments yet" />
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => (
                  <AssignmentRow
                    key={a.id}
                    workspace={workspace}
                    courseId={courseId}
                    assignment={a}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section
            icon={Megaphone}
            title="Announcements"
            action={
              staff ? (
                <ModalForm
                  triggerLabel="Post"
                  triggerSize="sm"
                  triggerVariant="outline"
                  title="Post an announcement"
                  submitLabel="Post"
                  action={createAnnouncementAction.bind(null, workspace, courseId)}
                >
                  <div>
                    <Label htmlFor="a-title">Title</Label>
                    <Input id="a-title" name="title" placeholder="Reminder…" required />
                  </div>
                  <div>
                    <Label htmlFor="a-body">Message</Label>
                    <Textarea id="a-body" name="body" rows={5} required />
                  </div>
                </ModalForm>
              ) : null
            }
          >
            {announcements.length === 0 ? (
              <EmptyState icon={Megaphone} title="No announcements yet" />
            ) : (
              <div className="space-y-3">
                {announcements.map((n) => (
                  <AnnouncementItem key={n.id} announcement={n} />
                ))}
              </div>
            )}
          </Section>
        </div>

        {staff ? (
          <div>
            <Section icon={Users} title={`Roster (${roster.length})`}>
              {roster.length === 0 ? (
                <p className="text-sm text-muted">
                  No students enrolled yet. Share a join code from the People
                  page.
                </p>
              ) : (
                <ul className="space-y-3">
                  {roster.map((r) => (
                    <RosterItem key={r.userId} enrollment={r} />
                  ))}
                </ul>
              )}
            </Section>
          </div>
        ) : null}
      </div>
    </>
  );
}

function CourseSkeleton({ staff }: { staff: boolean }) {
  return (
    <div>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-80" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        {staff ? <Skeleton className="h-40" /> : null}
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <Icon className="size-5 text-primary" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function AssignmentRow({
  workspace,
  courseId,
  assignment,
}: {
  workspace: string;
  courseId: string;
  assignment: Assignment;
}) {
  const overdue = assignment.dueAt && new Date(assignment.dueAt) < new Date();
  return (
    <Link
      href={`/${workspace}/courses/${courseId}/assignments/${assignment.id}`}
      className="block"
    >
      <Card className="flex items-center gap-4 p-4 transition-transform duration-200 hover:-translate-y-0.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{assignment.title}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            {assignment.dueAt ? (
              <>
                <CalendarClock className="size-3.5" />
                <span className={cn(overdue && "text-rose-600")}>
                  Due {formatDateTime(assignment.dueAt)}
                </span>
              </>
            ) : (
              "No due date"
            )}
          </p>
        </div>
        {assignment.points != null ? (
          <Badge tone="neutral">{assignment.points} pts</Badge>
        ) : null}
      </Card>
    </Link>
  );
}

function AnnouncementItem({ announcement }: { announcement: Announcement }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-ink">{announcement.title}</h3>
        <span className="text-xs text-muted">
          {formatDate(announcement.createdAt)}
        </span>
      </div>
      <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted">
        {announcement.body}
      </p>
      <p className="mt-3 text-xs font-semibold text-muted">
        — {announcement.authorName}
      </p>
    </Card>
  );
}

function RosterItem({ enrollment }: { enrollment: Enrollment }) {
  return (
    <li className="flex items-center gap-3">
      <Avatar name={enrollment.name} email={enrollment.email} className="size-8" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">
          {enrollment.name || enrollment.email}
        </p>
        <p className="truncate text-xs text-muted">{enrollment.email}</p>
      </div>
    </li>
  );
}
