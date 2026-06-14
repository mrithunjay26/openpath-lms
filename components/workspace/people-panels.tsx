"use client";

import { useActionState } from "react";
import {
  createJoinCodeAction,
  inviteMemberAction,
  type FormState,
} from "@/lib/actions/people";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function InvitePanel({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    inviteMemberAction.bind(null, slug),
    undefined,
  );
  return (
    <form action={action} className="space-y-3">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.message ? <Alert tone="success">{state.message}</Alert> : null}
      <div>
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          placeholder="student@school.org"
          required
        />
      </div>
      <div>
        <Label htmlFor="invite-role">Role</Label>
        <Select id="invite-role" name="role" defaultValue="STUDENT">
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="TA">TA</option>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Adding…" : "Add / invite"}
      </Button>
    </form>
  );
}

export function JoinCodePanel({
  slug,
  courses,
}: {
  slug: string;
  courses: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createJoinCodeAction.bind(null, slug),
    undefined,
  );
  return (
    <form action={action} className="space-y-3">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.message ? <Alert tone="success">{state.message}</Alert> : null}
      <div>
        <Label htmlFor="jc-course">Enroll into (optional)</Label>
        <Select id="jc-course" name="courseId" defaultValue="">
          <option value="">Workspace only</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={pending}
      >
        {pending ? "Creating…" : "Generate join code"}
      </Button>
    </form>
  );
}
