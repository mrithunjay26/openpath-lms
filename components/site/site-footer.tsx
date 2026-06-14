import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-cream/60">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Self-serve learning spaces for educators, students, nonprofits,
              and cohorts. Bring your own Firebase and keep your workspace your
              own. A StuImpact project.
            </p>
          </div>

          <FooterCol title="Product">
            <FooterLink href="/#features">Features</FooterLink>
            <FooterLink href="/#how">How it works</FooterLink>
            <FooterLink href="/#use-cases">Use cases</FooterLink>
            <FooterLink href="/signup">Get started</FooterLink>
          </FooterCol>

          <FooterCol title="StuImpact">
            <FooterLink href="https://www.stuimpact.org" external>
              StuImpact.org
            </FooterLink>
            <FooterLink href="https://www.stuimpact.org" external>
              ClubSync
            </FooterLink>
            <FooterLink href="mailto:hello@stuimpact.org">Contact</FooterLink>
          </FooterCol>

          <FooterCol title="Legal">
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/terms">Terms of Service</FooterLink>
            <FooterLink href="/self-host">Self-hosting guide</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-sm text-muted sm:flex-row">
          <p>&copy; {new Date().getFullYear()} OpenPath - a project under StuImpact.</p>
          <p>Built for educators, learners, and programs.</p>
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="text-sm text-muted transition-colors hover:text-ink"
      >
        {children}
      </Link>
    </li>
  );
}
