export type SourceType = "Meeting" | "Email" | "Document" | "Deck" | "Schema" | "Source List";

export type Role =
  | "Project Manager"
  | "Web Scraping Team"
  | "AIML Engineer"
  | "QA Team"
  | "Sales Team"
  | "Senior Management"
  | "All Views";

export interface EvidenceItem {
  file: string;
  type: SourceType;
  date: string;
  excerpt: string;
  topic?: string;
  backendFileId?: number;
}

export type Page = "dashboard" | "files" | "summaries" | "ask" | "alerts" | "settings";

export interface NavContext {
  summariesTab?: "brief" | "timeline" | "topics" | "requirements" | "files" | "followups" | "candidates";
  summariesTopic?: string;
  fileLibraryFilter?: "new" | "customer";
  alertsFilter?: "new";
  askContext?: string;
}

// ─── Mock data types ──────────────────────────────────────────────────────────

export type FileType = "DOCX" | "YAML" | "XLSX" | "PPTX" | "MSG" | "PDF" | "JSON" | "EML";
export type FileCategory = "RFP" | "Meeting Notes" | "Schema" | "Source List" | "Deck" | "Onboarding" | "Email";
export type CustomerRelevance = "Customer Provided" | "Meeting Note" | "Email Export" | "Schema" | "Source List" | "Internal Deck" | "Reference";
export type SummaryStatus = "Done" | "Pending" | "Skipped";

export interface CustomerFile {
  name: string;
  type: FileType;
  category: FileCategory;
  updated: string;
  summaryStatus: SummaryStatus;
  tags: string[];
  customerRelevance: CustomerRelevance;
  excerpt: string;
  topic: string;
}

export type Severity = "High" | "Medium" | "Low";
export type AlertStatus = "New" | "Reviewed" | "Ignored" | "Action";
export type AlertType =
  | "New Customer File Added"
  | "Customer Document Changed"
  | "New Meeting Note Added"
  | "Schema/API Update Detected"
  | "Source List Changed"
  | "SLA Mention Detected"
  | "New Open Question"
  | "New Action Item";

export interface AlertItem {
  id: number;
  severity: Severity;
  type: AlertType;
  description: string;
  sourceFile: string;
  sourceType: SourceType;
  topic: string;
  status: AlertStatus;
  created: string;
  excerpt: string;
}

export interface CustomerUpdate {
  date: string;
  text: string;
  source: SourceType;
  file: string;
  topic: string;
  excerpt: string;
}

export interface TrackedTopic {
  name: string;
  understanding: string;
  updates: string[];
  questions: string[];
  evidence: EvidenceItem[];
}

export type ReqStatus = "Confirmed" | "Open" | "Changed" | "Assumption" | "Superseded";
export type Priority = "High" | "Medium" | "Low";

export interface RequirementItem {
  text: string;
  status: ReqStatus;
  topic: string;
  updated: string;
  source: SourceType;
  file: string;
  excerpt: string;
}

export interface ActionItem {
  text: string;
  owner: string;
  due: string;
  priority: Priority;
}

export interface TimelineEntry {
  date: string;
  time: string;
  source: SourceType;
  file: string;
  topic: string;
  summary: string;
  excerpt: string;
}

export interface FileSummaryEntry {
  name: string;
  category: string;
  date: string;
  status: string;
  excerpt: string;
  topic: string;
}

export interface KpiCardData {
  label: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  accentColor: string;
  accentBg: string;
  nav: { page: Page; ctx: NavContext };
}

export interface RecentUpdate {
  file: string;
  sourceType: SourceType;
  action: string;
  topic: string;
  time: string;
}

export interface AskAIMessage {
  role: "user" | "assistant";
  text: string;
  sources?: { file: string; snippet: string; confidence: number; page?: number }[];
}

export interface RelatedFile {
  name: string;
  relevance: number;
}

export interface AlertRule {
  id: number;
  type: string;
  enabled: boolean;
  description: string;
}

export interface BriefData {
  understanding: string;
  latestUpdates: CustomerUpdate[];
  confirmedRequirements: string[];
  openQuestions: string[];
  followUps: ActionItem[];
  risks: string[];
  evidence: EvidenceItem[];
}
