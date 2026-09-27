"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderUp, Link2, Search, Lock, Globe, Check, Loader2, ArrowRight, Bot, Database, FileCode2, AlertTriangle, Code2, MessageSquare, LayoutGrid, Star } from "lucide-react";
import { Github } from "@/components/icons";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input, Segmented, cn, toast } from "@/components/ui";
import { useStore } from "@/lib/store";
import { buildPRD, checkpoint, newProject, uid } from "@/lib/generate";
import { sleep } from "@/lib/client";
import type { Depth, Spec } from "@/lib/types";

const REPOS = [
  { name: "lyzr_architect", desc: "Architect 2.0 concept build", lang: "TypeScript", updated: "today", priv: false, stars: 3 },
  { name: "support-copilot", desc: "LangChain agents for Freshdesk triage", lang: "Python", updated: "3 days ago", priv: true, stars: 0 },
  { name: "vetta", desc: "AI startup idea validator", lang: "TypeScript", updated: "last week", priv: false, stars: 12 },
  { name: "hr-chatbot", desc: "RAG chatbot over HR policies", lang: "Python", updated: "2 months ago", priv: true, stars: 1 },
  { name: "chai-finder", desc: "Find the best chai near you", lang: "JavaScript", updated: "3 months ago", priv: false, stars: 5 },
];

function Inner() {
  const router = useRouter();
  const via = useSearchParams().get("via") as "github" | "zip" | "url" | null;
  const { user, saveProject, updateUser } = useStore();
  const [src, setSrc] = useState<"github" | "zip" | "url">(via || "github");
  const [q, setQ] = useState("");
  const [url, setUrl] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [phase, setPhase] = useState<"pick" | "scan" | "review">("pick");
  const [log, setLog] = useState<{ t: string; done: boolean }[]>([]);
  const [depth, setDepth] = useState<Depth>("code");
  const [ghOk, setGhOk] = useState(false);
  const login = (user?.name || "you").toLowerCase().replace(/\s+/g, "");

  useEffect(() => {
    try {
      setGhOk(Boolean(localStorage.getItem("a2.github")));
    } catch {}
  }, []);

  const repo = picked || url.split("/").filter(Boolean).pop()?.replace(/\.git$/, "") || "my-app";
  const isPy = REPOS.find((r) => r.name === picked)?.lang === "Python";

  async function scan() {
    setPhase("scan");
    const steps = [
      src === "zip" ? "Unpacking archive (2.4 MB)" : `Cloning ${src === "github" ? `${login}/${repo}` : url}`,
      isPy ? "Detected: Python 3.11 · FastAPI · LangChain" : "Detected: Next.js 14 · TypeScript · Tailwind",
      "Found 2 agents in code (LangChain, CrewAI)",
      "Found database: Postgres via Prisma (3 models)",
      "Found 4 environment variables referenced, 0 set",
      "Mapping routes → 5 pages",
      "Writing architect/spec.yaml (nothing else is changed)",
      "Booting sandbox & dev server",
    ];
    for (const s of steps) {
      setLog((l) => [...l, { t: s, done: false }]);
      await sleep(520);
      setLog((l) => l.map((x, i) => (i === l.length - 1 ? { ...x, done: true } : x)));
    }
    setPhase("review");
  }

  function create() {
    const spec: Spec = {
      appName: repo.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s/g, ""),
      tagline: REPOS.find((r) => r.name === picked)?.desc || "Imported project",
      audience: "Existing users",
      domain: "generic",
      pages: [
        { name: "Home", route: "/", purpose: "Existing landing page" },
        { name: "Dashboard", route: "/dashboard", purpose: "Existing dashboard" },
        { name: "Settings", route: "/settings", purpose: "Existing settings" },
      ],
      agents: [
        { id: "summarizer", name: "Summarizer", role: "Summarises long inputs (found in agents/summarizer.py)", model: "gpt-5-mini", tools: [], instructions: "Summarise the input in 5 bullets.", framework: "langgraph", live: true },
        { id: "classifier", name: "Classifier", role: "Routes requests to the right queue (found in crew/classifier.py)", model: "claude-sonnet", tools: ["slack.post"], instructions: "Classify the request into billing, bug or feature.", framework: "crewai", live: true },
      ],
      data: [
        { name: "users", fields: [{ name: "id", type: "uuid" }, { name: "email", type: "text" }] },
        { name: "requests", fields: [{ name: "id", type: "uuid" }, { name: "body", type: "text" }, { name: "category", type: "text" }] },
      ],
      integrations: ["Slack"],
      auth: true,
    };
    const p = newProject({ prompt: `Imported from ${src === "github" ? `github.com/${login}/${repo}` : src === "zip" ? "ZIP upload" : url}`, spec, prd: buildPRD("Imported project — PRD reverse-engineered from the code", spec), answers: {}, stage: "wired", source: { type: src === "zip" ? "zip" : "github", ref: repo } });
    p.github = src === "zip" ? undefined : { repo: `${login}/${repo}`, branch: "main", autoCommit: true, org: login };
    p.checkpoints = [checkpoint("Imported project", "Added architect/spec.yaml · no code changed", ["architect/spec.yaml"])];
    p.chat = [
      { id: uid(), role: "assistant", text: `I imported **${repo}** without changing your code — I only added \`architect/spec.yaml\` so Blueprint and Agents can read the project.\n\n**Found:** 2 agents (LangGraph, CrewAI), Postgres via Prisma, 5 routes.\n**Needs attention:** 4 environment variables aren't set yet — add them in **Apps → Secrets** before deploying.`, at: Date.now() },
    ];
    saveProject(p);
    updateUser({ depthPref: depth });
    toast("Project imported");
    router.push(`/project/${p.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-[26px] font-semibold tracking-tight">Import a project</h1>
      <p className="mt-1 text-[14px] text-ink-3">Bring an existing codebase. Architect reads it, adds one spec file, and you keep working — in chat, Blueprint or Code.</p>

      {phase === "pick" && (
        <div className="mt-7 animate-in">
          <Segmented value={src} onChange={setSrc} options={[{ value: "github", label: <><Github className="h-3.5 w-3.5" /> GitHub</> }, { value: "zip", label: <><FolderUp className="h-3.5 w-3.5" /> ZIP</> }, { value: "url", label: <><Link2 className="h-3.5 w-3.5" /> Git URL</> }]} />
          {src === "github" &&
            (ghOk ? (
              <Card className="mt-4 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-line p-3">
                  <select className="h-9 rounded-lg border border-line bg-white px-2 text-[13px]"><option>{login}</option><option>acme-labs</option></select>
                  <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-4" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search repositories" className="pl-8" /></div>
                </div>
                <div className="divide-y divide-line">
                  {REPOS.filter((r) => r.name.includes(q.toLowerCase())).map((r) => (
                    <button key={r.name} onClick={() => setPicked(r.name)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left", picked === r.name ? "bg-bp-soft/50" : "hover:bg-paper")}>
                      <div className={cn("grid h-4 w-4 place-items-center rounded-full border", picked === r.name ? "border-bp bg-bp" : "border-line-2")}>{picked === r.name && <Check className="h-2.5 w-2.5 text-white" />}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[13.5px] font-medium">{r.name} {r.priv ? <Lock className="h-3 w-3 text-ink-4" /> : <Globe className="h-3 w-3 text-ink-4" />}</div>
                        <div className="truncate text-[12px] text-ink-3">{r.desc}</div>
                      </div>
                      <div className="flex items-center gap-3 text-[11.5px] text-ink-4"><span>{r.lang}</span><span className="flex items-center gap-0.5"><Star className="h-3 w-3" />{r.stars}</span><span>{r.updated}</span></div>
                    </button>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="mt-4 p-6 text-center">
                <Github className="mx-auto h-6 w-6" />
                <div className="mt-3 text-[14px] font-medium">Connect GitHub to see your repositories</div>
                <p className="mt-1 text-[12.5px] text-ink-3">Read access to the repos you pick. You can change this on GitHub any time.</p>
                <Button variant="dark" className="mt-4" icon={<Github className="h-4 w-4" />} onClick={async () => { await sleep(700); try { localStorage.setItem("a2.github", JSON.stringify({ login })); } catch {} setGhOk(true); toast("GitHub connected (simulated OAuth)", "info"); }}>Connect GitHub</Button>
              </Card>
            ))}
          {src === "zip" && (
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line-2 bg-white p-10 text-center hover:border-bp/50">
              <FolderUp className="h-7 w-7 text-ink-3" />
              <div className="mt-3 text-[14px] font-medium">{picked ? `${picked}.zip ready` : "Drop a .zip here, or click to browse"}</div>
              <div className="mt-1 text-[12.5px] text-ink-3">Up to 200 MB · node_modules and .git are ignored</div>
              <input type="file" accept=".zip" className="hidden" onChange={(e) => e.target.files?.[0] && setPicked(e.target.files[0].name.replace(/\.zip$/, ""))} />
            </label>
          )}
          {src === "url" && (
            <div className="mt-4 space-y-2">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/org/repo" className="!h-11" />
              <div className="text-[12px] text-ink-4">Public repos only. For private repos, connect GitHub.</div>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button variant="primary" size="lg" disabled={src === "url" ? !url.includes("/") : !picked} onClick={scan}>Analyse project <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {phase !== "pick" && (
        <Card className="mt-7 p-5 animate-in">
          <div className="flex items-center gap-2 text-[13px] font-medium"><FileCode2 className="h-4 w-4 text-bp" /> Analysing {repo}</div>
          <div className="mt-3 space-y-1.5 font-mono text-[12.5px]">
            {log.map((l, i) => (
              <div key={i} className="flex items-center gap-2">{l.done ? <Check className="h-3.5 w-3.5 text-ok" /> : <Loader2 className="h-3.5 w-3.5 animate-spin text-bp" />} <span className={l.done ? "text-ink-2" : "text-ink"}>{l.t}</span></div>
            ))}
          </div>
        </Card>
      )}

      {phase === "review" && (
        <div className="mt-5 space-y-5 animate-in">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Bot, t: "2 agents found", b: "LangGraph & CrewAI — kept in their frameworks. Test & trace them in Architect." },
              { icon: Database, t: "Postgres (Prisma)", b: "3 models mapped to tables. Your DB stays yours." },
              { icon: AlertTriangle, t: "4 secrets missing", b: "OPENAI_API_KEY, DATABASE_URL, SLACK_TOKEN, NEXTAUTH_SECRET", warn: true },
            ].map((c) => (
              <Card key={c.t} className="p-4">
                <c.icon className={cn("h-4 w-4", c.warn ? "text-warn" : "text-bp")} />
                <div className="mt-3 text-[13.5px] font-semibold">{c.t}</div>
                <div className="mt-1 text-[12px] text-ink-3">{c.b}</div>
              </Card>
            ))}
          </div>
          <Card className="p-4">
            <div className="text-[13.5px] font-semibold">How do you want to open it?</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["code", Code2, "Code", "Recommended for imports"],
                  ["blueprint", LayoutGrid, "Blueprint", "See the structure first"],
                  ["outcome", MessageSquare, "Outcome", "Just chat & preview"],
                ] as const
              ).map(([d, Icon, t, b]) => (
                <button key={d} onClick={() => setDepth(d)} className={cn("rounded-xl border p-3 text-left", depth === d ? "border-bp bg-bp-soft/40" : "border-line")}>
                  <Icon className="h-4 w-4 text-ink-2" />
                  <div className="mt-2 text-[13px] font-medium">{t}</div>
                  <div className="text-[11.5px] text-ink-4">{b}</div>
                </button>
              ))}
            </div>
          </Card>
          <div className="flex items-center justify-between">
            <Badge tone="ok"><Check className="h-3 w-3" /> No code was modified</Badge>
            <Button variant="primary" size="lg" onClick={create}>Open project <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ImportPage() {
  return (
    <AppShell>
      <Suspense>
        <Inner />
      </Suspense>
    </AppShell>
  );
}
