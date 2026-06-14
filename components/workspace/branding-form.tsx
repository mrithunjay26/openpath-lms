"use client";

import { useActionState, useState } from "react";
import { updateBrandingAction, type FormState } from "@/lib/actions/tenant";
import {
  CORNER_STYLES,
  HEADING_FONTS,
  SHAPE_INTENSITIES,
  SHELL_WIDTHS,
  THEME_PRESETS,
  WORKSPACE_DENSITIES,
  radiusFor,
  type TenantTheme,
  type CornerStyle,
  type HeadingFont,
  type ShellWidth,
  type ShapeIntensity,
  type WorkspaceDensity,
} from "@/lib/theme";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { initials, cn } from "@/lib/utils";

export function BrandingForm({
  slug,
  initialName,
  initialLogoUrl,
  initialTheme,
}: {
  slug: string;
  initialName: string;
  initialLogoUrl: string;
  initialTheme: TenantTheme;
}) {
  const action = updateBrandingAction.bind(null, slug);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined,
  );

  const [name, setName] = useState(initialName);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [primary, setPrimary] = useState(initialTheme.primary);
  const [accent, setAccent] = useState(initialTheme.accent);
  const [accent2, setAccent2] = useState(initialTheme.accent2);
  const [headingFont, setHeadingFont] = useState<HeadingFont>(
    initialTheme.headingFont,
  );
  const [cornerStyle, setCornerStyle] = useState<CornerStyle>(
    initialTheme.cornerStyle,
  );
  const [shapeIntensity, setShapeIntensity] = useState<ShapeIntensity>(
    initialTheme.shapeIntensity,
  );
  const [density, setDensity] = useState<WorkspaceDensity>(initialTheme.density);
  const [shellWidth, setShellWidth] = useState<ShellWidth>(initialTheme.shellWidth);

  const applyPreset = (p: (typeof THEME_PRESETS)[number]) => {
    setPrimary(p.primary);
    setAccent(p.accent);
    setAccent2(p.accent2);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <form action={formAction} className="space-y-7">
        {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state?.ok ? <Alert tone="success">Design saved.</Alert> : null}

        {/* Identity */}
        <section className="space-y-4">
          <SectionTitle>Identity</SectionTitle>
          <div>
            <Label htmlFor="b-name">Workspace name</Label>
            <Input
              id="b-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="b-logo">Logo URL (optional)</Label>
            <Input
              id="b-logo"
              name="logoUrl"
              type="url"
              placeholder="https://…/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>
        </section>

        {/* Colors */}
        <section className="space-y-4">
          <SectionTitle>Colors</SectionTitle>
          <div>
            <Label>Presets</Label>
            <div className="flex flex-wrap gap-2">
              {THEME_PRESETS.map((p) => {
                const on =
                  p.primary === primary &&
                  p.accent === accent &&
                  p.accent2 === accent2;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    title={p.name}
                    className={cn(
                      "flex items-center gap-1.5 rounded-pill border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                      on
                        ? "border-primary bg-primary/15 text-ink"
                        : "border-line text-muted hover:text-ink",
                    )}
                  >
                    <span className="flex">
                      {[p.primary, p.accent, p.accent2].map((c) => (
                        <span
                          key={c}
                          className="size-3.5 rounded-full ring-1 ring-bgdeep/40"
                          style={{ background: c, marginLeft: -4 }}
                        />
                      ))}
                    </span>
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <ColorField label="Primary" name="primary" value={primary} onChange={setPrimary} />
            <ColorField label="Accent" name="accent" value={accent} onChange={setAccent} />
            <ColorField label="Accent 2" name="accent2" value={accent2} onChange={setAccent2} />
          </div>
        </section>

        {/* Style */}
        <section className="space-y-4">
          <SectionTitle>Style</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="b-font">Heading font</Label>
              <Select
                id="b-font"
                name="headingFont"
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value as HeadingFont)}
              >
                {HEADING_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="b-corner">Corners</Label>
              <Select
                id="b-corner"
                name="cornerStyle"
                value={cornerStyle}
                onChange={(e) => setCornerStyle(e.target.value as CornerStyle)}
              >
                {CORNER_STYLES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="b-shape">Background shapes</Label>
              <Select
                id="b-shape"
                name="shapeIntensity"
                value={shapeIntensity}
                onChange={(e) =>
                  setShapeIntensity(e.target.value as ShapeIntensity)
                }
              >
                {SHAPE_INTENSITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="b-density">Layout density</Label>
              <Select
                id="b-density"
                name="density"
                value={density}
                onChange={(e) => setDensity(e.target.value as WorkspaceDensity)}
              >
                {WORKSPACE_DENSITIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="b-width">Canvas width</Label>
              <Select
                id="b-width"
                name="shellWidth"
                value={shellWidth}
                onChange={(e) => setShellWidth(e.target.value as ShellWidth)}
              >
                {SHELL_WIDTHS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </section>

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save design"}
        </Button>
      </form>

      {/* live preview */}
      <div className="lg:sticky lg:top-24">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
          Live preview
        </p>
        <div className="overflow-hidden border border-line bg-surface shadow-card" style={{ borderRadius: radiusFor(cornerStyle) }}>
          <div
            className="flex items-center gap-3 p-5"
            style={{ background: primary }}
          >
            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/20 text-sm font-extrabold text-white">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="size-full object-cover" />
              ) : (
                initials(name || "WS")
              )}
            </span>
            <span
              className="truncate font-bold text-white"
              style={{ fontFamily: `'${headingFont}', sans-serif` }}
            >
              {name || "Your workspace"}
            </span>
          </div>
          <div className="space-y-3 p-5">
            <div
              className="text-base font-bold text-ink"
              style={{ fontFamily: `'${headingFont}', sans-serif` }}
            >
              Welcome back
            </div>
            <div className="h-2.5 w-2/3 rounded-full bg-cream" />
            <div className="h-2.5 w-1/2 rounded-full bg-cream" />
            <div className="flex gap-2 pt-2">
              <span
                className="rounded-pill px-4 py-2 text-xs font-bold text-white"
                style={{
                  backgroundImage: `linear-gradient(95deg, ${accent}, ${accent2})`,
                }}
              >
                Primary action
              </span>
              <span
                className="px-4 py-2 text-xs font-bold text-ink"
                style={{
                  borderRadius: radiusFor(cornerStyle),
                  border: "1px solid var(--color-line)",
                }}
              >
                Secondary
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-line bg-background/70 px-3 py-2 text-xs text-muted">
              <span>Density</span>
              <span className="font-semibold text-ink">{density}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-line bg-background/70 px-3 py-2 text-xs text-muted">
              <span>Canvas</span>
              <span className="font-semibold text-ink">{shellWidth}</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          Saving applies these to every teacher and student dashboard in this
          workspace.
        </p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
      {children}
    </h3>
  );
}

function ColorField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={`color-${name}`}>{label}</Label>
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-2 py-1.5 shadow-sm">
        <input
          id={`color-${name}`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-9 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          aria-label={label}
        />
        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="w-full min-w-0 bg-transparent text-xs font-semibold uppercase text-ink outline-none"
          maxLength={7}
        />
      </div>
    </div>
  );
}
