import "server-only";

function roomSafe(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function jitsiRoom(workspace: string, courseId: string) {
  return `openpath-${roomSafe(workspace)}-${roomSafe(courseId)}`.slice(0, 80);
}

export function jitsiUrl(workspace: string, courseId: string) {
  return `https://meet.jit.si/${jitsiRoom(workspace, courseId)}`;
}
