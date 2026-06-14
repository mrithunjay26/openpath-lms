import { getTenantContext } from "@/lib/tenant";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { UserMenu } from "@/components/app/user-menu";
import { readTheme, themeVars } from "@/lib/theme";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const ctx = await getTenantContext(workspace);
  const theme = readTheme(ctx.tenant.theme);

  return (
    <div style={themeVars(theme)} className="min-h-dvh bg-background">
      <WorkspaceShell
        slug={ctx.tenant.slug}
        name={ctx.tenant.name}
        logoUrl={ctx.tenant.logoUrl}
        role={ctx.role}
        firebaseConnected={ctx.tenant.firebase?.status === "ACTIVE"}
        userMenu={
          <UserMenu
            name={ctx.user.name}
            email={ctx.user.email}
            image={ctx.user.image}
          />
        }
      >
        {children}
      </WorkspaceShell>
    </div>
  );
}
