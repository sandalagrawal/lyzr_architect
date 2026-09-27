import { buildPRD, buildSpec, checkpoint, newProject, presetFor, uid } from "./generate";
import type { Project } from "./types";

export function sampleProject(key = "education", userLogin = "you"): Project {
  const preset = presetFor(key);
  const answers = {
    audience: preset.audiences[0],
    caps: preset.capabilities.slice(0, 3).map((c) => c.label),
    integrations: preset.integrations.slice(0, 2),
    auth: "My team only (sign-in + roles)",
    feel: "Calm & minimal",
  };
  const prompt =
    key === "education"
      ? "Build an app where CA students upload mock answer sheets and get marks plus mentor-style feedback on each answer."
      : "Build a lead research app for our SDR team: research a company, score it against our ICP and draft a personalised cold email.";
  const spec = buildSpec(prompt, preset, answers);
  const p = newProject({ prompt, spec, prd: buildPRD(prompt, spec), answers, stage: "wired", source: { type: "template", ref: key } });
  const H = 3600_000;
  const now = Date.now();
  const cps = [
    checkpoint("PRD & specs approved", "Blueprint locked: 3 agents, 5 pages, 3 tables", ["architect/prd.md", "architect/spec.yaml"]),
    checkpoint("UI preview built", "Generated 5 pages and 6 components with mocked agent responses", ["app/page.tsx", "components/RunBox.tsx", "mocks/agents.ts"]),
    checkpoint("Headline and colours tweaked", "Edited 2 elements from the preview", ["app/page.tsx"], "you"),
    checkpoint("Agents & backend wired", `Created ${spec.agents.length} Lyzr agents, database schema with RLS, API route and tests`, ["agents/", "db/schema.sql", "app/api/run/route.ts", "lib/agents.ts"]),
  ];
  cps.forEach((c, i) => (c.at = now - (cps.length - i) * 2.2 * H));
  p.checkpoints = cps;
  p.github = { repo: `${userLogin}/${spec.appName.toLowerCase()}`, branch: "main", autoCommit: true, org: userLogin };
  p.chat = [
    { id: uid(), role: "user", text: prompt, at: now - 9 * H },
    { id: uid(), role: "assistant", text: `Plan approved. I built the UI with mocked agents so you can click through it first.`, steps: [{ label: "Generated 5 pages", kind: "write" }, { label: "Created mocks/agents.ts", file: "mocks/agents.ts", kind: "write" }], checkpoint: cps[1].id, at: now - 6.6 * H },
    { id: uid(), role: "assistant", text: `Wired it up: ${spec.agents.map((a) => a.name).join(", ")} are live on Lyzr, the database has row-level security, and the mocks are gone.`, steps: [{ label: "Created 3 agents", kind: "write" }, { label: "Ran 4 tests · all passing", kind: "run" }], checkpoint: cps[3].id, at: now - 2.2 * H },
  ];
  p.createdAt = now - 9 * H;
  p.updatedAt = now - 2.2 * H;
  p.integrations = spec.integrations;
  return p;
}
