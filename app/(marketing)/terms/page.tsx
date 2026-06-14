import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/site/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing your use of OpenPath, a learning platform for educators, students, nonprofits, and cohorts, and a project of StuImpact.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="June 3, 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
        use of OpenPath (&ldquo;OpenPath,&rdquo; &ldquo;we,&rdquo;
        &ldquo;us&rdquo;), an education platform operated as a project of
        StuImpact. By creating an account or using OpenPath, you agree to these
        Terms.
      </p>

      <h2>1. The service</h2>
      <p>
        OpenPath lets educators and institutions create branded learning spaces
        and run courses, assignments, assessments, gradebooks, messaging, and
        file libraries. OpenPath uses a <strong>bring-your-own-Firebase</strong>
        model: you connect your own Firebase project, and your classroom content
        is stored there.
      </p>

      <h2>2. Accounts &amp; eligibility</h2>
      <ul>
        <li>
          You must provide accurate information and keep your credentials
          secure. You are responsible for activity under your account.
        </li>
        <li>
          You must be old enough to form a binding contract and authorized to
          act for any organization you represent.
        </li>
      </ul>

      <h2>3. Workspaces &amp; your responsibilities</h2>
      <p>
        As a workspace owner you are the controller of the data you place in your
        Firebase project. You represent that you have the rights and consents
        needed to collect and process that data, including any student or
        children&apos;s data and any required school or parental consent under
        laws such as FERPA and COPPA.
      </p>

      <h2>4. Bring your own Firebase</h2>
      <ul>
        <li>
          Your use of Firebase is governed by Google&apos;s terms. You are
          responsible for your Firebase configuration, security rules, usage, and
          costs.
        </li>
        <li>
          You authorize OpenPath to access your connected Firebase project using
          the credentials you provide, solely to operate the features you use.
        </li>
        <li>
          You can disconnect or rotate credentials at any time; doing so may stop
          dependent features from working.
        </li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Violate any law or infringe others&apos; rights.</li>
        <li>Upload malware or attempt to breach security or access controls.</li>
        <li>
          Use the service to harass others or to store unlawful or harmful
          content.
        </li>
        <li>Resell or misrepresent the service.</li>
      </ul>

      <h2>6. Content &amp; ownership</h2>
      <p>
        You retain all rights to your content. You grant OpenPath a limited
        license to host, process, and transmit your content only as needed to
        provide the service to you. OpenPath, its software, branding, and the
        StuImpact name remain our property.
      </p>

      <h2>7. Privacy</h2>
      <p>
        Our handling of information is described in our{" "}
        <Link href="/privacy">Privacy Policy</Link>, which is incorporated into these
        Terms.
      </p>

      <h2>8. Fees</h2>
      <p>
        OpenPath may offer free and paid plans. Any paid features, pricing, and
        billing terms will be presented to you before you incur charges. Note
        that your own Firebase usage is billed to you by Google.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The service is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; without warranties of any kind, to the maximum extent
        permitted by law. We do not warrant that the service will be
        uninterrupted or error-free.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, OpenPath and StuImpact will not
        be liable for indirect, incidental, special, consequential, or punitive
        damages, or for any loss of data, revenue, or profits, arising from your
        use of the service.
      </p>

      <h2>11. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless OpenPath and StuImpact from
        claims arising out of your content, your use of the service, or your
        violation of these Terms or applicable law.
      </p>

      <h2>12. Termination</h2>
      <p>
        You may stop using the service and delete your account at any time. We
        may suspend or terminate access for violations of these Terms or to
        protect the service. Upon termination we delete your stored Firebase
        credentials and associated platform records; your data in your own
        Firebase remains under your control.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of Washington, USA,
        without regard to its conflict-of-laws rules.
      </p>

      <h2>14. Changes</h2>
      <p>
        We may update these Terms from time to time. Continued use after changes
        take effect constitutes acceptance of the updated Terms.
      </p>

      <h2>15. Contact</h2>
      <p>
        Questions about these Terms? Email{" "}
        <a href="mailto:hello@stuimpact.org">hello@stuimpact.org</a>.
      </p>
    </LegalShell>
  );
}
