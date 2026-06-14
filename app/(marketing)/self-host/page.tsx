import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    id: "student-data",
    title: "Student data boundaries",
    body:
      "OpenPath keeps platform accounts, membership, and encrypted tenant configuration in the control plane. Course content, submissions, files, attendance, messages, and portfolio evidence live inside the tenant-owned Firebase project.",
  },
  {
    id: "operations",
    title: "Self-hosting operations",
    body:
      "A workspace owner should maintain their Supabase Postgres, Firebase service account, Storage bucket, Firestore indexes, environment secrets, and backup/deletion process.",
  },
  {
    id: "reporting",
    title: "Impact reporting",
    body:
      "Impact reports summarize reach, participation, submissions, assessment evidence, and skill tags. They are designed as a starting point for grant and nonprofit reporting, not a substitute for legal or compliance review.",
  },
  {
    id: "privacy",
    title: "Privacy posture",
    body:
      "Tenant credentials are encrypted server-side. Students and browsers never receive Firebase service accounts. Administrators should rotate exposed keys, define retention policies, and review FERPA/COPPA obligations with counsel.",
  },
];

export default function SelfHostGuidePage() {
  return (
    <main className="bg-background">
      <Container className="py-16">
        <Badge tone="primary">Guide</Badge>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-ink">
          Self-hosting and privacy guide
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          A practical operating guide for organizations using OpenPath as the
          classroom layer inside StuImpact&apos;s ecosystem.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.id} id={section.id}>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-ink">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {section.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
