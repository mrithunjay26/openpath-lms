import "server-only";
import {
  listAssignments,
  listCourses,
  listCoursesForStudent,
} from "@/lib/firebase-data";
import { listAssessments } from "@/lib/firebase-assessments";

export type CalendarItem = {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  type: "assignment" | "quiz";
  dueAt: string;
};

/** Due dates across the courses a user can see, sorted soonest-first. */
export async function getCalendar(
  tenantId: string,
  opts: { staff: boolean; userId: string },
): Promise<CalendarItem[]> {
  const courses = opts.staff
    ? await listCourses(tenantId)
    : await listCoursesForStudent(tenantId, opts.userId);

  const items: CalendarItem[] = [];
  await Promise.all(
    courses.map(async (c) => {
      const [assignments, assessments] = await Promise.all([
        listAssignments(tenantId, c.id),
        listAssessments(tenantId, c.id),
      ]);
      assignments.forEach((a) => {
        if (a.dueAt)
          items.push({
            id: a.id,
            courseId: c.id,
            courseName: c.name,
            title: a.title,
            type: "assignment",
            dueAt: a.dueAt,
          });
      });
      assessments.forEach((a) => {
        if (a.dueAt)
          items.push({
            id: a.id,
            courseId: c.id,
            courseName: c.name,
            title: a.title,
            type: "quiz",
            dueAt: a.dueAt,
          });
      });
    }),
  );

  items.sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
  );
  return items;
}

export function calendarItemHref(
  workspace: string,
  item: CalendarItem,
): string {
  const base = `/${workspace}/courses/${item.courseId}`;
  return item.type === "assignment"
    ? `${base}/assignments/${item.id}`
    : `${base}/assessments/${item.id}`;
}
