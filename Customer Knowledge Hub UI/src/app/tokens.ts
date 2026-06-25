/**
 * Customer Knowledge Hub — Design Tokens
 *
 * Single source of truth for colours, typography, spacing, radius and layout.
 * Import from here in all components instead of hardcoding values.
 *
 * Usage:
 *   import { tokens } from "../tokens";
 *   style={{ color: tokens.color.textPrimary }}
 */

// ─── Colour ───────────────────────────────────────────────────────────────────

export const color = {
  // Accent — green
  primary:       "#16a34a",
  primaryHover:  "#15803d",
  primarySubtle: "rgba(22,163,74,0.08)",
  primaryBorder: "rgba(22,163,74,0.22)",
  primaryGlow:   "rgba(22,163,74,0.35)",

  // Page structure
  pageBg:    "#f0f4f8",   // main page background
  surface:   "#ffffff",   // cards, panels, top bar
  inputBg:   "#f8fafc",   // inputs, secondary surfaces

  // Borders
  border:       "rgba(0,0,0,0.08)",  // panels, top bar
  borderSubtle: "rgba(0,0,0,0.06)",  // cards, card sections
  borderInput:  "rgba(0,0,0,0.10)",  // inputs, selects

  // Text
  textPrimary:   "#0f172a",  // headings
  textSecondary: "#374151",  // body
  textMuted:     "#6b7280",  // labels, subtitles
  textFaint:     "#9ca3af",  // timestamps, metadata

  // Semantic
  success:       "#16a34a",
  successSubtle: "rgba(22,163,74,0.08)",
  warning:       "#d97706",
  warningSubtle: "rgba(217,119,6,0.08)",
  error:         "#dc2626",
  errorSubtle:   "rgba(220,38,38,0.08)",
  info:          "#2563eb",
  infoSubtle:    "rgba(59,130,246,0.08)",
  purple:        "#7c3aed",
  purpleSubtle:  "rgba(139,92,246,0.08)",

  // Source type colours
  sourceEmail:      "#0284c7",
  sourceEmailBg:    "rgba(14,165,233,0.08)",
  sourceMeeting:    "#2563eb",
  sourceMeetingBg:  "rgba(59,130,246,0.08)",
  sourceSchema:     "#7c3aed",
  sourceSchemaBg:   "rgba(139,92,246,0.08)",
  sourceSourceList: "#4b5563",
  sourceSourceListBg: "rgba(107,114,128,0.08)",
  sourceDeck:       "#d97706",
  sourceDeckBg:     "rgba(217,119,6,0.08)",
  sourceDocument:   "#16a34a",
  sourceDocumentBg: "rgba(22,163,74,0.08)",
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

/**
 * Hierarchy (6 levels):
 *   pageTitle    → page H1 (only one per page)
 *   sectionTitle → major section within a page
 *   cardTitle    → card/panel header
 *   body         → standard readable text
 *   meta         → secondary info (dates, counts)
 *   badgeText    → compact badge/pill labels
 *   labelCaps    → ALL-CAPS section label (smallest)
 */

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",

  pageTitle:    { fontSize: "1.55rem", fontWeight: 800, color: color.textPrimary, lineHeight: 1.25 },
  sectionTitle: { fontSize: "0.95rem", fontWeight: 700, color: color.textPrimary },
  cardTitle:    { fontSize: "0.88rem", fontWeight: 700, color: color.textPrimary },
  body:         { fontSize: "0.82rem", fontWeight: 400, color: color.textSecondary, lineHeight: 1.65 },
  meta:         { fontSize: "0.74rem", fontWeight: 400, color: color.textMuted },
  badgeText:    { fontSize: "0.74rem", fontWeight: 600 },
  labelCaps:    { fontSize: "0.62rem", fontWeight: 700, color: color.textMuted, letterSpacing: "0.07em", textTransform: "uppercase" as const },
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────

/** Base unit: 4px. All spacing is a multiple of 4. */
export const spacing = {
  1:  "4px",
  2:  "8px",
  3:  "12px",
  4:  "16px",
  5:  "20px",
  6:  "24px",
  7:  "28px",
  8:  "32px",
  10: "40px",
  12: "48px",
} as const;

// ─── Border radius ────────────────────────────────────────────────────────────

export const radius = {
  sm:   "4px",    // tiny badges
  md:   "6px",    // small badges, table row indicators
  lg:   "8px",    // buttons, inputs
  xl:   "12px",   // cards, panels
  full: "9999px", // pills, chips, avatars
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const shadow = {
  none:      "none",
  cardHover: "0 2px 8px rgba(22,163,74,0.08)",  // KPI card hover
  drawer:    "-4px 0 24px rgba(0,0,0,0.08)",     // EvidenceDrawer
  dropdown:  "0 4px 16px rgba(0,0,0,0.08)",      // dropdowns
} as const;

// ─── Layout dimensions ────────────────────────────────────────────────────────

/**
 * Fixed dimensions for AppShell elements.
 * All pages must respect these values to maintain visual consistency.
 */
export const layout = {
  // Top navigation bar (two-row)
  topBarBrandRowHeight: 44,   // px — brand logo + project selector + status
  topBarNavRowHeight:   44,   // px — page tab strip
  topBarTotalHeight:    88,   // px — sum of the two rows

  // Right panels (fixed-width overlays / sidebars)
  evidenceDrawerWidth:  360,  // px — SourceEvidenceDrawer
  filterPanelWidth:     200,  // px — Summaries FilterPanel
  devNotesWidth:        272,  // px — DevAnnotations panel
  devShowcaseNavWidth:  160,  // px — StateShowcase left nav

  // Page body
  pageBodyPaddingX: 28,  // px (px-7) — full-width page elements
  cardPaddingX:     20,  // px (px-5) — inside cards
  cardPaddingY:     16,  // px (py-4) — inside cards
  cardHeaderPaddingY: 14, // px (py-3.5) — card title rows
  subHeaderPaddingY:  10, // px (py-2.5) — compact page-level sub-headers
  pageBodyPadding:    20, // px (p-5)   — page scrollable area inset

  // Grid gaps
  gapSm: 12, // px (gap-3)
  gapMd: 16, // px (gap-4)
} as const;

// ─── Card presets ─────────────────────────────────────────────────────────────

/** Standard card shell — apply to every white rounded panel */
export const card = {
  background:   color.surface,
  border:       `1px solid ${color.borderSubtle}`,
  borderRadius: radius.xl,
} as const;

/** Compact sub-header that sits below TopNav on each page */
export const subHeader = {
  background:   color.surface,
  borderBottom: `1px solid ${color.borderSubtle}`,
  paddingX:     `${layout.pageBodyPaddingX}px`,
  paddingY:     `${layout.subHeaderPaddingY}px`,
} as const;

// ─── Convenience re-export ────────────────────────────────────────────────────

export const tokens = { color, typography, spacing, radius, shadow, layout, card, subHeader };
export default tokens;
