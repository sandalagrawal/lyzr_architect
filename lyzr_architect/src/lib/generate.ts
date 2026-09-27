import type { AgentSpec, Checkpoint, Project, Spec, Stage } from "./types";
import { GENERIC, PRESETS, pickPreset, type Preset } from "./presets";

export const uid = (p = "") => p + Math.random().toString(36).slice(2, 9);
export const sha = () => Math.random().toString(16).slice(2, 9);
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function presetFor(key: string): Preset {
  return PRESETS.find((p) => p.key === key) || GENERIC;
}

export function extractName(prompt: string): string | null {
  const m = prompt.match(/(?:called|named)\s+["“']?([A-Z][\w\- ]{1,24}?)["”']?(?:[\s,.]|$)/i);
  return m ? m[1].trim() : null;
}

export interface Question {
  id: string;
  q: string;
  why: string;
  multi?: boolean;
  options: string[];
}

export function discoveryQuestions(prompt: string): { preset: Preset; questions: Question[] } {
  const preset = pickPreset(prompt);
  return {
    preset,
    questions: [
      { id: "audience", q: "Who will use this day to day?", why: "Shapes the language, layout and how much detail we show.", options: preset.audiences },
      { id: "caps", q: "Which jobs should the agents handle?", why: "Each job becomes an agent you can test on its own.", multi: true, options: preset.capabilities.map((c) => c.label) },
      { id: "integrations", q: "Which tools should it connect to?", why: "We'll set up the connections and ask for access only when needed.", multi: true, options: preset.integrations },
      { id: "auth", q: "Who can access it?", why: "Decides whether we add sign-in and user roles.", options: ["My team only (sign-in + roles)", "Anyone can sign up", "Open tool, no sign-in"] },
      { id: "feel", q: "How should it feel?", why: "Sets the starting theme — you can change everything later.", options: ["Calm & minimal", "Bold & colourful", "Dense & data-heavy"] },
    ],
  };
}

export function buildSpec(prompt: string, preset: Preset, answers: Record<string, string | string[]>, defaultModel = "auto"): Spec {
  const caps = (answers.caps as string[]) || preset.capabilities.slice(0, 3).map((c) => c.label);
  const chosen = preset.capabilities.filter((c) => caps.includes(c.label));
  const agents: AgentSpec[] = (chosen.length ? chosen : preset.capabilities.slice(0, 2)).map((c) => ({
    ...c.agent,
    id: slug(c.agent.name),
    model: defaultModel,
    framework: "lyzr",
    live: false,
  }));
  const auth = !String(answers.auth || "").startsWith("Open");
  const pages = [...preset.pages];
  if (auth && !pages.find((p) => p.route === "/login")) pages.push({ name: "Sign in", route: "/login", purpose: "Email & Google sign-in" });
  return {
    appName: extractName(prompt) || preset.name,
    tagline: preset.tagline,
    audience: (answers.audience as string) || preset.audiences[0],
    domain: preset.key,
    pages,
    agents,
    data: auth ? [...preset.data, { name: "users", fields: [{ name: "id", type: "uuid" }, { name: "email", type: "text" }, { name: "role", type: "text" }] }] : preset.data,
    integrations: (answers.integrations as string[]) || preset.integrations.slice(0, 2),
    auth,
  };
}

export function buildPRD(prompt: string, spec: Spec): string {
  return `# ${spec.appName} — Product Requirements

**One-liner:** ${spec.tagline}.
**Original request:** “${prompt.trim()}”

## Problem
${spec.audience} spend hours on work that is repetitive but needs judgement. Today it lives in spreadsheets, tabs and copy-paste. ${spec.appName} hands the repetitive part to agents and keeps humans in charge of the decisions.

## Users
- **Primary:** ${spec.audience}
- **Access:** ${spec.auth ? "Signed-in users with roles (Owner, Member)" : "Open tool, no sign-in"}

## Core user journey
1. User gives an input on the ${spec.pages[0].name} page.
2. ${spec.agents.map((a) => `**${a.name}** ${(/^[A-Z][a-z]/.test(a.role) ? a.role.charAt(0).toLowerCase() + a.role.slice(1) : a.role)}`).join(" → ")}.
3. User reviews the result, edits if needed, and approves.
4. Results are saved and synced to ${spec.integrations.join(", ") || "the database"}.

## Agents
${spec.agents.map((a) => `- **${a.name}** — ${a.role}. Tools: ${a.tools.length ? a.tools.map((t) => "`" + t + "`").join(", ") : "none"}.`).join("\n")}

## Pages
${spec.pages.map((p) => `- **${p.name}** \`${p.route}\` — ${p.purpose}`).join("\n")}

## Data
${spec.data.map((t) => `- \`${t.name}\` (${t.fields.map((f) => f.name).join(", ")})`).join("\n")}

## Success metrics
- Time from input to approved result under 5 minutes
- 80%+ of agent outputs approved without edits by week 4
- Weekly active usage by 70% of invited users

## Out of scope (v1)
- Native mobile apps
- Multi-language UI
`;
}

/* ---------------- code files ---------------- */

function agentYaml(a: AgentSpec) {
  return `# ${a.name}
id: ${a.id}
framework: ${a.framework || "lyzr"}
model: ${a.model}
role: "${a.role}"
tools:
${a.tools.length ? a.tools.map((t) => `  - ${t}`).join("\n") : "  []"}
knowledge:
${a.knowledge?.length ? a.knowledge.map((k) => `  - ${k}`).join("\n") : "  []"}
guardrails:
  pii_redaction: true
  prompt_injection: block
  max_tool_calls: 8
memory: session
`;
}

export function generateFiles(p: Project): Record<string, string> {
  const s = p.spec;
  const f: Record<string, string> = {};
  const wired = p.stage === "wired" || p.stage === "deployed";
  f["README.md"] = `# ${s.appName}\n\n${s.tagline}.\n\nBuilt with Architect 2.0.\n\n## Run locally\n\n\`\`\`bash\nnpm install\ncp .env.example .env.local\nnpm run dev\n\`\`\`\n`;
  f["package.json"] = JSON.stringify(
    {
      name: slug(s.appName),
      private: true,
      scripts: { dev: "next dev", build: "next build", start: "next start", test: "vitest" },
      dependencies: { next: "14.2.35", react: "18.3.1", "@architect/sdk": "^2.0.0", ...(wired ? { "@supabase/supabase-js": "^2.45.0", zod: "^3.23.8" } : {}) },
    },
    null,
    2
  );
  f["architect/prd.md"] = p.prd;
  f["architect/spec.yaml"] = `app: ${s.appName}\naudience: "${s.audience}"\nauth: ${s.auth}\npages:\n${s.pages.map((x) => `  - { name: "${x.name}", route: "${x.route}" }`).join("\n")}\nagents:\n${s.agents.map((a) => `  - ./agents/${a.id}`).join("\n")}\nintegrations: [${s.integrations.join(", ")}]\ntheme:\n  accent: "${p.theme.accent}"\n  radius: ${p.theme.radius}\n  mode: ${p.theme.dark ? "dark" : "light"}\n`;
  f["app/layout.tsx"] = `import "./globals.css";\nimport { Sidebar } from "@/components/Sidebar";\n\nexport const metadata = { title: "${s.appName}" };\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body className="flex min-h-screen">\n        <Sidebar />\n        <main className="flex-1 p-8">{children}</main>\n      </body>\n    </html>\n  );\n}\n`;
  f["app/page.tsx"] = `import { RunBox } from "@/components/RunBox";\nimport { StatRow } from "@/components/StatRow";\nimport { ResultList } from "@/components/ResultList";\n${wired ? 'import { db } from "@/lib/db";\n' : 'import { mockResults } from "@/mocks/results";\n'}\nexport default async function Page() {\n  const results = ${wired ? 'await db.from("' + (s.data[0]?.name || "runs") + '").select("*").limit(20)' : "mockResults"};\n  return (\n    <div className="space-y-6">\n      <h1 className="text-2xl font-semibold">${p.content["hero.title"] || s.appName}</h1>\n      <RunBox />\n      <StatRow />\n      <ResultList items={results} />\n    </div>\n  );\n}\n`;
  s.pages.slice(1).forEach((pg) => {
    const r = pg.route.replace(/^\//, "");
    if (!r) return;
    f[`app/${r}/page.tsx`] = `// ${pg.purpose}\nexport default function ${pg.name.replace(/[^A-Za-z]/g, "") || "Page"}() {\n  return <div className="text-xl font-semibold">${pg.name}</div>;\n}\n`;
  });
  f["components/RunBox.tsx"] = `"use client";\nimport { useState } from "react";\n${wired ? 'import { runPipeline } from "@/lib/agents";\n' : 'import { mockRun } from "@/mocks/agents";\n'}\nexport function RunBox() {\n  const [value, setValue] = useState("");\n  const [busy, setBusy] = useState(false);\n  async function go() {\n    setBusy(true);\n    await ${wired ? "runPipeline" : "mockRun"}(value);\n    setBusy(false);\n  }\n  return (\n    <div className="rounded-xl border p-4">\n      <label className="text-sm font-medium">${s.domain ? "" : ""}${p.content["run.label"] || "Input"}</label>\n      <input value={value} onChange={(e) => setValue(e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2" />\n      <button onClick={go} disabled={busy} className="mt-3 rounded-lg bg-[${p.theme.accent}] px-4 py-2 text-white">\n        {busy ? "Working…" : "${p.content["run.cta"] || "Run"}"}\n      </button>\n    </div>\n  );\n}\n`;
  f["components/Sidebar.tsx"] = `import Link from "next/link";\n\nconst nav = ${JSON.stringify(s.pages.filter((x) => x.route !== "/login").map((x) => ({ href: x.route, label: x.name })))};\n\nexport function Sidebar() {\n  return (\n    <aside className="w-56 border-r p-4">\n      <div className="font-semibold">${s.appName}</div>\n      <nav className="mt-6 space-y-1">\n        {nav.map((n) => (\n          <Link key={n.href} href={n.href} className="block rounded px-2 py-1.5 hover:bg-gray-100">{n.label}</Link>\n        ))}\n      </nav>\n    </aside>\n  );\n}\n`;
  f["components/StatRow.tsx"] = `export function StatRow() {\n  return <div className="grid grid-cols-4 gap-3">{/* stats */}</div>;\n}\n`;
  f["components/ResultList.tsx"] = `export function ResultList({ items }: { items: any[] }) {\n  return <ul className="divide-y rounded-xl border">{items.map((i) => <li key={i.id} className="p-4">{i.title}</li>)}</ul>;\n}\n`;
  f["app/globals.css"] = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --accent: ${p.theme.accent};\n  --radius: ${p.theme.radius}px;\n}\n`;
  if (!wired) {
    f["mocks/agents.ts"] = `// Mocked agent responses — replaced with live agents in the "Wire it up" step.\nexport async function mockRun(input: string) {\n  await new Promise((r) => setTimeout(r, 900));\n  return { ok: true, input, steps: ${JSON.stringify(s.agents.map((a) => a.name))} };\n}\n`;
    f["mocks/results.ts"] = `export const mockResults = ${JSON.stringify(presetFor(s.domain).sample.results.map((r, i) => ({ id: i + 1, title: r.title })), null, 2)};\n`;
  } else {
    f["lib/agents.ts"] = `import { agents } from "@architect/sdk";\n\n// Agents are loaded from ./agents/*/agent.yaml and run on Lyzr by default.\n// Swap the framework per agent in agent.yaml — the call site stays the same.\n${s.agents.map((a) => `const ${camel(a.id)} = agents.use("${a.id}");`).join("\n")}\n\nexport async function runPipeline(input: string) {\n${s.agents.map((a, i) => `  const r${i} = await ${camel(a.id)}.run(${i === 0 ? "input" : `r${i - 1}.output`});`).join("\n")}\n  return r${s.agents.length - 1};\n}\n`;
    f["lib/db.ts"] = `import { createClient } from "@supabase/supabase-js";\n\nexport const db = createClient(process.env.DATABASE_URL!, process.env.DATABASE_KEY!);\n`;
    f["db/schema.sql"] = s.data.map((t) => `create table ${t.name} (\n${t.fields.map((fl) => `  ${fl.name} ${fl.type}${fl.name === "id" ? " primary key default gen_random_uuid()" : ""}`).join(",\n")}\n);\n\nalter table ${t.name} enable row level security;`).join("\n\n") + "\n";
    f["app/api/run/route.ts"] = `import { NextResponse } from "next/server";\nimport { z } from "zod";\nimport { runPipeline } from "@/lib/agents";\n${s.auth ? 'import { requireUser } from "@/lib/auth";\n' : ""}\nconst Body = z.object({ input: z.string().min(1).max(4000) });\n\nexport async function POST(req: Request) {\n${s.auth ? "  await requireUser(req);\n" : ""}  const { input } = Body.parse(await req.json());\n  const result = await runPipeline(input);\n  return NextResponse.json(result);\n}\n`;
    if (s.auth) f["lib/auth.ts"] = `import { db } from "./db";\n\nexport async function requireUser(req: Request) {\n  const token = req.headers.get("authorization")?.replace("Bearer ", "");\n  const { data, error } = await db.auth.getUser(token);\n  if (error || !data.user) throw new Response("Unauthorized", { status: 401 });\n  return data.user;\n}\n`;
    s.agents.forEach((a) => {
      f[`agents/${a.id}/agent.yaml`] = agentYaml(a);
      f[`agents/${a.id}/instructions.md`] = `# ${a.name}\n\n${a.instructions}\n\n## Output format\nReturn JSON: { "output": string, "confidence": number }\n`;
    });
    f["tests/pipeline.test.ts"] = `import { describe, it, expect } from "vitest";\nimport { runPipeline } from "@/lib/agents";\n\ndescribe("pipeline", () => {\n  it("returns an output for a simple input", async () => {\n    const r = await runPipeline("hello");\n    expect(r.output).toBeTruthy();\n  });\n});\n`;
  }
  f[".env.example"] = `ARCHITECT_API_KEY=\n${wired ? "DATABASE_URL=\nDATABASE_KEY=\n" : ""}${s.integrations.map((i) => `${i.toUpperCase().replace(/[^A-Z]/g, "_")}_TOKEN=`).join("\n")}\n`;
  // user edits override generated content
  return { ...f, ...p.files };
}

function camel(s: string) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function checkpoint(label: string, summary: string, files: string[], author: Checkpoint["author"] = "architect", branch = "main"): Checkpoint {
  return { id: uid("cp_"), sha: sha(), label, summary, files, at: Date.now(), author, branch };
}

export const FEEL_THEME: Record<string, Project["theme"]> = {
  "Calm & minimal": { accent: "#3452F5", radius: 10, dark: false, font: "sans" },
  "Bold & colourful": { accent: "#E0457B", radius: 16, dark: false, font: "sans" },
  "Dense & data-heavy": { accent: "#0F9D76", radius: 6, dark: true, font: "mono" },
};

export function newProject(opts: {
  prompt: string;
  spec: Spec;
  prd: string;
  answers: Record<string, string | string[]>;
  stage?: Stage;
  source?: Project["source"];
}): Project {
  const theme = FEEL_THEME[(opts.answers.feel as string) || ""] || FEEL_THEME["Calm & minimal"];
  const now = Date.now();
  return {
    id: uid("p_"),
    name: opts.spec.appName,
    prompt: opts.prompt,
    createdAt: now,
    updatedAt: now,
    stage: opts.stage || "ui",
    spec: opts.spec,
    prd: opts.prd,
    answers: opts.answers,
    checkpoints: [],
    deployments: [],
    chat: [],
    theme,
    content: {},
    files: {},
    env: {},
    source: opts.source || { type: "prompt" },
    integrations: [],
  };
}

export function timeAgo(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
