import type { Artifact, Project } from "./types";
import { uid } from "./generate";

export function detectArtifact(text: string): Artifact["kind"] | null {
  const t = text.toLowerCase();
  if (!/(create|make|generate|write|draft|prepare|give me)/.test(t)) return null;
  if (/deck|slides|presentation|pitch/.test(t)) return "deck";
  if (/spec|specification|technical doc|architecture doc/.test(t)) return "spec";
  if (/research|competit|market|analysis/.test(t)) return "research";
  if (/guide|manual|how[- ]to|onboarding doc|readme|doc\b/.test(t)) return "guide";
  return null;
}

export function makeArtifact(kind: Artifact["kind"], p: Project): Artifact {
  const s = p.spec;
  const agents = s.agents.map((a) => `- **${a.name}** (${a.framework}, ${a.model}) — ${a.role}. Tools: ${a.tools.join(", ") || "none"}.`).join("\n");
  const pages = s.pages.map((pg) => `- **${pg.name}** \`${pg.route}\` — ${pg.purpose}`).join("\n");
  const data = s.data.map((t) => `- \`${t.name}\`: ${t.fields.map((f) => `${f.name} (${f.type})`).join(", ")}`).join("\n");
  const base = { id: uid("art_"), at: Date.now() };
  if (kind === "spec")
    return {
      ...base,
      kind,
      title: `${s.appName} — Feature specification`,
      body: `# ${s.appName} — Feature specification\n\n**Status:** ${p.stage === "ui" ? "UI preview (agents mocked)" : "Agents live"} · **Audience:** ${s.audience}\n\n## Overview\n${s.tagline}. Users give an input, a pipeline of ${s.agents.length} agents does the work, and a human approves the result.\n\n## Architecture\n- **Frontend:** Next.js 14 + Tailwind, ${s.pages.length} routes\n- **Agents:** ${s.agents.map((a) => a.name).join(" → ")} (orchestrated in \`lib/agents.ts\`)\n- **Backend:** \`POST /api/run\` with zod validation${s.auth ? ", auth required" : ""}\n- **Data:** Postgres with row-level security\n- **Integrations:** ${s.integrations.join(", ") || "none"}\n\n## Agents\n${agents}\n\n## Pages\n${pages}\n\n## Data model\n${data}\n\n## Non-functional\n- p95 end-to-end under 8s\n- PII redacted from logs; prompt-injection guard on tool-using agents\n- Every change is a Git commit; deploys are gated by tests, evals and a security scan\n`,
    };
  if (kind === "deck")
    return {
      ...base,
      kind,
      title: `${s.appName} — Pitch deck`,
      body: [
        `# ${s.appName}\n${s.tagline}`,
        `## The problem\n- ${s.audience} lose hours every week to repetitive, judgement-heavy work\n- Today it lives in spreadsheets, tabs and copy-paste\n- Quality varies person to person`,
        `## The solution\n- ${s.agents.map((a) => a.name).join(" → ")}\n- Humans approve, agents do the legwork\n- Works with ${s.integrations.join(", ") || "your existing tools"}`,
        `## How it works\n${s.agents.map((a, i) => `${i + 1}. **${a.name}** — ${a.role}`).join("\n")}`,
        `## Why now\n- Agents are finally reliable enough with evals & guardrails\n- Built and shipped in days on Architect`,
        `## Ask\n- Pilot with 10 users this month\n- Success = 80% of outputs approved without edits`,
      ].join("\n---\n"),
    };
  if (kind === "research")
    return {
      ...base,
      kind,
      title: `${s.appName} — Market & competitor research`,
      body: `# ${s.appName} — Market & competitor research\n\n## Summary\nThe category is growing fast, but most tools automate *tasks* rather than whole *workflows*. ${s.appName}'s edge is an end-to-end agent pipeline with human approval built in.\n\n## Alternatives users rely on today\n- **Spreadsheets + manual work** — flexible, but slow and inconsistent\n- **Point AI tools** — good at one step, no workflow or memory\n- **Agencies / freelancers** — high quality, expensive, slow turnaround\n\n## Differentiation\n- Multi-agent pipeline (${s.agents.length} specialised agents)\n- Grounded in your own knowledge base\n- Audit trail of every decision\n\n## Risks\n- Output quality on edge cases → mitigated with evals\n- Trust → human-in-the-loop approval by default\n\n_Sources would be cited here when generated with live web research._\n`,
    };
  return {
    ...base,
    kind: "guide",
    title: `${s.appName} — User guide`,
    body: `# ${s.appName} — User guide\n\n## Getting started\n1. Sign in${s.auth ? " with Google or email" : ""}\n2. Open **${s.pages[0]?.name}**\n3. Enter your input and press the main button\n\n## What happens next\n${s.agents.map((a, i) => `${i + 1}. **${a.name}** ${a.role.charAt(0).toLowerCase() + a.role.slice(1)}`).join("\n")}\n\n## Pages\n${pages}\n\n## FAQ\n- **Can I edit a result?** Yes — every output can be edited before approval.\n- **Is my data private?** Yes — access is restricted per user with row-level security.\n`,
  };
}

export function artifactToHtml(a: Artifact): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const md = (s: string) =>
    esc(s)
      .replace(/^# (.*)$/gm, "<h1>$1</h1>")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/^(?:- |\d+\. )(.*)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
      .replace(/^(?!<)(.+)$/gm, "<p>$1</p>");
  const style = `body{font-family:system-ui,sans-serif;margin:0;background:#f4f4f1;color:#15171c}code{background:#eee;padding:1px 4px;border-radius:4px}`;
  if (a.kind === "deck") {
    const slides = a.body.split("\n---\n").map((sl) => `<section>${md(sl)}</section>`).join("");
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(a.title)}</title><style>${style}section{width:960px;height:540px;margin:24px auto;background:#fff;border-radius:16px;padding:56px;box-sizing:border-box;box-shadow:0 2px 10px rgba(0,0,0,.08);page-break-after:always}h1{font-size:48px;margin:120px 0 12px}h2{font-size:34px}li{font-size:22px;margin:10px 0}p{font-size:22px;color:#555}</style></head><body>${slides}</body></html>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(a.title)}</title><style>${style}main{max-width:760px;margin:40px auto;background:#fff;padding:48px;border-radius:16px;line-height:1.6}</style></head><body><main>${md(a.body)}</main></body></html>`;
}

export function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href = url;
  el.download = filename;
  el.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
