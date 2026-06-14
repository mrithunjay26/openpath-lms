import type { MembershipRole } from "@prisma/client";

/**
 * Single source of truth for what each role can do. Roles (UI labels):
 *   Admin (OWNER) · Teacher · TA · Student
 * Use `can(role, capability)` everywhere instead of ad-hoc role lists so the
 * tiers stay legible and consistent across the app.
 */
export type Capability =
  | "course.create" // create / archive courses
  | "content.author" // modules, lessons, assignments, quizzes, announcements
  | "grade.write" // grade work, leave feedback
  | "people.manage" // invite, remove, join codes
  | "files.manage" // upload, folders, rename, delete
  | "settings.manage" // branding, Firebase, AI, roles
  | "billing"; // ownership

const MATRIX: Record<MembershipRole, Capability[]> = {
  OWNER: [
    "course.create",
    "content.author",
    "grade.write",
    "people.manage",
    "files.manage",
    "settings.manage",
    "billing",
  ],
  TEACHER: [
    "course.create",
    "content.author",
    "grade.write",
    "people.manage",
    "files.manage",
  ],
  TA: ["content.author", "grade.write", "files.manage"],
  STUDENT: [],
};

export function can(role: MembershipRole, capability: Capability): boolean {
  return MATRIX[role]?.includes(capability) ?? false;
}

/** A "manager" can run the people/roster side (Admins & Teachers). */
export function canManage(role: MembershipRole): boolean {
  return can(role, "people.manage");
}

/** Staff = anyone with a teaching surface (everyone except students). */
export function isStaff(role: MembershipRole): boolean {
  return role !== "STUDENT";
}

export const ROLE_LABELS: Record<MembershipRole, string> = {
  OWNER: "Admin",
  TEACHER: "Teacher",
  TA: "TA",
  STUDENT: "Student",
};

export function roleLabel(role: MembershipRole): string {
  return ROLE_LABELS[role] ?? role;
}

/** Ordering + human descriptions for the Roles & permissions matrix UI. */
export const MATRIX_ROLES: MembershipRole[] = [
  "OWNER",
  "TEACHER",
  "TA",
  "STUDENT",
];

export const CAPABILITY_ROWS: { key: Capability; label: string; help: string }[] =
  [
    {
      key: "course.create",
      label: "Create & manage courses",
      help: "Start new courses and edit course settings",
    },
    {
      key: "content.author",
      label: "Author content",
      help: "Modules, lessons, assignments, quizzes, announcements",
    },
    {
      key: "grade.write",
      label: "Grade & give feedback",
      help: "Score submissions and quiz attempts",
    },
    {
      key: "files.manage",
      label: "Manage files",
      help: "Upload, organize, rename, and delete files",
    },
    {
      key: "people.manage",
      label: "Manage people",
      help: "Invite or remove members, create join codes",
    },
    {
      key: "settings.manage",
      label: "Workspace settings",
      help: "Branding, Firebase, AI, and roles",
    },
    { key: "billing", label: "Ownership", help: "Owns the workspace" },
  ];

export const ROLE_SUMMARY: Record<MembershipRole, string> = {
  OWNER: "Full control of the workspace, people, settings, and billing.",
  TEACHER: "Runs courses end to end: content, grading, and their roster.",
  TA: "Helps teach — authors content, grades, and manages files.",
  STUDENT: "Takes courses, submits work, and joins discussions.",
};
