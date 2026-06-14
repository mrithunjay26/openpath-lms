import type { CSSProperties } from "react";

export type CornerStyle = "sharp" | "rounded" | "pill";
export type ShapeIntensity = "off" | "low" | "medium" | "high";
export type WorkspaceDensity = "compact" | "balanced" | "comfortable";
export type ShellWidth = "standard" | "wide" | "ultra";
export type HeadingFont =
  | "Sora"
  | "Inter"
  | "Manrope"
  | "Space Grotesk"
  | "Plus Jakarta Sans";

export type TenantTheme = {
  primary: string; // main brand / actions (indigo by default)
  accent: string; // gradient start (pink)
  accent2: string; // gradient end (orange)
  headingFont: HeadingFont;
  cornerStyle: CornerStyle;
  shapeIntensity: ShapeIntensity;
  density: WorkspaceDensity;
  shellWidth: ShellWidth;
};

export const DEFAULT_THEME: TenantTheme = {
  primary: "#5B6CFF",
  accent: "#FF5FA2",
  accent2: "#FF8A4C",
  headingFont: "Sora",
  cornerStyle: "rounded",
  shapeIntensity: "high",
  density: "balanced",
  shellWidth: "wide",
};

// Only the two self-hosted families are offered (no extra web-font requests).
export const HEADING_FONTS: HeadingFont[] = ["Sora", "Inter"];
export const CORNER_STYLES: CornerStyle[] = ["sharp", "rounded", "pill"];
export const SHAPE_INTENSITIES: ShapeIntensity[] = [
  "off",
  "low",
  "medium",
  "high",
];
export const WORKSPACE_DENSITIES: WorkspaceDensity[] = [
  "compact",
  "balanced",
  "comfortable",
];
export const SHELL_WIDTHS: ShellWidth[] = ["standard", "wide", "ultra"];

// Curated brand presets the admin can one-click apply (primary, accent, accent2).
export const THEME_PRESETS: {
  name: string;
  primary: string;
  accent: string;
  accent2: string;
}[] = [
  { name: "Aurora", primary: "#5B6CFF", accent: "#FF5FA2", accent2: "#FF8A4C" },
  { name: "Violet", primary: "#7A5AF8", accent: "#A06BFF", accent2: "#5B6CFF" },
  { name: "Reef", primary: "#3B82F6", accent: "#39C9C1", accent2: "#5EC46A" },
  { name: "Sunset", primary: "#5B6CFF", accent: "#F4C542", accent2: "#FF5FA2" },
  { name: "Emerald", primary: "#10B981", accent: "#5EC46A", accent2: "#39C9C1" },
];

const HEX = /^#([0-9a-fA-F]{6})$/;

// Legacy values fall back to Sora — those families are no longer loaded.
const FONT_VAR: Record<HeadingFont, string> = {
  Sora: "var(--font-sora)",
  Inter: "var(--font-inter)",
  Manrope: "var(--font-sora)",
  "Space Grotesk": "var(--font-sora)",
  "Plus Jakarta Sans": "var(--font-sora)",
};

export const radiusFor = (c: CornerStyle) =>
  c === "sharp" ? "6px" : c === "pill" ? "26px" : "16px";

export const shapeOpacityFor = (s: ShapeIntensity) =>
  s === "off" ? 0 : s === "low" ? 0.35 : s === "medium" ? 0.7 : 1;

export const densityPadding = (density: WorkspaceDensity) =>
  density === "compact" ? "0.95rem" : density === "comfortable" ? "1.25rem" : "1.1rem";

export const shellMaxWidth = (shellWidth: ShellWidth) =>
  shellWidth === "standard" ? "1280px" : shellWidth === "ultra" ? "1600px" : "1440px";

/** Safely read a tenant theme from stored JSON, falling back to defaults. */
export function readTheme(theme: unknown): TenantTheme {
  if (!theme || typeof theme !== "object") return DEFAULT_THEME;
  const t = theme as Record<string, unknown>;
  const hex = (v: unknown, d: string) =>
    typeof v === "string" && HEX.test(v) ? v : d;
  const oneOf = <T,>(v: unknown, opts: readonly T[], d: T): T =>
    opts.includes(v as T) ? (v as T) : d;
  return {
    primary: hex(t.primary, DEFAULT_THEME.primary),
    accent: hex(t.accent, DEFAULT_THEME.accent),
    accent2: hex(t.accent2, DEFAULT_THEME.accent2),
    headingFont: oneOf(t.headingFont, HEADING_FONTS, DEFAULT_THEME.headingFont),
    cornerStyle: oneOf(t.cornerStyle, CORNER_STYLES, DEFAULT_THEME.cornerStyle),
    shapeIntensity: oneOf(
      t.shapeIntensity,
      SHAPE_INTENSITIES,
      DEFAULT_THEME.shapeIntensity,
    ),
    density: oneOf(t.density, WORKSPACE_DENSITIES, DEFAULT_THEME.density),
    shellWidth: oneOf(t.shellWidth, SHELL_WIDTHS, DEFAULT_THEME.shellWidth),
  };
}

/**
 * CSS custom properties for a workspace. Applied to the workspace wrapper so
 * every `bg-primary` / `text-accent` / heading / card-radius inside reflects the
 * workspace's brand, while marketing + platform chrome keep the defaults.
 */
export function themeVars(theme: TenantTheme): CSSProperties {
  return {
    "--color-primary": theme.primary,
    "--color-accent": theme.accent,
    "--color-accent-2": theme.accent2,
    "--font-display": `${FONT_VAR[theme.headingFont]}, var(--font-sora), system-ui, sans-serif`,
    "--radius-card": radiusFor(theme.cornerStyle),
    "--shape-opacity": String(shapeOpacityFor(theme.shapeIntensity)),
    "--workspace-card-padding": densityPadding(theme.density),
    "--workspace-shell-width": shellMaxWidth(theme.shellWidth),
  } as CSSProperties;
}
