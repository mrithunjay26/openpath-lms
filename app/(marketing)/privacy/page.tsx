import type { Metadata } from "next";
import { LegalShell } from "@/components/site/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How OpenPath, a project of StuImpact, collects, uses, and protects information — including encrypted tenant Firebase credentials and student data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="June 3, 2026">
      <p>
        OpenPath (&ldquo;OpenPath,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is
        an education platform operated as a project of StuImpact. This Privacy
        Policy explains what information we handle when you create a workspace,
        connect your own Firebase project, and use OpenPath to run courses,
        assignments, and assessments.
      </p>

      <h2>Our role: controller vs. processor</h2>
      <p>
        OpenPath is built on a <strong>bring-your-own-Firebase</strong> model.
        Your classroom content — courses, assignments, submissions, grades,
        files, and student records — is stored in <strong>your</strong> Firebase
        project, which you control.
      </p>
      <ul>
        <li>
          For your <strong>account and workspace settings</strong> (name, email,
          membership, branding, billing) we act as the{" "}
          <strong>data controller</strong>.
        </li>
        <li>
          For the <strong>content and student data in your Firebase</strong>, we
          act only as a <strong>data processor</strong> acting on your
          instructions. You (the workspace owner) are the controller and are
          responsible for having the necessary rights and consents.
        </li>
      </ul>

      <h2>Information we collect</h2>
      <h3>Account information</h3>
      <ul>
        <li>Name, email address, and a securely hashed password (bcrypt).</li>
        <li>
          If you sign in with Google, basic profile information provided by
          Google OAuth.
        </li>
        <li>Workspace details: name, slug, branding (colors, logo), and plan.</li>
        <li>Memberships and roles (owner, teacher, TA, student).</li>
      </ul>

      <h3>Your Firebase credentials</h3>
      <p>
        When you connect a Firebase project, you provide a service-account
        credential. We store it using <strong>AES-256-GCM envelope
        encryption</strong>: a unique data key encrypts the credential, and that
        data key is itself encrypted with a master key held outside the
        database. We decrypt credentials only on our servers, only to perform
        actions you initiate, and never expose them to the browser. We keep an
        audit log of credential changes.
      </p>

      <h3>Usage information</h3>
      <ul>
        <li>
          Authentication session cookies (used to keep you signed in) and basic,
          aggregated technical logs needed to operate and secure the service.
        </li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>To provide, maintain, and secure the OpenPath platform.</li>
        <li>To authenticate you and route you to your workspaces.</li>
        <li>
          To act on your instructions against your connected Firebase project.
        </li>
        <li>To communicate with you about your account and the service.</li>
        <li>To comply with legal obligations.</li>
      </ul>
      <p>
        We do <strong>not</strong> sell personal information, and we do not use
        the content stored in your Firebase project for advertising or model
        training.
      </p>

      <h2>Student data, FERPA &amp; COPPA</h2>
      <p>
        OpenPath may be used in settings involving students, including minors.
        Where applicable, the workspace owner is responsible for compliance with
        laws such as FERPA and COPPA, including obtaining any required school or
        parental consent. As a processor, we will handle student records only as
        directed by the workspace and will not use them for unrelated purposes.
        If you are a parent or student with questions about specific records,
        please contact the school or workspace that holds them.
      </p>

      <h2>Cookies &amp; sessions</h2>
      <p>
        We use strictly necessary cookies for authentication and security. We do
        not use third-party advertising or cross-site tracking cookies.
      </p>

      <h2>Sub-processors</h2>
      <p>We rely on a small set of service providers to run OpenPath:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — managed Postgres database hosting for
          platform account and workspace data, and storage for brand assets.
        </li>
        <li>
          <strong>Vercel</strong> — application hosting and delivery.
        </li>
        <li>
          <strong>Google Firebase</strong> — your connected project (your data)
          and our Admin SDK access on your behalf.
        </li>
        <li>
          <strong>Google OAuth</strong> — optional sign-in, if you use it.
        </li>
      </ul>

      <h2>Data retention &amp; deletion</h2>
      <p>
        We retain account and workspace data for as long as your account is
        active. You can delete your workspace, which removes your stored Firebase
        credentials and platform records associated with it. Content in your own
        Firebase project remains under your control and is deleted by you in
        Firebase. You may request deletion of your OpenPath account at any time.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct,
        export, or delete your personal information. Contact us to exercise
        these rights.
      </p>

      <h2>International transfers</h2>
      <p>
        Our providers may process data in the United States and other countries.
        Where required, appropriate safeguards are used for cross-border
        transfers.
      </p>

      <h2>Children</h2>
      <p>
        OpenPath is intended for use by educators and their organizations.
        Accounts are not intended to be created directly by children without the
        involvement of a school, teacher, or guardian acting through a
        workspace.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be
        reflected by the &ldquo;last updated&rdquo; date above.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email{" "}
        <a href="mailto:privacy@stuimpact.org">privacy@stuimpact.org</a>.
      </p>
    </LegalShell>
  );
}
