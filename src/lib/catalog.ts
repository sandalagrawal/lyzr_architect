/* Prompt Library, Marketplace apps and the AI Consultant's idea engine. */

export const PROMPT_LIBRARY: { cat: string; items: { title: string; prompt: string; tools: string[] }[] }[] = [
  {
    cat: "Sales & Marketing",
    items: [
      { title: "Lead research & outreach", tools: ["Apollo", "Gmail", "HubSpot"], prompt: "Build a lead research app for our SDR team. User pastes a company name or URL. A researcher agent gathers firmographics, recent news and 3 talking points; a scorer agent rates fit 0–100 against our ICP doc; a writer agent drafts a 90-word personalised email. Show a table of leads with score, status and the draft; approved drafts go to Gmail and HubSpot." },
      { title: "Competitor watch", tools: ["Slack", "Notion"], prompt: "Build a competitor-monitoring app. Every morning an agent checks 5 competitor websites, changelogs and LinkedIn pages, summarises what changed, and posts a digest to #market-intel in Slack. Keep a searchable history in Notion." },
      { title: "Social post studio", tools: ["LinkedIn", "Twitter/X"], prompt: "Build an app that turns a blog URL into 3 LinkedIn posts and a 5-tweet thread in our brand voice, with a review queue before anything is published." },
    ],
  },
  {
    cat: "Operations",
    items: [
      { title: "Invoice checker", tools: ["Gmail", "Google Sheets"], prompt: "Build an app that reads vendor invoices from a Gmail label, extracts line items, matches them against purchase orders in Google Sheets and flags mismatches for review." },
      { title: "Meeting-to-tasks", tools: ["Google Calendar", "Asana"], prompt: "Build an app that takes meeting transcripts, extracts decisions and action items with owners and due dates, and creates tasks in Asana." },
    ],
  },
  {
    cat: "Customer Support",
    items: [
      { title: "Support ticket copilot", tools: ["Freshdesk", "Slack"], prompt: "Build a support inbox that triages Freshdesk tickets by urgency and topic, drafts replies from our help-center docs, and escalates P0s to Slack with a 2-line summary." },
      { title: "Refund decision assistant", tools: ["Stripe", "Zendesk"], prompt: "Build an assistant that reviews refund requests against our policy, checks the order in Stripe, recommends approve/deny with reasoning, and needs a human click to execute." },
    ],
  },
  {
    cat: "HR & People",
    items: [
      { title: "Resume screener", tools: ["Gmail", "Google Calendar"], prompt: "Build a hiring app: upload resumes for a role, an agent scores each against the JD with evidence, shortlists the top 10, and proposes interview slots on Google Calendar." },
      { title: "Policy Q&A bot", tools: ["Google Drive", "Slack"], prompt: "Build an HR policy assistant that answers employee questions from our policy PDFs in Google Drive, cites the section, and hands off to HR in Slack when unsure." },
    ],
  },
  {
    cat: "Finance",
    items: [
      { title: "Expense auditor", tools: ["Microsoft Excel", "Slack"], prompt: "Build an app that audits monthly expense reports in Excel against our travel policy, highlights violations and sends each manager a summary on Slack." },
    ],
  },
  {
    cat: "Education",
    items: [
      { title: "Exam answer evaluator", tools: ["Google Drive", "Gmail"], prompt: "Build an app where CA students upload mock answer sheets and get marks plus mentor-style feedback on each answer, graded against the official marking scheme." },
    ],
  },
  {
    cat: "Product & Engineering",
    items: [
      { title: "Bug triage from Slack", tools: ["Slack", "Linear"], prompt: "Build an app that watches #bugs in Slack, deduplicates reports, asks for missing repro steps, and files well-formed issues in Linear with severity." },
      { title: "Release notes writer", tools: ["GitHub", "Notion"], prompt: "Build an app that reads merged PRs from GitHub each week and writes customer-facing release notes into Notion, grouped by feature area." },
    ],
  },
];

export const MARKET_APPS = [
  { id: "m1", name: "LeadScout", by: "Lyzr", preset: "sales", remixes: "3.1k", rating: 4.8, desc: "Research, score and reach out to leads.", color: "#3452F5", verified: true },
  { id: "m2", name: "GradeMate", by: "community/@sandal", preset: "education", remixes: "412", rating: 4.9, desc: "Evaluate subjective answer sheets with mentor feedback.", color: "#0F9D76" },
  { id: "m3", name: "Helpwise", by: "Lyzr", preset: "support", remixes: "2.2k", rating: 4.7, desc: "Triage and answer support tickets from your docs.", color: "#E0457B", verified: true },
  { id: "m4", name: "BriefBot", by: "community/@analystkit", preset: "research", remixes: "1.5k", rating: 4.6, desc: "Turn any question into a sourced one-page brief.", color: "#F59E0B" },
  { id: "m5", name: "Invoice Guard", by: "community/@opsfolk", preset: "generic", remixes: "688", rating: 4.5, desc: "Match invoices to POs and flag mismatches.", color: "#7C3AED" },
  { id: "m6", name: "HireLens", by: "Lyzr", preset: "generic", remixes: "940", rating: 4.6, desc: "Screen resumes against a JD with evidence.", color: "#0D9488", verified: true },
];

export interface Idea { title: string; pitch: string; hours: number; agents: string[]; prompt: string }

const IDEA_BANK: { match: RegExp; ideas: Idea[] }[] = [
  {
    match: /sales|market|growth|bd|business dev|founder/i,
    ideas: [
      { title: "Lead research autopilot", pitch: "Research every inbound lead and draft the first email before your coffee.", hours: 6, agents: ["Researcher", "Fit Scorer", "Writer"], prompt: "Build a lead research app: research each new lead, score it against our ICP and draft a personalised first email for approval." },
      { title: "Meeting prep briefs", pitch: "A one-page brief on every prospect, 30 minutes before each call.", hours: 3, agents: ["Calendar Watcher", "Researcher"], prompt: "Build an app that watches my Google Calendar and sends me a one-page brief on each external attendee 30 minutes before the meeting." },
      { title: "Follow-up nudger", pitch: "Never let a warm deal go cold — drafts follow-ups when threads stall.", hours: 2, agents: ["Inbox Watcher", "Writer"], prompt: "Build an app that detects stalled sales email threads and drafts a context-aware follow-up for me to approve." },
    ],
  },
  {
    match: /support|success|cx|customer/i,
    ideas: [
      { title: "Ticket triage copilot", pitch: "Every ticket tagged, prioritised and drafted in seconds.", hours: 8, agents: ["Triage", "Answer Drafter", "Escalation"], prompt: "Build a support copilot that triages tickets, drafts replies from our docs and escalates urgent ones to Slack." },
      { title: "Churn early-warning", pitch: "Spot unhappy accounts from tickets and usage before they leave.", hours: 3, agents: ["Signal Collector", "Risk Scorer"], prompt: "Build an app that scores churn risk from support tickets and product usage and alerts the account owner weekly." },
      { title: "Help-center gap finder", pitch: "Finds questions your docs don't answer and drafts the article.", hours: 2, agents: ["Analyst", "Writer"], prompt: "Build an app that clusters recent support questions, finds ones our help center doesn't cover and drafts new articles." },
    ],
  },
  {
    match: /hr|people|recruit|talent|hiring/i,
    ideas: [
      { title: "Resume screener", pitch: "Shortlist candidates against the JD with evidence, not vibes.", hours: 7, agents: ["Parser", "Scorer", "Scheduler"], prompt: "Build a resume screening app that scores candidates against the JD with evidence and proposes interview slots." },
      { title: "Onboarding buddy", pitch: "Answers new-joiner questions from your policies, 24/7.", hours: 4, agents: ["Policy Q&A", "Escalation"], prompt: "Build an onboarding assistant that answers new employees' questions from our policy docs and escalates to HR when unsure." },
      { title: "Interview note summariser", pitch: "Turns interviewer notes into a structured scorecard.", hours: 2, agents: ["Summariser"], prompt: "Build an app that converts raw interview notes into a structured scorecard against our hiring rubric." },
    ],
  },
  {
    match: /teach|student|educat|tutor|coach|exam|ca\b/i,
    ideas: [
      { title: "Answer-sheet evaluator", pitch: "Marks subjective answers against the scheme with mentor feedback.", hours: 10, agents: ["Sheet Reader", "Evaluator", "Mentor Coach"], prompt: "Build an app where students upload mock answer sheets and get marks plus mentor-style feedback on each answer." },
      { title: "Personal study planner", pitch: "A 7-day plan built from each student's weakest topics.", hours: 3, agents: ["Gap Finder", "Planner"], prompt: "Build an app that reads a student's test results and generates a personalised 7-day study plan." },
      { title: "Doubt-solving bot", pitch: "Answers syllabus doubts with citations from your notes.", hours: 5, agents: ["Tutor"], prompt: "Build a doubt-solving assistant that answers student questions from our notes and past papers with citations." },
    ],
  },
];

const GENERIC_IDEAS: Idea[] = [
  { title: "Inbox-to-tasks", pitch: "Turns requests buried in email into tracked tasks.", hours: 4, agents: ["Inbox Reader", "Task Creator"], prompt: "Build an app that reads my inbox, extracts requests and action items and creates tasks with due dates." },
  { title: "Weekly report writer", pitch: "Pulls numbers from your sheets and writes the weekly update.", hours: 3, agents: ["Data Collector", "Writer"], prompt: "Build an app that pulls metrics from Google Sheets every Friday and writes a weekly status report for my team." },
  { title: "Research assistant", pitch: "Any question → a sourced one-page brief.", hours: 3, agents: ["Researcher", "Writer"], prompt: "Build a research assistant that turns any question into a sourced one-page brief." },
];

export function tailoredIdeas(role: string, bottleneck: string, tools: string): Idea[] {
  const key = `${role} ${bottleneck}`;
  const hit = IDEA_BANK.find((b) => b.match.test(key));
  const base = hit ? hit.ideas : GENERIC_IDEAS;
  const t = tools.trim();
  return base.map((i) => ({
    ...i,
    pitch: bottleneck ? `${i.pitch} Targets: “${bottleneck}”.` : i.pitch,
    prompt: t ? `${i.prompt} It should work with ${t}.` : i.prompt,
  }));
}

export interface ThemeDef {
  id: string;
  name: string;
  desc: string;
  source: string;
  tokens: { accent: string; radius: number; dark: boolean; font: "sans" | "serif" | "mono"; bg: string; text: string };
  instructions?: string;
}

export const BUILTIN_THEMES: ThemeDef[] = [
  { id: "t-default", name: "Architect Calm", desc: "Neutral, clean, blue accent", source: "Built-in", tokens: { accent: "#3452F5", radius: 10, dark: false, font: "sans", bg: "#FFFFFF", text: "#15171C" } },
  { id: "t-bold", name: "Bold Pop", desc: "Rounded, playful, pink accent", source: "Built-in", tokens: { accent: "#E0457B", radius: 16, dark: false, font: "sans", bg: "#FFFFFF", text: "#15171C" } },
  { id: "t-terminal", name: "Data Terminal", desc: "Dark, dense, monospace", source: "Built-in", tokens: { accent: "#0F9D76", radius: 6, dark: true, font: "mono", bg: "#0F1115", text: "#E8EAEE" } },
  { id: "t-editorial", name: "Editorial", desc: "Serif headings, warm tones", source: "Built-in", tokens: { accent: "#B45309", radius: 4, dark: false, font: "serif", bg: "#FFFDF8", text: "#1C1917" } },
];
