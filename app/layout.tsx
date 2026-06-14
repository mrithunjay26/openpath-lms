import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

// Body = Inter, display/headings = Sora. Both are self-hosted by next/font
// with display:swap, so there are no extra web-font requests.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

const fontVars = `${inter.variable} ${sora.variable}`;

export const metadata: Metadata = {
  title: {
    default: "OpenPath - learning spaces by StuImpact",
    template: "%s | OpenPath",
  },
  description:
    "OpenPath is a multi-audience learning platform for educators, students, nonprofits, and cohorts. Connect your Firebase, brand it your way, and run courses, assignments, messaging, and opportunities.",
  metadataBase: new URL("https://openpath.stuimpact.org"),
  applicationName: "OpenPath",
  openGraph: {
    title: "OpenPath - learning spaces by StuImpact",
    description:
      "Self-serve learning spaces for educators, students, nonprofits, and cohorts. Bring your own Firebase. Built by StuImpact.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-ink antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const key = 'openpath-theme-mode';
                  const stored = localStorage.getItem(key);
                  const mode = stored === 'light' || stored === 'dark'
                    ? stored
                    : 'light';
                  document.documentElement.dataset.themeMode = mode;
                  document.documentElement.style.colorScheme = mode;
                } catch {
                  document.documentElement.dataset.themeMode = 'light';
                  document.documentElement.style.colorScheme = 'light';
                }
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
