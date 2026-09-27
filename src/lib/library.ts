export interface LibAgent {
  id: string;
  name: string;
  desc: string;
  owner: string;
  version: string;
  installs: string;
  framework: string;
  model: string;
  tools: string[];
  category: "Research" | "Sales" | "Support" | "Docs" | "Engineering" | "Ops";
  scope: "workspace" | "public";
  verified?: boolean;
}

export const LIBRARY: LibAgent[] = [
  { id: "web-researcher", name: "Web Researcher", desc: "Searches the web, reads the top sources and returns cited findings.", owner: "Lyzr", version: "3.2.0", installs: "18.4k", framework: "lyzr", model: "claude-sonnet", tools: ["web_search", "http.request"], category: "Research", scope: "public", verified: true },
  { id: "pii-redactor", name: "PII Redactor", desc: "Detects and masks names, emails, phone numbers and IDs before data leaves your app.", owner: "Lyzr", version: "2.0.1", installs: "9.1k", framework: "lyzr", model: "gpt-5-mini", tools: [], category: "Ops", scope: "public", verified: true },
  { id: "doc-extractor", name: "Document Extractor", desc: "Turns PDFs, scans and invoices into clean JSON with confidence scores.", owner: "Lyzr", version: "1.8.0", installs: "12.7k", framework: "lyzr", model: "gemini-pro", tools: ["vision.ocr"], category: "Docs", scope: "public", verified: true },
  { id: "email-writer", name: "Email Writer", desc: "Writes short, specific emails in your brand voice. Never uses buzzwords.", owner: "Growth team", version: "1.4.0", installs: "212", framework: "lyzr", model: "claude-sonnet", tools: ["gmail.draft"], category: "Sales", scope: "workspace" },
  { id: "ticket-triager", name: "Ticket Triager", desc: "Classifies tickets by topic, urgency and sentiment. Escalates P0s.", owner: "Support team", version: "2.3.0", installs: "88", framework: "langgraph", model: "gpt-5-mini", tools: ["slack.post"], category: "Support", scope: "workspace" },
  { id: "sql-analyst", name: "SQL Analyst", desc: "Answers questions about your data by writing and running read-only SQL.", owner: "community/@datadev", version: "0.9.2", installs: "3.3k", framework: "crewai", model: "gpt-5", tools: ["mcp:postgres"], category: "Engineering", scope: "public" },
  { id: "pr-reviewer", name: "PR Reviewer", desc: "Reviews pull requests for bugs, security issues and missing tests.", owner: "community/@shipfast", version: "1.1.0", installs: "5.6k", framework: "openai-agents", model: "claude-opus", tools: ["mcp:github"], category: "Engineering", scope: "public" },
  { id: "meeting-scheduler", name: "Meeting Scheduler", desc: "Finds a slot that works for everyone and sends the invite.", owner: "Ops team", version: "1.0.3", installs: "41", framework: "lyzr", model: "gpt-5-mini", tools: ["calendar.create_event"], category: "Ops", scope: "workspace" },
];
