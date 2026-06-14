import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  ClipboardCheck,
  Compass,
  Database,
  FileText,
  FolderOpen,
  GraduationCap,
  HeartHandshake,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-soft">
        <div
          className="deco-ring -right-40 top-10 size-[28rem] border-[26px] border-teal/25"
          aria-hidden
        />
        <div
          className="deco-ring -left-40 top-72 size-[22rem] border-[22px] border-pink/25"
          aria-hidden
        />

        <Container className="relative grid items-center gap-14 py-20 lg:grid-cols-2 lg:py-28">
          <div className="animate-rise">
            <Badge tone="primary" className="gap-1.5">
              <Sparkles className="size-3.5" /> A StuImpact project
            </Badge>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Learning spaces for
              <br />
              <span className="text-gradient">teachers, students, and programs</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              OpenPath gives educators, nonprofits, cohorts, and students one
              place for courses, assignments, messaging, calendar, and
              opportunities. Educators create the space, learners join it, and
              everyone stays focused on what comes next.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className={buttonVariants({ variant: "accent", size: "lg" })}>
                Get started
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/join" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Join with a code
              </Link>
              <Link
                href="#features"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                See features
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-2.5">
              <StatChip icon={ShieldCheck} label="Your Firebase, encrypted" />
              <StatChip icon={Palette} label="Brandable workspace chrome" />
              <StatChip icon={GraduationCap} label="Built for learning teams" />
            </div>
          </div>

          <HeroPreview />
        </Container>
      </section>

      <section id="features" className="scroll-mt-20 py-20 lg:py-28">
        <Container>
          <SectionHeading
            eyebrow="Everything you need"
            title="A complete learning platform"
            subtitle="Designed for classrooms, nonprofits, cohorts, and students who need a focused LMS with an opportunity layer."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Database}
              tone="primary"
              title="Bring your own Firebase"
              desc="Connect your Firebase project for files and class data. Your workspace stays in your stack."
            />
            <FeatureCard
              icon={Palette}
              tone="pink"
              title="Brand it your way"
              desc="Pick your colors and logo. Workspace chrome adapts to your organization."
            />
            <FeatureCard
              icon={FileText}
              tone="teal"
              title="Assignments & submissions"
              desc="Create assignments with due dates, collect file submissions, and leave grades and feedback."
            />
            <FeatureCard
              icon={ClipboardCheck}
              tone="purple"
              title="Assessments & quizzes"
              desc="Build quizzes with multiple question types, timing, and auto-grading for objective questions."
            />
            <FeatureCard
              icon={BarChart3}
              tone="green"
              title="Gradebook"
              desc="Track performance across assignments and assessments with weighted grading."
            />
            <FeatureCard
              icon={FolderOpen}
              tone="yellow"
              title="Files & resources"
              desc="A full file manager backed by your storage with folders, uploads, downloads, and shared notes."
            />
          </div>
        </Container>
      </section>

      <section id="how" className="scroll-mt-20 bg-cream/50 py-20 lg:py-28">
        <Container>
          <SectionHeading
            eyebrow="How it works"
            title="From sign-up to a live workspace"
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <Step
              n={1}
              title="Sign up or join"
              desc="Students and staff can join with a code; educators can create a workspace when they need one."
            />
            <Step
              n={2}
              title="Connect your Firebase"
              desc="Paste your service account. We encrypt it at rest and verify the connection before anything goes live."
            />
            <Step
              n={3}
              title="Brand it & invite"
              desc="Set your colors and logo, create courses, and invite learners with a join code."
            />
          </div>
        </Container>
      </section>

      <section id="use-cases" className="scroll-mt-20 py-20 lg:py-28">
        <Container>
          <SectionHeading
            eyebrow="Built for every audience"
            title="One platform, many learning models"
            subtitle="OpenPath adapts to teachers, students, nonprofits, and family support systems."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <UseCase
              icon={GraduationCap}
              title="Tutors"
              desc="Run sessions, share resources, and track each learner's progress."
            />
            <UseCase
              icon={HeartHandshake}
              title="Nonprofits"
              desc="Coordinate volunteer teachers and programs at low cost."
            />
            <UseCase
              icon={Building2}
              title="Schools"
              desc="Give every teacher a branded, self-managed classroom."
            />
            <UseCase
              icon={Users}
              title="Clubs & cohorts"
              desc="Perfect for student-led learning communities and programs."
            />
          </div>
        </Container>
      </section>

      <section className="pb-20 lg:pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface p-8 shadow-card sm:p-12">
            <div
              className="deco-ring -bottom-20 -right-16 size-72 border-[20px] border-pink/20"
              aria-hidden
            />
            <div className="relative grid items-center gap-8 lg:grid-cols-2">
              <div>
                <Badge tone="pink">
                  <Compass className="size-3.5" /> The OpenPath difference
                </Badge>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Where learning becomes opportunity
                </h2>
                <p className="mt-4 text-muted">
                  Canvas manages schoolwork. OpenPath connects it to what&apos;s
                  next. When a learner finishes a course, OpenPath surfaces
                  matching StuImpact opportunities - mentorships, internships,
                  hackathons, and volunteering - so progress turns into
                  real-world action.
                </p>
                <Link
                  href="/signup"
                  className={cn(buttonVariants({ variant: "accent" }), "mt-6")}
                >
                  Start free <ArrowRight className="size-4" />
                </Link>
              </div>
              <ul className="space-y-3">
                {[
                  { icon: "📚", text: "Complete a course" },
                  { icon: "🧭", text: "Get matched to opportunities by skill" },
                  { icon: "🚀", text: "Apply, build, and grow your portfolio" },
                  { icon: "📊", text: "Track impact for grants and donors" },
                ].map((step) => (
                  <li
                    key={step.text}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-background/50 px-4 py-3"
                  >
                    <span className="text-xl">{step.icon}</span>
                    <span className="text-sm font-semibold text-ink">
                      {step.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section className="pb-20 lg:pb-28">
        <Container>
          <Card className="relative overflow-hidden border-0 bg-ink p-8 text-white sm:p-12">
            <div
              className="deco-ring -right-16 -top-16 size-72 border-[20px] border-white/10"
              aria-hidden
            />
            <div className="relative max-w-2xl">
              <Badge className="bg-white/10 text-white">
                <ShieldCheck className="size-3.5" /> Security by design
              </Badge>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight">
                Your keys, encrypted. Your data, yours.
              </h2>
              <p className="mt-4 text-white/70">
                Each workspace connects its own Firebase project. We store your
                service-account credentials using AES-256-GCM envelope
                encryption and only ever decrypt them on the server to act on
                your behalf - never in the browser, never shared.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "Per-tenant data isolation",
                  "Encrypted credentials at rest",
                  "Connection verified before going live",
                  "Audit trail for credential changes",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-white/90">
                    <span className="grid size-5 place-items-center rounded-full bg-green/20 text-green">
                      <Check className="size-3.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-indigo-teal px-8 py-16 text-center text-white sm:px-12">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to join a live learning space?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Sign in, join with a code, or create a workspace if you&apos;re an
              educator or program operator. OpenPath keeps the experience
              focused for each role.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-white text-ink shadow-none hover:bg-white/90",
                )}
              >
                Get started
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/join"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-white/30 bg-white/5 text-white hover:bg-white/10",
                )}
              >
                Join with a code
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {subtitle ? <p className="mt-4 text-lg text-muted">{subtitle}</p> : null}
    </div>
  );
}

const toneStyles = {
  primary: "bg-primary/10 text-primary",
  pink: "bg-pink/12 text-pink",
  teal: "bg-teal/15 text-[#0f8a98]",
  purple: "bg-purple/12 text-purple",
  green: "bg-green/15 text-[#2f8a51]",
  yellow: "bg-yellow/20 text-[#9a7b12]",
} as const;

function FeatureCard({
  icon: Icon,
  title,
  desc,
  tone,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  tone: keyof typeof toneStyles;
}) {
  return (
    <Card className="p-7 transition-transform duration-200 hover:-translate-y-1">
      <div
        className={cn(
          "grid size-12 place-items-center rounded-2xl",
          toneStyles[tone],
        )}
      >
        <Icon className="size-6" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
    </Card>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <Card className="p-7">
      <div className="grid size-10 place-items-center rounded-full bg-gradient-hero text-base font-extrabold text-white">
        {n}
      </div>
      <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
    </Card>
  );
}

function UseCase({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-6">
      <Icon className="size-7 text-primary" />
      <h3 className="mt-4 font-bold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface/70 px-3.5 py-2 text-sm font-semibold text-ink shadow-sm">
      <Icon className="size-4 text-primary" />
      {label}
    </span>
  );
}

function HeroPreview() {
  return (
    <div className="relative animate-rise [animation-delay:0.15s]">
      <div className="absolute inset-0 -z-10 bg-gradient-indigo-teal opacity-15" />
      <Card className="rotate-1 p-5 shadow-[0_40px_80px_-30px_rgba(16,19,47,0.35)]">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-gradient-hero text-xs font-extrabold text-white">
              M
            </span>
            <div>
              <p className="text-sm font-bold text-ink">Ms. Rivera&apos;s Studio</p>
              <p className="text-xs text-muted">Spring term · 24 students</p>
            </div>
          </div>
          <Badge tone="green">Live</Badge>
        </div>

        <div className="mt-4 space-y-3">
          <PreviewRow color="bg-primary" title="Algebra II" meta="Quiz 4 · due Fri" />
          <PreviewRow color="bg-pink" title="Creative Writing" meta="Essay · 18 submitted" />
          <PreviewRow color="bg-teal" title="Intro to CS" meta="New announcement" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <MiniStat label="Courses" value="6" />
          <MiniStat label="Due soon" value="3" />
          <MiniStat label="Avg grade" value="91%" />
        </div>
      </Card>
    </div>
  );
}

function PreviewRow({
  color,
  title,
  meta,
}: {
  color: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-background/60 px-4 py-3">
      <span className={cn("size-9 shrink-0 rounded-xl", color)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{title}</p>
        <p className="truncate text-xs text-muted">{meta}</p>
      </div>
      <ArrowRight className="size-4 text-muted" />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cream/70 px-3 py-3 text-center">
      <p className="text-lg font-extrabold text-ink">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
    </div>
  );
}
