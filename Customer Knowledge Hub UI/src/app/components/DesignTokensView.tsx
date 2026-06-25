/**
 * DesignTokensView — visual reference for all design tokens.
 * Accessible via the "Tokens" button in the top bar (DEV mode).
 * Maps directly to src/app/tokens.ts.
 */

import { tokens, color, typography, spacing, radius, shadow, layout } from "../tokens";

const FF = tokens.typography.fontFamily;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="mb-4 pb-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <h2 style={{ color: color.textPrimary, fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function TokenRow({ name, value, children }: { name: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
      <code style={{ color: color.primary, fontSize: "0.78rem", width: 260, flexShrink: 0 }}>{name}</code>
      <span style={{ color: color.textMuted, fontSize: "0.74rem", width: 220, flexShrink: 0, fontFamily: "monospace" }}>{value}</span>
      {children}
    </div>
  );
}

function ColorSwatch({ bg, border }: { bg: string; border?: string }) {
  return (
    <div
      className="rounded-lg shrink-0"
      style={{ width: 28, height: 28, background: bg, border: border ?? "1px solid rgba(0,0,0,0.08)" }}
    />
  );
}

function SpacingSwatch({ px }: { px: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded" style={{ width: px, height: 10, background: color.primary, opacity: 0.5, minWidth: px }} />
      <span style={{ color: color.textMuted, fontSize: "0.70rem" }}>{px}px</span>
    </div>
  );
}

function RadiusSwatch({ r, label }: { r: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div style={{ width: 48, height: 48, background: color.primarySubtle, border: `2px solid ${color.primaryBorder}`, borderRadius: r }} />
      <span style={{ color: color.textMuted, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ color: color.textFaint, fontSize: "0.62rem", fontFamily: "monospace" }}>{r}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DesignTokensView() {
  return (
    <div className="h-full overflow-y-auto px-8 py-6" style={{ background: color.pageBg, fontFamily: FF }}>
      <div style={{ maxWidth: 900 }}>

        {/* Header */}
        <div className="mb-8">
          <h1 style={{ ...typography.pageTitle, color: color.textPrimary, margin: 0, marginBottom: 8 }}>Design Tokens</h1>
          <p style={{ ...typography.body, color: color.textMuted, margin: 0 }}>
            Source of truth: <code style={{ background: color.surface, border: `1px solid ${color.borderSubtle}`, borderRadius: 4, padding: "1px 6px", fontSize: "0.76rem" }}>src/app/tokens.ts</code>.
            Import <code style={{ background: color.surface, border: `1px solid ${color.borderSubtle}`, borderRadius: 4, padding: "1px 6px", fontSize: "0.76rem" }}>{"{ tokens }"}</code> and use these constants in all components.
          </p>
        </div>

        {/* ── Colours ─────────────────────────────────────── */}
        <Section title="Colour">
          <div className="rounded-xl overflow-hidden" style={{ background: color.surface, border: `1px solid ${color.borderSubtle}` }}>

            {/* Accent */}
            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${color.borderSubtle}` }}>
              <div style={{ color: color.textMuted, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Primary Accent</div>
              {[
                { name: "color.primary",       value: color.primary,       swatch: color.primary },
                { name: "color.primaryHover",   value: color.primaryHover,   swatch: color.primaryHover },
                { name: "color.primarySubtle",  value: color.primarySubtle,  swatch: color.primarySubtle },
                { name: "color.primaryBorder",  value: color.primaryBorder,  swatch: "transparent" },
                { name: "color.primaryGlow",    value: color.primaryGlow,    swatch: color.primaryGlow },
              ].map((t) => (
                <TokenRow key={t.name} name={t.name} value={t.value}>
                  <ColorSwatch bg={t.swatch} border={t.name.includes("Border") ? `2px solid ${color.primaryBorder}` : undefined} />
                </TokenRow>
              ))}
            </div>

            {/* Page structure */}
            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${color.borderSubtle}` }}>
              <div style={{ color: color.textMuted, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Backgrounds & Surfaces</div>
              {[
                { name: "color.pageBg",    value: color.pageBg },
                { name: "color.surface",   value: color.surface },
                { name: "color.inputBg",   value: color.inputBg },
              ].map((t) => (
                <TokenRow key={t.name} name={t.name} value={t.value}>
                  <ColorSwatch bg={t.value} />
                </TokenRow>
              ))}
            </div>

            {/* Borders */}
            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${color.borderSubtle}` }}>
              <div style={{ color: color.textMuted, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Borders</div>
              {[
                { name: "color.border",       value: color.border },
                { name: "color.borderSubtle", value: color.borderSubtle },
                { name: "color.borderInput",  value: color.borderInput },
              ].map((t) => (
                <TokenRow key={t.name} name={t.name} value={t.value}>
                  <div className="rounded" style={{ width: 48, height: 4, background: "transparent", border: `2px solid ${t.value}` }} />
                </TokenRow>
              ))}
            </div>

            {/* Text */}
            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${color.borderSubtle}` }}>
              <div style={{ color: color.textMuted, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Text</div>
              {[
                { name: "color.textPrimary",   value: color.textPrimary,   label: "Heading" },
                { name: "color.textSecondary", value: color.textSecondary, label: "Body" },
                { name: "color.textMuted",     value: color.textMuted,     label: "Label" },
                { name: "color.textFaint",     value: color.textFaint,     label: "Metadata" },
              ].map((t) => (
                <TokenRow key={t.name} name={t.name} value={t.value}>
                  <span style={{ color: t.value, fontSize: "0.82rem", fontWeight: 500 }}>{t.label}</span>
                </TokenRow>
              ))}
            </div>

            {/* Semantic */}
            <div className="px-5 py-3">
              <div style={{ color: color.textMuted, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Semantic</div>
              {[
                { name: "color.success / successSubtle", value: `${color.success} / ${color.successSubtle}`, swatch: color.success, bg: color.successSubtle },
                { name: "color.warning / warningSubtle", value: `${color.warning} / ${color.warningSubtle}`, swatch: color.warning, bg: color.warningSubtle },
                { name: "color.error / errorSubtle",     value: `${color.error} / ${color.errorSubtle}`,     swatch: color.error,   bg: color.errorSubtle },
                { name: "color.info / infoSubtle",       value: `${color.info} / ${color.infoSubtle}`,       swatch: color.info,    bg: color.infoSubtle },
                { name: "color.purple / purpleSubtle",   value: `${color.purple} / ${color.purpleSubtle}`,   swatch: color.purple,  bg: color.purpleSubtle },
              ].map((t) => (
                <TokenRow key={t.name} name={t.name} value={t.value}>
                  <div className="flex items-center gap-2">
                    <ColorSwatch bg={t.swatch} />
                    <ColorSwatch bg={t.bg} />
                  </div>
                </TokenRow>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Typography ───────────────────────────────────── */}
        <Section title="Typography">
          <div className="rounded-xl overflow-hidden" style={{ background: color.surface, border: `1px solid ${color.borderSubtle}` }}>
            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${color.borderSubtle}` }}>
              <TokenRow name="fontFamily" value={typography.fontFamily} />
            </div>
            {[
              { name: "typography.pageTitle",    label: "Page Title",    style: typography.pageTitle,    example: "LSEG Risk Intelligence" },
              { name: "typography.sectionTitle", label: "Section Title", style: typography.sectionTitle, example: "Recent Customer Updates" },
              { name: "typography.cardTitle",    label: "Card Title",    style: typography.cardTitle,    example: "Executive Brief" },
              { name: "typography.body",         label: "Body",          style: typography.body,         example: "Phase 1 covers OFAC SDN, UN consolidated list and EU financial sanctions." },
              { name: "typography.meta",         label: "Metadata",      style: typography.meta,         example: "2026-06-17 · Schema/API" },
              { name: "typography.badgeText",    label: "Badge",         style: typography.badgeText,    example: "Confirmed" },
              { name: "typography.labelCaps",    label: "Label Caps",    style: typography.labelCaps,    example: "Source Type" },
            ].map((t) => (
              <div key={t.name} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <code style={{ color: color.primary, fontSize: "0.74rem", width: 260, flexShrink: 0 }}>{t.name}</code>
                <span style={{ color: color.textMuted, fontSize: "0.66rem", fontFamily: "monospace", width: 200, flexShrink: 0 }}>
                  {t.style.fontSize} / {t.style.fontWeight}
                </span>
                <span style={{ ...t.style, fontFamily: FF, color: (t.style as any).color ?? color.textPrimary }}>{t.example}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Spacing ──────────────────────────────────────── */}
        <Section title="Spacing">
          <div className="rounded-xl p-5" style={{ background: color.surface, border: `1px solid ${color.borderSubtle}` }}>
            <p style={{ ...typography.meta, color: color.textMuted, marginBottom: 16 }}>
              Base unit: <strong>4px</strong>. All values are multiples of 4.
              Tailwind equivalents: p-1=4px, p-2=8px, p-3=12px, p-4=16px, p-5=20px, p-6=24px, p-7=28px.
            </p>
            <div className="flex flex-col gap-3">
              {(Object.entries(spacing) as [string, string][]).map(([key, val]) => (
                <div key={key} className="flex items-center gap-4">
                  <code style={{ color: color.primary, fontSize: "0.74rem", width: 100 }}>spacing.{key}</code>
                  <code style={{ color: color.textMuted, fontSize: "0.74rem", fontFamily: "monospace", width: 48 }}>{val}</code>
                  <SpacingSwatch px={parseInt(val)} />
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Border radius ────────────────────────────────── */}
        <Section title="Border Radius">
          <div className="rounded-xl p-5" style={{ background: color.surface, border: `1px solid ${color.borderSubtle}` }}>
            <div className="flex gap-8 flex-wrap">
              {[
                { key: "sm",   r: radius.sm,   label: "sm — tiny badges" },
                { key: "md",   r: radius.md,   label: "md — small badges" },
                { key: "lg",   r: radius.lg,   label: "lg — buttons, inputs" },
                { key: "xl",   r: radius.xl,   label: "xl — cards, panels" },
                { key: "full", r: radius.full, label: "full — pills, chips" },
              ].map((t) => (
                <div key={t.key} className="flex flex-col items-center gap-2">
                  <RadiusSwatch r={t.r} label={t.key} />
                  <span style={{ color: color.textMuted, fontSize: "0.62rem", textAlign: "center", maxWidth: 80 }}>{t.label.split("—")[1].trim()}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid rgba(0,0,0,0.06)` }}>
              <div style={{ color: color.textMuted, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Token reference</div>
              {Object.entries(radius).map(([key, val]) => (
                <TokenRow key={key} name={`radius.${key}`} value={val} />
              ))}
            </div>
          </div>
        </Section>

        {/* ── Shadows ──────────────────────────────────────── */}
        <Section title="Shadows">
          <div className="rounded-xl overflow-hidden" style={{ background: color.surface, border: `1px solid ${color.borderSubtle}` }}>
            {[
              { name: "shadow.none",      value: shadow.none,      label: "Default card — no shadow" },
              { name: "shadow.cardHover", value: shadow.cardHover,  label: "KPI card on hover" },
              { name: "shadow.drawer",    value: shadow.drawer,     label: "EvidenceDrawer slide-in" },
              { name: "shadow.dropdown",  value: shadow.dropdown,   label: "Dropdown/popover" },
            ].map((t) => (
              <div key={t.name} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <code style={{ color: color.primary, fontSize: "0.74rem", width: 200, flexShrink: 0 }}>{t.name}</code>
                <div className="rounded-lg" style={{ width: 40, height: 32, background: color.surface, boxShadow: t.value, border: `1px solid rgba(0,0,0,0.06)`, flexShrink: 0 }} />
                <span style={{ color: color.textMuted, fontSize: "0.74rem" }}>{t.label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Layout dimensions ────────────────────────────── */}
        <Section title="Layout Dimensions">
          <div className="rounded-xl overflow-hidden" style={{ background: color.surface, border: `1px solid ${color.borderSubtle}` }}>
            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${color.borderSubtle}` }}>
              <div style={{ color: color.textMuted, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Top Bar</div>
              <TokenRow name="layout.topBarBrandRowHeight" value={`${layout.topBarBrandRowHeight}px`} />
              <TokenRow name="layout.topBarNavRowHeight"   value={`${layout.topBarNavRowHeight}px`} />
              <TokenRow name="layout.topBarTotalHeight"    value={`${layout.topBarTotalHeight}px — brand row + nav row`} />
            </div>
            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${color.borderSubtle}` }}>
              <div style={{ color: color.textMuted, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Fixed Right Panels</div>
              <TokenRow name="layout.evidenceDrawerWidth" value={`${layout.evidenceDrawerWidth}px — SourceEvidenceDrawer`} />
              <TokenRow name="layout.filterPanelWidth"    value={`${layout.filterPanelWidth}px — Summaries FilterPanel`} />
              <TokenRow name="layout.devNotesWidth"       value={`${layout.devNotesWidth}px — DevAnnotations panel`} />
            </div>
            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${color.borderSubtle}` }}>
              <div style={{ color: color.textMuted, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Page Body</div>
              <TokenRow name="layout.pageBodyPaddingX"   value={`${layout.pageBodyPaddingX}px (px-7) — full-width page elements`} />
              <TokenRow name="layout.cardPaddingX"       value={`${layout.cardPaddingX}px (px-5) — inside cards`} />
              <TokenRow name="layout.cardPaddingY"       value={`${layout.cardPaddingY}px (py-4) — inside card body`} />
              <TokenRow name="layout.cardHeaderPaddingY" value={`${layout.cardHeaderPaddingY}px (py-3.5) — card title row`} />
              <TokenRow name="layout.subHeaderPaddingY"  value={`${layout.subHeaderPaddingY}px (py-2.5) — compact sub-headers`} />
              <TokenRow name="layout.pageBodyPadding"    value={`${layout.pageBodyPadding}px (p-5) — scrollable area inset`} />
            </div>
            <div className="px-5 py-3">
              <div style={{ color: color.textMuted, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Grid Gaps</div>
              <TokenRow name="layout.gapSm" value={`${layout.gapSm}px (gap-3) — compact sections`} />
              <TokenRow name="layout.gapMd" value={`${layout.gapMd}px (gap-4) — standard sections`} />
            </div>
          </div>
        </Section>

        {/* ── Visual layout diagram ────────────────────────── */}
        <Section title="AppShell Diagram">
          <div className="rounded-xl overflow-hidden" style={{ background: color.surface, border: `1px solid ${color.borderSubtle}` }}>
            <div className="p-5">
              {/* Diagram */}
              <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${color.border}`, width: "100%" }}>
                {/* TopBar brand row */}
                <div className="flex items-center px-4 gap-3" style={{ background: "#f8fafc", height: 40, borderBottom: `1px solid ${color.borderSubtle}` }}>
                  <div className="rounded" style={{ width: 22, height: 22, background: color.primarySubtle }} />
                  <span style={{ color: color.textMuted, fontSize: "0.66rem", fontWeight: 600 }}>TopBar / BrandRow</span>
                  <span style={{ marginLeft: "auto", color: color.textFaint, fontSize: "0.62rem", fontFamily: "monospace" }}>h: {layout.topBarBrandRowHeight}px</span>
                </div>
                {/* TopBar nav row */}
                <div className="flex items-end px-4 gap-4" style={{ background: "#f8fafc", height: 40, borderBottom: `1px solid ${color.border}` }}>
                  {["Dashboard", "File Library", "Summaries", "Ask AI", "Alerts", "Settings"].map((t, i) => (
                    <div key={t} className="pb-1.5 border-b-2" style={{ borderColor: i === 0 ? color.primary : "transparent", color: i === 0 ? color.primary : color.textMuted, fontSize: "0.66rem", fontWeight: i === 0 ? 600 : 400 }}>{t}</div>
                  ))}
                  <span style={{ marginLeft: "auto", color: color.textFaint, fontSize: "0.62rem", fontFamily: "monospace" }}>h: {layout.topBarNavRowHeight}px</span>
                </div>
                {/* Body row */}
                <div className="flex" style={{ height: 120 }}>
                  {/* Main */}
                  <div className="flex-1 flex items-center justify-center" style={{ background: color.pageBg, borderRight: `1px solid ${color.borderSubtle}` }}>
                    <span style={{ color: color.textFaint, fontSize: "0.66rem" }}>MainContent — flex-1 · overflow-hidden · p-5</span>
                  </div>
                  {/* Optional right panel */}
                  <div className="flex items-center justify-center shrink-0" style={{ width: layout.filterPanelWidth, background: "#f8fafc" }}>
                    <span style={{ color: color.textFaint, fontSize: "0.60rem", textAlign: "center", padding: "0 8px" }}>FilterPanel<br />{layout.filterPanelWidth}px</span>
                  </div>
                  {/* Evidence drawer */}
                  <div className="flex items-center justify-center shrink-0" style={{ width: 80, background: "rgba(22,163,74,0.04)", borderLeft: `1px solid rgba(22,163,74,0.15)` }}>
                    <span style={{ color: color.primary, fontSize: "0.60rem", textAlign: "center", padding: "0 4px" }}>Drawer<br />{layout.evidenceDrawerWidth}px</span>
                  </div>
                </div>
              </div>

              <div className="mt-4" style={{ color: color.textMuted, fontSize: "0.74rem", lineHeight: 1.7 }}>
                <strong style={{ color: color.textSecondary }}>AppShell</strong> = TopNav (88px) + flex-row body.
                The EvidenceDrawer is a <strong>fixed</strong> overlay (not in flow) — it appears above all content.
                FilterPanel and DevAnnotations are <strong>in-flow</strong> panels that push MainContent.
              </div>
            </div>
          </div>
        </Section>

        {/* ── Quick-reference card ─────────────────────────── */}
        <Section title="Quick Reference — Copy for Code">
          <div className="rounded-xl p-5" style={{ background: "#0f172a", border: `1px solid rgba(255,255,255,0.06)` }}>
            <pre style={{ color: "#94a3b8", fontSize: "0.74rem", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
{`// Import
import { tokens, color, typography, layout } from "../tokens";

// Card shell — apply to every white rounded panel
const cardStyle = {
  background:   tokens.color.surface,       // #ffffff
  border:       "1px solid " + tokens.color.borderSubtle,  // rgba(0,0,0,0.06)
  borderRadius: tokens.radius.xl,            // 12px
};

// Sub-header — sits below TopNav on every page
const subHeaderStyle = {
  background:    tokens.color.surface,
  borderBottom:  "1px solid " + tokens.color.borderSubtle,
  padding:       tokens.layout.subHeaderPaddingY + "px " + tokens.layout.pageBodyPaddingX + "px",
};

// Page body — scrollable content area
const pageBodyStyle = {
  background: tokens.color.pageBg,          // #f0f4f8
  padding:    tokens.layout.pageBodyPadding + "px", // 20px
};

// Standard grid gaps
// Compact:  gap-3 → 12px (tokens.layout.gapSm)
// Standard: gap-4 → 16px (tokens.layout.gapMd)

// Fixed widths
// EvidenceDrawer: tokens.layout.evidenceDrawerWidth  → 360px
// FilterPanel:    tokens.layout.filterPanelWidth     → 200px`}
            </pre>
          </div>
        </Section>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
