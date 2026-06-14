import { can, isStaff, requireMembership } from "@/lib/tenant";
import { listCourses, listCoursesForStudent, listEnrollments } from "@/lib/firebase-data";
import { listAttendance } from "@/lib/firebase-attendance";
import { markAttendanceDirectAction } from "@/lib/actions/meetings";
import { jitsiUrl } from "@/lib/video";
import { PageHeader } from "@/components/workspace/page-header";
import { NotConnected } from "@/components/workspace/not-connected";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";

export default async function MeetingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const ctx = await requireMembership(workspace);
  const staff = isStaff(ctx.role);
  if (ctx.tenant.firebase?.status !== "ACTIVE") {
    return <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />;
  }
  const courses = staff
    ? await listCourses(ctx.tenant.id)
    : await listCoursesForStudent(ctx.tenant.id, ctx.user.id);
  const canMark = can(ctx.role, "grade.write");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Meetings & attendance"
        description="No-key Jitsi rooms for live sessions, plus simple attendance records."
      />
      <div className="space-y-5">
        {courses.map(async (course) => {
          const [roster, attendance] = await Promise.all([
            canMark ? listEnrollments(ctx.tenant.id, course.id).catch(() => []) : Promise.resolve([]),
            listAttendance(ctx.tenant.id, course.id).catch(() => []),
          ]);
          return (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle>{course.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={course.meetingLink || jitsiUrl(workspace, course.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-pill bg-primary px-5 text-sm font-semibold text-primary-ink"
                  >
                    Join meeting
                  </a>
                  <Badge tone="teal">
                    {course.meetingLink ? "Custom link" : "Jitsi room"}
                  </Badge>
                </div>
                {canMark ? (
                  <div className="space-y-2 border-t border-line pt-4">
                    <p className="text-sm font-bold text-ink">Mark attendance</p>
                    {roster.filter((r) => r.role === "STUDENT").map((student) => (
                      <form
                        key={student.userId}
                        action={markAttendanceDirectAction.bind(null, workspace, course.id)}
                        className="grid gap-2 rounded-2xl bg-cream/50 p-3 md:grid-cols-[1fr_150px_210px_auto]"
                      >
                        <input type="hidden" name="userId" value={student.userId} />
                        <input type="hidden" name="name" value={student.name} />
                        <input type="hidden" name="email" value={student.email} />
                        <p className="text-sm font-semibold text-ink">{student.name || student.email}</p>
                        <Select name="status" defaultValue="PRESENT" className="h-9">
                          <option value="PRESENT">Present</option>
                          <option value="LATE">Late</option>
                          <option value="ABSENT">Absent</option>
                        </Select>
                        <Input name="meetingAt" type="datetime-local" className="h-9" />
                        <Button type="submit" size="sm" variant="outline">
                          Save
                        </Button>
                      </form>
                    ))}
                  </div>
                ) : null}
                {attendance.length > 0 ? (
                  <div className="border-t border-line pt-4">
                    <p className="mb-2 text-sm font-bold text-ink">Recent attendance</p>
                    <div className="space-y-2">
                      {attendance.slice(0, 6).map((row) => (
                        <div key={row.id} className="flex items-center justify-between rounded-2xl bg-background/60 px-3 py-2 text-sm">
                          <span className="font-semibold text-ink">{row.name || row.email}</span>
                          <span className="text-muted">
                            {row.status} · {row.markedAt ? formatDateTime(row.markedAt) : "saved"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
