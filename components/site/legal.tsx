import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <Container className="max-w-3xl py-16">
      <Badge tone="primary">Legal</Badge>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated {updated}</p>

      <Alert tone="warning" className="mt-6">
        This document is a starting template provided for convenience and is not
        legal advice. Have it reviewed by qualified counsel — especially the
        sections on student and children&apos;s data — before relying on it in
        production.
      </Alert>

      <div className="mt-10 space-y-4 leading-relaxed text-muted [&_a]:font-semibold [&_a]:text-primary hover:[&_a]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-ink [&_li]:marker:text-muted/60 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
        {children}
      </div>
    </Container>
  );
}
