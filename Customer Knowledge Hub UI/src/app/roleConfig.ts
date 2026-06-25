/**
 * Role-based view configuration.
 * Controls which content is emphasised on Dashboard, which questions appear in Ask AI,
 * and which alerts/updates are flagged as relevant.
 * NOT a permissions or authentication system — lens only.
 */

import { Role } from "./types";

export interface RoleFocusItem {
  text: string;
  type: "action" | "risk" | "change" | "info";
}

export interface RoleConfig {
  label: Role;
  /** Short label used in "Relevant for" badges */
  short: string;
  /** One-line dashboard headline for the role focus card */
  headline: string;
  /** 3–4 specific items to surface on the dashboard */
  focusItems: RoleFocusItem[];
  /** Tracked topics most relevant to this role */
  highlightedTopics: string[];
  /** KPI card label to visually emphasise */
  emphasisKpi: string;
  /** Suggested questions for Ask AI */
  suggestedQuestions: string[];
  /** Accent colour for role pill */
  accentColor: string;
  accentBg: string;
}

export const roles: Role[] = [
  "Project Manager",
  "Web Scraping Team",
  "AIML Engineer",
  "QA Team",
  "Sales Team",
  "Senior Management",
  "All Views",
];

export const roleConfig: Record<Role, RoleConfig> = {
  "Project Manager": {
    label: "Project Manager",
    short: "PM",
    headline: "No grounded updates available for this role yet",
    focusItems: [],
    highlightedTopics: ["Scope", "SLA", "Commercials", "Open Questions"],
    emphasisKpi: "Open Follow-ups",
    suggestedQuestions: [
      "What action items are still outstanding?",
      "What changed since the last customer call?",
      "Which requirements are still open or assumptions?",
      "What are the key risks before Q3 go-live?",
      "What open questions need to go back to LSEG?",
      "Which decisions were made in the last SteerCo?",
    ],
    accentColor: "#2563eb",
    accentBg: "rgba(59,130,246,0.08)",
  },

  "Web Scraping Team": {
    label: "Web Scraping Team",
    short: "Scraping",
    headline: "No grounded updates available for this role yet",
    focusItems: [],
    highlightedTopics: ["Source List", "Monitoring Cadence"],
    emphasisKpi: "New Customer Inputs",
    suggestedQuestions: [
      "What sources are confirmed for Phase 1?",
      "Which sources are in scope for Phase 1 vs Phase 2?",
      "What is the agreed refresh cadence for OFAC?",
      "What new source categories were added to the source list?",
      "What monitoring cadence has the customer confirmed?",
    ],
    accentColor: "#16a34a",
    accentBg: "rgba(22,163,74,0.08)",
  },

  "AIML Engineer": {
    label: "AIML Engineer",
    short: "AIML",
    headline: "No grounded updates available for this role yet",
    focusItems: [],
    highlightedTopics: ["Schema/API", "Alerts"],
    emphasisKpi: "Open Alerts",
    suggestedQuestions: [
      "What changed in the swagger schema between v1.0.4 and v1.0.5?",
      "What fields are required in the current ingestion schema?",
      "What is the customer's expected API throughput volume?",
      "Which schema fields have breaking changes?",
      "What extraction fields are defined in the current schema?",
      "What confidence or validation requirements are mentioned?",
    ],
    accentColor: "#7c3aed",
    accentBg: "rgba(139,92,246,0.08)",
  },

  "QA Team": {
    label: "QA Team",
    short: "QA",
    headline: "No grounded updates available for this role yet",
    focusItems: [],
    highlightedTopics: ["Schema/API", "SLA", "Source List"],
    emphasisKpi: "Open Follow-ups",
    suggestedQuestions: [
      "What is the acceptance criteria for Phase 1 UAT?",
      "Which requirements have changed since the last review?",
      "What requirements are still assumptions not confirmed by the customer?",
      "What is the entity match accuracy target?",
      "Which SLA values have been formally confirmed by the customer?",
      "What evidence supports the current requirement status?",
    ],
    accentColor: "#d97706",
    accentBg: "rgba(217,119,6,0.08)",
  },

  "Sales Team": {
    label: "Sales Team",
    short: "Sales",
    headline: "No grounded updates available for this role yet",
    focusItems: [],
    highlightedTopics: ["Scope", "Commercials", "Reports"],
    emphasisKpi: "Files Indexed",
    suggestedQuestions: [
      "What are the key customer priorities for LSEG Risk Intelligence?",
      "What scope has been confirmed for Phase 1?",
      "What commercial model has the customer agreed to?",
      "What value-add opportunities exist for Phase 2?",
      "What is the latest from the customer on delivery expectations?",
      "What proposal or deck updates are relevant for the next customer meeting?",
    ],
    accentColor: "#0284c7",
    accentBg: "rgba(14,165,233,0.08)",
  },

  "Senior Management": {
    label: "Senior Management",
    short: "Leadership",
    headline: "No grounded updates available for this role yet",
    focusItems: [],
    highlightedTopics: ["Scope", "SLA", "Commercials"],
    emphasisKpi: "Open Alerts",
    suggestedQuestions: [
      "What is the executive summary of the LSEG RI engagement?",
      "What are the major risks to Phase 1 delivery?",
      "What key decisions have been made with the customer?",
      "What is the current delivery status and Q3 go-live readiness?",
      "What customer dependencies are blocking progress?",
      "What are the open commercial items before contract sign-off?",
    ],
    accentColor: "#475569",
    accentBg: "rgba(100,116,139,0.08)",
  },

  "All Views": {
    label: "All Views",
    short: "All",
    headline: "Showing all content across all role lenses",
    focusItems: [
      { text: "All tracked topics, alerts and updates visible", type: "info" },
      { text: "Role-specific filters not applied", type: "info" },
    ],
    highlightedTopics: [],
    emphasisKpi: "",
    suggestedQuestions: [
      "What changed since the last customer call?",
      "What are the open questions for the next meeting?",
      "What has the customer confirmed about the swagger schema?",
      "Which sources are in Phase 1 scope?",
      "What action items are still pending?",
      "Which requirements are still assumptions?",
      "What is the agreed SLA for sanctions match queries?",
    ],
    accentColor: "#6b7280",
    accentBg: "rgba(107,114,128,0.08)",
  },
};

/** Short display labels for multi-role "Relevant for" badges */
export const roleShort: Record<Role, string> = Object.fromEntries(
  roles.map((r) => [r, roleConfig[r].short])
) as Record<Role, string>;

/**
 * Which roles each alert type is primarily relevant to.
 * Used to populate the "Relevant for" badge on alert rows.
 */
export type AlertRelevance = { short: string; color: string };

export const alertRoleRelevance: Record<string, AlertRelevance[]> = {
  "Schema/API Update Detected": [
    { short: "AIML",    color: "#7c3aed" },
    { short: "QA",      color: "#d97706" },
  ],
  "Source List Changed": [
    { short: "Scraping", color: "#16a34a" },
    { short: "PM",       color: "#2563eb" },
  ],
  "New Open Question": [
    { short: "PM",   color: "#2563eb" },
    { short: "AIML", color: "#7c3aed" },
  ],
  "New Meeting Note Added": [
    { short: "PM",  color: "#2563eb" },
    { short: "All", color: "#6b7280" },
  ],
  "SLA Mention Detected": [
    { short: "PM",         color: "#2563eb" },
    { short: "QA",         color: "#d97706" },
    { short: "Leadership", color: "#475569" },
  ],
  "New Customer File Added": [
    { short: "PM",    color: "#2563eb" },
    { short: "Sales", color: "#0284c7" },
  ],
  "New Action Item": [
    { short: "PM",      color: "#2563eb" },
    { short: "Scraping", color: "#16a34a" },
  ],
  "Customer Document Changed": [
    { short: "PM", color: "#2563eb" },
    { short: "QA", color: "#d97706" },
  ],
};
