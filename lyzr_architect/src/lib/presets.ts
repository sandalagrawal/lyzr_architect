import type { AgentSpec, PageSpec, TableSpec } from "./types";

export interface Capability { id: string; label: string; agent: Omit<AgentSpec, "id" | "model"> }
export interface Preset {
  key: string;
  name: string;
  tagline: string;
  keywords: string[];
  audiences: string[];
  capabilities: Capability[];
  integrations: string[];
  pages: PageSpec[];
  data: TableSpec[];
  sample: {
    inputLabel: string;
    placeholder: string;
    cta: string;
    resultTitle: string;
    stats: { label: string; value: string }[];
    results: { title: string; meta: string; body: string; score: number; tag: string }[];
  };
}

export const PRESETS: Preset[] = [
  {
    key: "sales",
    name: "LeadScout",
    tagline: "Research, qualify and reach out to leads on autopilot",
    keywords: ["lead", "sales", "outreach", "prospect", "crm", "cold email", "pipeline", "sdr", "b2b"],
    audiences: ["SDRs & AEs on a sales team", "Founders doing their own sales", "Agencies running outbound for clients"],
    capabilities: [
      { id: "research", label: "Research each company & contact", agent: { name: "Prospect Researcher", role: "Finds company facts, recent news and the right contact", tools: ["web_search", "apollo.enrich"], instructions: "Given a company or person, gather firmographics, recent news and 3 talking points. Cite sources." } },
      { id: "score", label: "Score fit against our ICP", agent: { name: "Fit Scorer", role: "Scores each lead 0–100 against the ideal customer profile", tools: ["knowledge.icp"], instructions: "Score the lead against the ICP document. Return a score and the top 3 reasons.", knowledge: ["icp.pdf"] } },
      { id: "write", label: "Draft personalised outreach", agent: { name: "Outreach Writer", role: "Writes a short, specific first email", tools: ["gmail.draft"], instructions: "Write a 90-word email that references one research insight. No buzzwords." } },
      { id: "sync", label: "Log everything to the CRM", agent: { name: "CRM Clerk", role: "Keeps HubSpot in sync", tools: ["hubspot.upsert_contact"], instructions: "Upsert contact and log the email as an activity." } },
    ],
    integrations: ["Apollo", "Gmail", "HubSpot", "Slack"],
    pages: [
      { name: "Dashboard", route: "/", purpose: "Pipeline at a glance and a quick research box" },
      { name: "Leads", route: "/leads", purpose: "All researched leads with scores" },
      { name: "Sequences", route: "/sequences", purpose: "Drafted emails awaiting approval" },
      { name: "Settings", route: "/settings", purpose: "ICP, tone of voice, connected tools" },
    ],
    data: [
      { name: "leads", fields: [{ name: "id", type: "uuid" }, { name: "company", type: "text" }, { name: "contact", type: "text" }, { name: "score", type: "int" }, { name: "status", type: "text" }, { name: "insights", type: "jsonb" }] },
      { name: "drafts", fields: [{ name: "id", type: "uuid" }, { name: "lead_id", type: "uuid" }, { name: "subject", type: "text" }, { name: "body", type: "text" }, { name: "approved", type: "bool" }] },
    ],
    sample: {
      inputLabel: "Research a lead",
      placeholder: "Company name, website or LinkedIn URL",
      cta: "Research",
      resultTitle: "Latest leads",
      stats: [{ label: "Leads researched", value: "128" }, { label: "Avg. fit score", value: "71" }, { label: "Emails drafted", value: "46" }, { label: "Reply rate", value: "18%" }],
      results: [
        { title: "Northwind Logistics", meta: "Priya Menon · VP Operations", body: "Opened 2 new warehouses in Q3; hiring 40 ops roles — manual scheduling is a stated pain.", score: 92, tag: "Hot" },
        { title: "Cobalt Health", meta: "Daniel Ortiz · Head of RevOps", body: "Moved from Salesforce to HubSpot last month. Team of 12 SDRs, no enrichment tool yet.", score: 78, tag: "Warm" },
        { title: "Lumen Studio", meta: "Aisha Khan · Founder", body: "6-person design agency. Good content fit but below ICP headcount.", score: 41, tag: "Nurture" },
      ],
    },
  },
  {
    key: "education",
    name: "GradeMate",
    tagline: "Evaluate subjective answer sheets with mentor-quality feedback",
    keywords: ["exam", "student", "grade", "evaluate", "evaluation", "paper", "answer", "ca ", "teacher", "mock", "tutor", "course"],
    audiences: ["Students preparing for exams", "Coaching institutes & mentors", "Teachers grading at scale"],
    capabilities: [
      { id: "read", label: "Read handwritten answer sheets", agent: { name: "Sheet Reader", role: "OCRs scanned answer sheets into structured answers", tools: ["vision.ocr"], instructions: "Extract each answer with its question number. Flag illegible parts instead of guessing." } },
      { id: "grade", label: "Grade against the marking scheme", agent: { name: "Evaluator", role: "Marks each answer step-by-step like an examiner", tools: ["knowledge.marking_scheme"], instructions: "Award marks per the scheme. Show where marks were lost and why.", knowledge: ["marking-scheme.pdf", "past-papers/"] } },
      { id: "coach", label: "Give personal improvement tips", agent: { name: "Mentor Coach", role: "Turns mistakes into a study plan", tools: ["knowledge.syllabus"], instructions: "Summarise the 3 biggest gaps and suggest a 7-day plan. Be encouraging and specific." } },
      { id: "notify", label: "Send results to the student", agent: { name: "Notifier", role: "Delivers results over email or WhatsApp", tools: ["gmail.send"], instructions: "Send the report card with a friendly note." } },
    ],
    integrations: ["Google Drive", "Gmail", "Google Sheets", "Telegram"],
    pages: [
      { name: "Dashboard", route: "/", purpose: "Upload a paper and see recent evaluations" },
      { name: "Submissions", route: "/submissions", purpose: "Every paper with marks and status" },
      { name: "Report card", route: "/report/[id]", purpose: "Per-question marks and mentor feedback" },
      { name: "Settings", route: "/settings", purpose: "Marking schemes and syllabus" },
    ],
    data: [
      { name: "submissions", fields: [{ name: "id", type: "uuid" }, { name: "student", type: "text" }, { name: "paper", type: "text" }, { name: "marks", type: "int" }, { name: "status", type: "text" }] },
      { name: "feedback", fields: [{ name: "id", type: "uuid" }, { name: "submission_id", type: "uuid" }, { name: "question", type: "text" }, { name: "comment", type: "text" }] },
    ],
    sample: {
      inputLabel: "Evaluate a paper",
      placeholder: "Upload a scanned answer sheet or paste an answer",
      cta: "Evaluate",
      resultTitle: "Recent evaluations",
      stats: [{ label: "Papers evaluated", value: "312" }, { label: "Avg. score", value: "58%" }, { label: "Turnaround", value: "4 min" }, { label: "Students", value: "87" }],
      results: [
        { title: "Rohan S. — Advanced Accounting, Mock 3", meta: "Evaluated 12 min ago", body: "Strong on consolidation; lost 9 marks on AS-22 presentation. Mentor plan: 3 practice questions.", score: 64, tag: "Pass" },
        { title: "Meera K. — Taxation, Mock 2", meta: "Evaluated 1 h ago", body: "Correct computations but missing section references in 4 answers.", score: 71, tag: "Pass" },
        { title: "Arjun P. — Audit, Mock 1", meta: "Evaluated today", body: "Answers too brief; examiner keywords missing. Focus on SA 700 framing.", score: 38, tag: "Retry" },
      ],
    },
  },
  {
    key: "support",
    name: "Helpwise",
    tagline: "Triage, answer and escalate support tickets with agents",
    keywords: ["support", "ticket", "helpdesk", "customer service", "complaint", "faq", "zendesk", "freshdesk"],
    audiences: ["Support agents", "Customer success managers", "Founders handling support"],
    capabilities: [
      { id: "triage", label: "Triage & tag incoming tickets", agent: { name: "Triage Agent", role: "Classifies urgency, topic and sentiment", tools: ["freshdesk.read"], instructions: "Tag each ticket with topic, urgency (P0–P3) and sentiment." } },
      { id: "answer", label: "Draft answers from our docs", agent: { name: "Answer Drafter", role: "Drafts replies grounded in the help center", tools: ["knowledge.helpcenter"], instructions: "Answer only from the knowledge base. If unsure, say so.", knowledge: ["helpcenter/"] } },
      { id: "escalate", label: "Escalate urgent issues to Slack", agent: { name: "Escalation Agent", role: "Pings on-call for P0s", tools: ["slack.post"], instructions: "Post P0 tickets to #support-urgent with a 2-line summary." } },
    ],
    integrations: ["Freshdesk", "Slack", "Notion"],
    pages: [
      { name: "Inbox", route: "/", purpose: "Tickets with AI-drafted replies" },
      { name: "Insights", route: "/insights", purpose: "Trends in topics and sentiment" },
      { name: "Knowledge", route: "/knowledge", purpose: "Docs the agents can use" },
    ],
    data: [{ name: "tickets", fields: [{ name: "id", type: "uuid" }, { name: "subject", type: "text" }, { name: "priority", type: "text" }, { name: "draft", type: "text" }, { name: "status", type: "text" }] }],
    sample: {
      inputLabel: "Try a ticket",
      placeholder: "Paste a customer message",
      cta: "Draft reply",
      resultTitle: "Inbox",
      stats: [{ label: "Open tickets", value: "34" }, { label: "Auto-resolved", value: "61%" }, { label: "First reply", value: "2m" }, { label: "CSAT", value: "4.7" }],
      results: [
        { title: "Can't export invoices to CSV", meta: "P2 · Billing · neutral", body: "Draft ready: explains the Reports → Export path and the 10k row limit.", score: 88, tag: "Draft ready" },
        { title: "Site down for our whole team!!", meta: "P0 · Outage · angry", body: "Escalated to #support-urgent. Draft acknowledges and links status page.", score: 95, tag: "Escalated" },
        { title: "How do I add a teammate?", meta: "P3 · Account · positive", body: "Auto-resolved with help-center article.", score: 99, tag: "Resolved" },
      ],
    },
  },
  {
    key: "research",
    name: "BriefBot",
    tagline: "Turn any topic into a sourced, ready-to-share brief",
    keywords: ["research", "report", "summar", "news", "content", "blog", "brief", "market", "competitor", "newsletter"],
    audiences: ["Analysts & consultants", "Marketing teams", "Founders tracking a market"],
    capabilities: [
      { id: "search", label: "Search the web & papers", agent: { name: "Researcher", role: "Finds and reads sources", tools: ["web_search", "arxiv.search"], instructions: "Find 8–12 high-quality sources. Prefer primary sources." } },
      { id: "synth", label: "Synthesise key findings", agent: { name: "Analyst", role: "Extracts claims, numbers and disagreements", tools: [], instructions: "Group findings into themes. Note where sources disagree." } },
      { id: "write", label: "Write the final brief", agent: { name: "Writer", role: "Writes a crisp brief with citations", tools: ["google_docs.create"], instructions: "Write a 1-page brief: summary, 3 themes, implications, sources." } },
    ],
    integrations: ["Google Docs", "Notion", "Slack"],
    pages: [
      { name: "New brief", route: "/", purpose: "Ask a question, get a brief" },
      { name: "Library", route: "/library", purpose: "All past briefs" },
    ],
    data: [{ name: "briefs", fields: [{ name: "id", type: "uuid" }, { name: "question", type: "text" }, { name: "body", type: "text" }, { name: "sources", type: "jsonb" }] }],
    sample: {
      inputLabel: "What should we research?",
      placeholder: "e.g. How are Indian D2C brands using AI agents in 2026?",
      cta: "Create brief",
      resultTitle: "Recent briefs",
      stats: [{ label: "Briefs", value: "54" }, { label: "Sources read", value: "1,208" }, { label: "Avg. time", value: "3m" }, { label: "Shared", value: "31" }],
      results: [
        { title: "Agentic AI in Indian fintech", meta: "12 sources · 2 days ago", body: "Adoption led by KYC and collections; regulators cautious on autonomous credit decisions.", score: 90, tag: "Shared" },
        { title: "Vibe-coding platforms: market map", meta: "9 sources · last week", body: "Consolidating around 3 archetypes: prototypers, full-stack builders, IDE agents.", score: 84, tag: "Draft" },
        { title: "Quick-commerce unit economics", meta: "11 sources · last week", body: "Dark-store density is the key lever; AOV growth slowing.", score: 77, tag: "Shared" },
      ],
    },
  },
];

export const GENERIC: Preset = {
  key: "generic",
  name: "Flowpilot",
  tagline: "An agentic workspace for your team's repetitive work",
  keywords: [],
  audiences: ["An internal team", "Customers of my business", "Just me"],
  capabilities: [
    { id: "intake", label: "Understand the request", agent: { name: "Intake Agent", role: "Turns messy input into a structured task", tools: [], instructions: "Extract the goal, inputs and constraints." } },
    { id: "do", label: "Do the work", agent: { name: "Worker Agent", role: "Executes the task with tools", tools: ["web_search"], instructions: "Complete the task step by step and explain what you did." } },
    { id: "review", label: "Review quality before sending", agent: { name: "Reviewer", role: "Checks the output against the goal", tools: [], instructions: "Score the output 1–5 and fix issues before returning." } },
  ],
  integrations: ["Slack", "Gmail", "Google Sheets"],
  pages: [
    { name: "Home", route: "/", purpose: "Submit a task, see results" },
    { name: "History", route: "/history", purpose: "Every run with its output" },
    { name: "Settings", route: "/settings", purpose: "Connections and preferences" },
  ],
  data: [{ name: "runs", fields: [{ name: "id", type: "uuid" }, { name: "input", type: "text" }, { name: "output", type: "text" }, { name: "status", type: "text" }] }],
  sample: {
    inputLabel: "What do you need done?",
    placeholder: "Describe the task",
    cta: "Run",
    resultTitle: "Recent runs",
    stats: [{ label: "Runs", value: "76" }, { label: "Success", value: "94%" }, { label: "Time saved", value: "11h" }, { label: "Agents", value: "3" }],
    results: [
      { title: "Weekly vendor summary", meta: "Completed · 5 min ago", body: "Collected 14 invoices, flagged 2 mismatches.", score: 96, tag: "Done" },
      { title: "Onboard new client", meta: "Completed · 1 h ago", body: "Created folders, sent welcome email, added to CRM.", score: 90, tag: "Done" },
      { title: "Clean up Q3 sheet", meta: "Needs review · today", body: "Merged 3 tabs; 6 rows need a human decision.", score: 70, tag: "Review" },
    ],
  },
};

export function pickPreset(prompt: string): Preset {
  const p = " " + prompt.toLowerCase() + " ";
  let best: Preset = GENERIC;
  let bestScore = 0;
  for (const pr of PRESETS) {
    const s = pr.keywords.reduce((acc, k) => acc + (p.includes(k) ? 1 : 0), 0);
    if (s > bestScore) {
      best = pr;
      bestScore = s;
    }
  }
  return best;
}

export const TEMPLATES = [
  { title: "Lead research & outreach", prompt: "Build a lead research app for our SDR team: research a company, score it against our ICP and draft a personalised cold email.", preset: "sales", uses: "2.1k" },
  { title: "Exam answer evaluator", prompt: "Build an app where CA students upload mock answer sheets and get marks plus mentor-style feedback on each answer.", preset: "education", uses: "640" },
  { title: "Support ticket copilot", prompt: "Build a support inbox that triages Freshdesk tickets, drafts replies from our help center and escalates P0s to Slack.", preset: "support", uses: "1.4k" },
  { title: "Research brief generator", prompt: "Build a research tool that turns any question into a sourced one-page brief and saves it to Notion.", preset: "research", uses: "980" },
];

export const MODELS = [
  { id: "auto", name: "Auto", note: "Picks the best model per step", cost: "—" },
  { id: "gpt-5", name: "GPT-5", note: "Strong reasoning", cost: "$$$" },
  { id: "gpt-5-mini", name: "GPT-5 mini", note: "Fast, cheap", cost: "$" },
  { id: "claude-sonnet", name: "Claude Sonnet", note: "Great at writing & tools", cost: "$$" },
  { id: "claude-opus", name: "Claude Opus", note: "Deepest reasoning", cost: "$$$$" },
  { id: "gemini-pro", name: "Gemini Pro", note: "Long context, multimodal", cost: "$$" },
  { id: "llama-70b", name: "Llama 3.3 70B", note: "Open weights, self-hostable", cost: "$" },
];

export const FRAMEWORKS = [
  { id: "lyzr", name: "Lyzr Agent", note: "Managed, with memory, RAG & guardrails" },
  { id: "gitagent", name: "GitAgent", note: "Agent as files in your repo" },
  { id: "langgraph", name: "LangGraph", note: "Python/TS graph orchestration" },
  { id: "crewai", name: "CrewAI", note: "Role-based multi-agent crews" },
  { id: "openai-agents", name: "OpenAI Agents SDK", note: "Handoffs & guardrails" },
  { id: "mastra", name: "Mastra", note: "TypeScript agent framework" },
];
