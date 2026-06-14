"use client";

import { useActionState } from "react";
import { addGuardianContactAction, type FormState } from "@/lib/actions/guardians";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function GuardianPanel({
  slug,
  students,
}: {
  slug: string;
  students: Array<{ membershipId: string; name: string; email: string }>;
}) {
  const action = addGuardianContactAction.bind(null, slug);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="success">Guardian contact added.</Alert> : null}
      <div>
        <Label htmlFor="guardian-student">Student</Label>
        <Select id="guardian-student" name="studentId" required>
          {students.map((student) => (
            <option key={student.membershipId} value={student.membershipId}>
              {student.name || student.email}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="guardian-name">Guardian name</Label>
        <Input id="guardian-name" name="name" required />
      </div>
      <div>
        <Label htmlFor="guardian-email">Guardian email</Label>
        <Input id="guardian-email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="guardian-rel">Relationship</Label>
        <Input id="guardian-rel" name="relationship" placeholder="Parent, mentor, counselor" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add guardian"}
      </Button>
    </form>
  );
}
