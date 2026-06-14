import { redirect } from "next/navigation";
import { can, requireMembership } from "@/lib/tenant";
import { PROGRAM_TEMPLATES } from "@/lib/program-templates";
import { createProgramFromTemplateAction } from "@/lib/actions/programs";
import { PageHeader } from "@/components/workspace/page-header";
import { NotConnected } from "@/components/workspace/not-connected";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProgramsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const ctx = await requireMembership(workspace);
  if (!can(ctx.role, "course.create")) redirect(`/${workspace}`);
  if (ctx.tenant.firebase?.status !== "ACTIVE") {
    return <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Program templates"
        description="Launch a structured StuImpact-style program with courses, modules, lessons, assignments, and skill tags."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {PROGRAM_TEMPLATES.map((template) => (
          <Card key={template.id}>
            <CardContent className="space-y-4 p-5">
              <div>
                <Badge tone="purple">{template.term}</Badge>
                <h2 className="mt-3 text-lg font-bold text-ink">{template.name}</h2>
                <p className="mt-1 text-sm text-muted">{template.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.skills.map((skill) => (
                  <Badge key={skill} tone="teal">
                    {skill}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted">
                {template.modules.length} modules · {template.assignments.length} assignments
              </p>
              <form action={createProgramFromTemplateAction.bind(null, workspace, template.id)}>
                <Button type="submit">Create program</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
