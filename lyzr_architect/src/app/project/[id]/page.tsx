"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, Database, Plug, Shield, Rocket, Settings, History, Share2, MessageSquare, LayoutGrid, Code2, Monitor, Sparkles, PanelRightOpen, Columns2, Circle, Coins, FileText } from "lucide-react";
import { Github } from "@/components/icons";
import { LogoMark } from "@/components/Logo";
import { Badge, Button, Segmented, cn, toast } from "@/components/ui";
import { useStore } from "@/lib/store";
import { checkpoint, uid } from "@/lib/generate";
import { runAgent, sleep } from "@/lib/client";
import type { AgentSpec, Artifact, Depth, Msg, Project, Spec, Step } from "@/lib/types";
import { Chat, type ChatMode } from "@/components/workspace/Chat";
import { Preview } from "@/components/workspace/Preview";
import { Blueprint } from "@/components/workspace/Blueprint";
import { IDE } from "@/components/workspace/IDE";
import { AgentsPanel } from "@/components/workspace/AgentsPanel";
import { DataPanel, DeploymentsPanel, IntegrationsPanel, ProjectSettings, SecurityPanel } from "@/components/workspace/Panels";
import { DeployModal, GitHubModal, HistoryDrawer, ShareModal } from "@/components/workspace/Modals";
import { ArtifactsPanel } from "@/components/workspace/ArtifactsPanel";
import { HelpWidget } from "@/components/HelpWidget";
import { detectArtifact, makeArtifact } from "@/lib/artifacts";
import type { ThemeDef } from "@/lib/catalog";
import type { EditTarget } from "@/components/workspace/GeneratedApp";

type Rail = "app" | "agents" | "artifacts" | "data" | "integrations" | "security" | "deploys" | "settings";

const COLORS: Record<string, string> = { blue: "#3452F5", pink: "#E0457B", green: "#0F9D76", orange: "#F59E0B", purple: "#7C3AED", red: "#D93A40", black: "#0E1116", teal: "#0D9488", indigo: "#4F46E5" };

function Workspace() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const params = useSearchParams();
  const { ready, user, projects, updateProject, deleteProject, settings, spendCredits } = useStore();
  const project = projects.find((p) => p.id === id);

  const [depth, setDepthState] = useState<Depth>("outcome");
  const [rail, setRail] = useState<Rail>("app");
  const [chatOpen, setChatOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState<Msg | null>(null);
  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [openReq, setOpenReq] = useState<{ path: string; n: number } | null>(null);
  const [dirty, setDirty] = useState<string[]>([]);
  const [ctx, setCtx] = useState<EditTarget | null>(null);
  const [agentFocus, setAgentFocus] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "github" | "deploy" | "share" | "history">(null);
  const [codeSplit, setCodeSplit] = useState(false);
  const [lastPlan, setLastPlan] = useState<string | null>(null);
  const cancel = useRef(false);
  const started = useRef(false);
  const login = (user?.name || "you").toLowerCase().replace(/\s+/g, "");

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (user?.depthPref) setDepthState(user.depthPref);
  }, [user?.depthPref]);

  const setDepth = useCallback((d: Depth) => {
    setDepthState(d);
    setRail((r) => (r === "app" ? r : r));
  }, []);

  // keyboard: ⌘1/2/3 for depth
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "1") { e.preventDefault(); setDepth("outcome"); setRail("app"); }
      if (e.key === "2") { e.preventDefault(); setDepth("blueprint"); setRail("app"); }
      if (e.key === "3") { e.preventDefault(); setDepth("code"); setRail("app"); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [setDepth]);

  const snap = (p: Project) => ({ theme: p.theme, content: p.content, stage: p.stage, spec: p.spec, files: p.files });

  /** Stream a scripted build into the chat, then commit the result. */
  const runScript = useCallback(
    async (opts: { user?: string; steps: (Step & { progress?: number })[]; final: string; label: string; summary: string; files: string[]; mutate?: (p: Project) => Project; speed?: number; credits?: number; noCheckpoint?: boolean }) => {
      if (!project) return;
      cancel.current = false;
      setBusy(true);
      if (opts.user) {
        const um: Msg = { id: uid(), role: "user", text: opts.user, at: Date.now() };
        updateProject(project.id, (p) => ({ ...p, chat: [...p.chat, um] }));
      }
      const m: Msg = { id: uid(), role: "assistant", text: "", steps: [], at: Date.now() };
      setStreaming({ ...m });
      for (const s of opts.steps) {
        if (cancel.current) break;
        m.steps = [...(m.steps || []), { label: s.label, file: s.file, kind: s.kind }];
        setStreaming({ ...m });
        if (s.progress !== undefined) setProgress(s.progress);
        await sleep((opts.speed || 520) + Math.random() * 250);
      }
      if (cancel.current) {
        m.text = "Stopped. Nothing was changed — your last checkpoint is intact.";
        updateProject(project.id, (p) => ({ ...p, chat: [...p.chat, { ...m }] }));
        setStreaming(null);
        setBusy(false);
        setBuilding(false);
        return;
      }
      updateProject(project.id, (p) => {
        const np = opts.mutate ? opts.mutate(p) : p;
        if (opts.noCheckpoint) return { ...np, chat: [...np.chat, { ...m, text: opts.final }] };
        const cp = { ...checkpoint(opts.label, opts.summary, opts.files, "architect", np.branch || "main"), snap: snap(np) };
        return { ...np, checkpoints: [...np.checkpoints, cp], chat: [...np.chat, { ...m, text: opts.final, checkpoint: cp.id }] };
      });
      if (opts.credits) spendCredits(opts.credits);
      setStreaming(null);
      setBusy(false);
      setBuilding(false);
      setProgress(1);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project?.id, updateProject, spendCredits]
  );

  const buildUI = useCallback(() => {
    if (!project) return;
    setBuilding(true);
    setProgress(0);
    setRail("app");
    if (depth === "code") setCodeSplit(true);
    else setDepth("outcome");
    const s = project.spec;
    const steps: (Step & { progress?: number })[] = [
      { label: "Reading PRD & specs", file: "architect/prd.md", kind: "read", progress: 0.05 },
      { label: "Starting sandbox · Next.js 14 + Tailwind", kind: "run", progress: 0.1 },
      { label: project.github ? `Initialising repo → ${project.github.repo}` : "Initialising Git repo (hosted)", kind: "run", progress: 0.12 },
      { label: "Creating layout & navigation", file: "components/Sidebar.tsx", kind: "write", progress: 0.2 },
      ...s.pages.map((pg, i) => ({ label: `Building ${pg.name} page`, file: pg.route === "/" ? "app/page.tsx" : pg.route === "/login" ? undefined : `app/${pg.route.replace(/^\//, "")}/page.tsx`, kind: "write" as const, progress: 0.3 + (i / s.pages.length) * 0.5 })),
      { label: `Mocking ${s.agents.length} agent responses`, file: "mocks/agents.ts", kind: "write", progress: 0.85 },
      { label: "Type-check & lint · 0 errors", kind: "run", progress: 0.92 },
      { label: "Testing agent clicked through the main flow ✓", kind: "run", progress: 1 },
    ];
    runScript({
      steps,
      final: `Your **UI preview** is ready — ${s.pages.length} pages, with agents mocked for now.\n\n- Click **Edit** in the preview to change any text or colour directly\n- Or tell me what to change (“make it dark”, “change the title to …”)\n- When it feels right, **wire it up** and I'll create the real agents, database and API.`,
      label: "UI preview built",
      summary: `Generated ${s.pages.length} pages and components with mocked agents`,
      files: ["app/page.tsx", "components/Sidebar.tsx", "mocks/agents.ts"],
      mutate: (p) => ({ ...p, stage: "ui" }),
      speed: 480,
      credits: 6 + s.pages.length * 2,
    });
  }, [project, runScript, depth, setDepth]);

  const wireUp = useCallback(() => {
    if (!project || busy) return;
    const s = project.spec;
    const steps: Step[] = [
      ...s.agents.map((a) => ({ label: `Creating ${a.name} on Lyzr · ${a.model}`, file: `agents/${a.id}/agent.yaml`, kind: "write" as const })),
      { label: `Provisioning Postgres · ${s.data.length} tables with row-level security`, file: "db/schema.sql", kind: "write" },
      ...(s.auth ? [{ label: "Adding sign-in & roles", file: "lib/auth.ts", kind: "write" as const }] : []),
      { label: "Generating API route with input validation", file: "app/api/run/route.ts", kind: "write" },
      { label: "Connecting the agent pipeline", file: "lib/agents.ts", kind: "write" },
      { label: "Replacing mocks with live calls", file: "app/page.tsx", kind: "write" },
      { label: "Writing tests", file: "tests/pipeline.test.ts", kind: "write" },
      { label: `Running tests · ${s.agents.length + 2}/${s.agents.length + 2} passing`, kind: "run" },
      { label: "Testing agent ran 3 real journeys end-to-end ✓", kind: "run" },
    ];
    const missing = s.integrations.filter((i) => !project.integrations.includes(i));
    runScript({
      user: "Wire it up",
      steps,
      final: `Done — **${s.agents.map((a) => a.name).join(" → ")}** now run for real, backed by a database with row-level security. The mocks are gone.\n\n${missing.length ? `**One thing left:** ${missing.join(", ")} need${missing.length === 1 ? "s" : ""} your permission. Open **Apps** in the left rail to connect.` : "All integrations are connected."}\n\nTry it in the preview, or open **Agents** to test each one with traces.`,
      label: "Agents & backend wired",
      summary: `Created ${s.agents.length} Lyzr agents, database, API route and tests`,
      files: ["agents/", "db/schema.sql", "app/api/run/route.ts", "lib/agents.ts", "tests/pipeline.test.ts"],
      mutate: (p) => ({ ...p, stage: p.stage === "deployed" ? "deployed" : "wired", spec: { ...p.spec, agents: p.spec.agents.map((a) => ({ ...a, live: true })) } }),
      credits: 10 + s.agents.length * 4,
    });
  }, [project, busy, runScript]);

  // kick off initial build
  useEffect(() => {
    if (!project || started.current) return;
    if (params.get("build") === "ui" && project.chat.length === 0) {
      started.current = true;
      updateProject(project.id, (p) => ({ ...p, chat: [{ id: uid(), role: "user", text: p.prompt, at: Date.now() }] }));
      setTimeout(buildUI, 300);
      router.replace(`/project/${project.id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  async function onSend(text: string, mode: ChatMode) {
    if (!project) return;
    const t = text.toLowerCase();
    if (mode === "ask") {
      const um: Msg = { id: uid(), role: "user", text, at: Date.now() };
      updateProject(project.id, (p) => ({ ...p, chat: [...p.chat, um] }));
      setBusy(true);
      const m: Msg = { id: uid(), role: "assistant", text: "", steps: [{ label: "Reading project files", kind: "read" }], at: Date.now() };
      setStreaming(m);
      const res = await runAgent(
        { name: "Architect assistant", role: "answers questions about this app", instructions: `App: ${project.spec.appName}. Pages: ${project.spec.pages.map((x) => x.name).join(", ")}. Agents: ${project.spec.agents.map((a) => `${a.name} (${a.role})`).join("; ")}. Tables: ${project.spec.data.map((d) => d.name).join(", ")}. Stage: ${project.stage}. Answer the user's question about this app concisely.`, tools: [] },
        text,
        settings
      );
      await sleep(res.live ? 0 : 700);
      const answer =
        res.live && res.response
          ? res.response
          : t.includes("agent")
          ? `The pipeline is **${project.spec.agents.map((a) => a.name).join(" → ")}**. It's defined in \`lib/agents.ts\` and each agent's config lives in \`agents/<id>/agent.yaml\`. Open **Agents** to test one in isolation.`
          : t.includes("where") || t.includes("file")
          ? `Main page: \`app/page.tsx\`. Input box: \`components/RunBox.tsx\`. ${project.stage === "ui" ? "Mocks: `mocks/agents.ts`." : "API: `app/api/run/route.ts`. Schema: `db/schema.sql`."}`
          : `${project.spec.appName} is a Next.js app with ${project.spec.pages.length} pages and ${project.spec.agents.length} agents${project.stage === "ui" ? " (currently mocked)" : " running on Lyzr"}. Data lives in ${project.spec.data.map((d) => "`" + d.name + "`").join(", ")}.`;
      updateProject(project.id, (p) => ({ ...p, chat: [...p.chat, { ...m, text: answer + (res.live ? "" : "") }] }));
      setStreaming(null);
      setBusy(false);
      return;
    }
    if (mode === "plan") {
      const um: Msg = { id: uid(), role: "user", text, at: Date.now() };
      updateProject(project.id, (p) => ({ ...p, chat: [...p.chat, um] }));
      setBusy(true);
      await sleep(900);
      const plan = `Here's how I'd approach “${text}” — **nothing has changed yet**:\n\n1. Update the spec (\`architect/spec.yaml\`) so the change is part of the blueprint\n2. ${t.includes("agent") ? "Add or modify the agent and give it only the tools it needs" : "Edit the affected page and components"}\n3. ${project.stage === "ui" ? "Keep agents mocked so you can review the UI first" : "Add a test so this can't silently regress"}\n4. Save a checkpoint you can restore\n\nEstimated cost: ~3 credits. Say **Build this plan** to go ahead, or adjust it.`;
      updateProject(project.id, (p) => ({ ...p, chat: [...p.chat, { id: uid(), role: "assistant", text: plan, at: Date.now() }] }));
      setLastPlan(text);
      setBusy(false);
      return;
    }
    // build mode
    const artKind = detectArtifact(text);
    if (artKind) return createArtifact(artKind, text);
    if (t === "build this plan" && lastPlan) {
      setLastPlan(null);
      return onSend(lastPlan, "build");
    }
    if (/wire|make it (work|live|real)|connect (the )?agents|backend/.test(t) && project.stage === "ui") return wireUp();
    if (/deploy|publish|go live|ship/.test(t)) {
      updateProject(project.id, (p) => ({ ...p, chat: [...p.chat, { id: uid(), role: "user", text, at: Date.now() }, { id: uid(), role: "assistant", text: "Opening the deploy flow — I'll run tests, evals and a security scan first.", at: Date.now() }] }));
      return setModal("deploy");
    }
    if (/github|repo/.test(t) && !project.github) {
      updateProject(project.id, (p) => ({ ...p, chat: [...p.chat, { id: uid(), role: "user", text, at: Date.now() }, { id: uid(), role: "assistant", text: "Let's put it on your GitHub.", at: Date.now() }] }));
      return setModal("github");
    }

    const quoted = text.match(/["“']([^"”']+)["”']/)?.[1];
    const color = Object.keys(COLORS).find((c) => t.includes(c));
    const changes: string[] = [];
    let mutate: (p: Project) => Project = (p) => p;
    const chain = (f: (p: Project) => Project) => {
      const prev = mutate;
      mutate = (p) => f(prev(p));
    };
    if (ctx && quoted) {
      chain((p) => ({ ...p, content: { ...p.content, [ctx.key]: quoted } }));
      changes.push(`Changed ${ctx.label} to “${quoted}”`);
    } else if (quoted && /title|heading|headline|name/.test(t)) {
      const key = /name/.test(t) && !/title/.test(t) ? "brand.name" : "hero.title";
      chain((p) => ({ ...p, content: { ...p.content, [key]: quoted } }));
      changes.push(`Set ${key === "brand.name" ? "app name" : "page title"} to “${quoted}”`);
    } else if (quoted && /button|cta/.test(t)) {
      chain((p) => ({ ...p, content: { ...p.content, "run.cta": quoted } }));
      changes.push(`Button now says “${quoted}”`);
    }
    if (/dark/.test(t)) {
      chain((p) => ({ ...p, theme: { ...p.theme, dark: true, bg: undefined, text: undefined } }));
      changes.push("Switched to a dark theme");
    } else if (/light/.test(t)) {
      chain((p) => ({ ...p, theme: { ...p.theme, dark: false, bg: undefined, text: undefined } }));
      changes.push("Switched to a light theme");
    }
    if (color) {
      chain((p) => ({ ...p, theme: { ...p.theme, accent: COLORS[color] }, content: { ...p.content, "style.accent": "" } }));
      changes.push(`Brand colour → ${color}`);
    }
    if (/round/.test(t)) {
      chain((p) => ({ ...p, theme: { ...p.theme, radius: 16 } }));
      changes.push("Rounder corners (16px)");
    }
    if (/sharp|square|compact|dense/.test(t)) {
      chain((p) => ({ ...p, theme: { ...p.theme, radius: 4 } }));
      changes.push("Sharper, denser layout");
    }
    if (/serif|elegant/.test(t)) {
      chain((p) => ({ ...p, theme: { ...p.theme, font: "serif" } }));
      changes.push("Serif typography");
    }
    let newAgent: AgentSpec | null = null;
    if (/add (an? )?(\w+ )?agent|new agent/.test(t)) {
      const nm = (text.match(/add (?:an? )?(.+?) agent/i)?.[1] || "New").replace(/\b\w/g, (c) => c.toUpperCase());
      newAgent = { id: `${nm.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${project.spec.agents.length + 1}`, name: `${nm} Agent`, role: `Handles: ${text}`, model: "auto", tools: /slack/.test(t) ? ["slack.post"] : /email|gmail/.test(t) ? ["gmail.send"] : [], instructions: text, framework: "lyzr", live: project.stage !== "ui" };
      const na = newAgent;
      chain((p) => ({ ...p, spec: { ...p.spec, agents: [...p.spec.agents, na] } }));
      changes.push(`Added **${newAgent.name}** to the pipeline`);
    }
    if (ctx && !quoted && !color) changes.push(`Reworked ${ctx.label}`);

    const recognised = changes.length > 0;
    const steps: Step[] = [
      { label: `Reading ${ctx ? "selected element" : "app/page.tsx"}`, kind: "read", file: "app/page.tsx" },
      ...(newAgent ? [{ label: `Creating agents/${newAgent.id}/agent.yaml`, file: `agents/${newAgent.id}/agent.yaml`, kind: "write" as const }] : []),
      { label: recognised ? "Applying changes" : "Planning the change", kind: "write", file: recognised && !newAgent ? "app/globals.css" : undefined },
      { label: "Hot-reloaded preview ✓", kind: "run" },
    ];
    setCtx(null);
    runScript({
      user: ctx ? `[${ctx.label}] ${text}` : text,
      steps,
      final: recognised
        ? changes.map((c) => `- ${c}`).join("\n") + (newAgent ? `\n\nOpen **Agents** to configure and test it.` : "")
        : `I've drafted this change. _In this prototype the builder applies theme, colour, text, layout and agent changes live — try “make it dark”, “use purple”, “change the title to "…"” or “add a Slack alert agent”._`,
      label: recognised ? changes[0].replace(/\*\*/g, "") : text.slice(0, 48),
      summary: recognised ? changes.join(" · ").replace(/\*\*/g, "") : text,
      files: newAgent ? [`agents/${newAgent.id}/agent.yaml`, "lib/agents.ts"] : ["app/page.tsx"],
      mutate,
      speed: 380,
      credits: 2.5,
    });
  }

  function onPreviewEdit(changes: Record<string, string>, label: string) {
    if (!project) return;
    updateProject(project.id, (p) => {
      const content = { ...p.content };
      Object.entries(changes).forEach(([k, v]) => {
        if (v) content[k] = v;
        else delete content[k];
      });
      const np = { ...p, content };
      const cp = { ...checkpoint(`Edited ${label} in preview`, Object.values(changes).filter(Boolean).map((v) => `“${v}”`).join(", ") || "Reset", ["app/page.tsx"], "you", p.branch || "main"), snap: snap(np) };
      return { ...np, checkpoints: [...np.checkpoints, cp], chat: [...np.chat, { id: uid(), role: "assistant", text: `You edited **${label}** directly in the preview.`, checkpoint: cp.id, at: Date.now() }] };
    });
    toast("Saved · checkpoint created");
  }

  function restore(cpId: string) {
    if (!project) return;
    const cp = project.checkpoints.find((c) => c.id === cpId);
    if (!cp) return;
    updateProject(project.id, (p) => {
      const np = cp.snap ? { ...p, ...cp.snap } : p;
      const ncp = { ...checkpoint(`Restored “${cp.label}”`, `Rolled back to ${cp.sha}`, cp.files, "you", p.branch || "main"), snap: snap(np) };
      return { ...np, checkpoints: [...np.checkpoints, ncp], chat: [...np.chat, { id: uid(), role: "assistant", text: `Restored the version from **${cp.label}**. Nothing is lost — the newer version is still in History.`, checkpoint: ncp.id, at: Date.now() }] };
    });
    setModal(null);
    toast(`Restored ${cp.sha}`);
  }

  function createArtifact(kind: Artifact["kind"], userText?: string) {
    if (!project || busy) return;
    const art = makeArtifact(kind, project);
    setRail("artifacts");
    runScript({
      user: userText,
      steps: [
        { label: "Reading PRD, spec & agent configs", file: "architect/prd.md", kind: "read" },
        { label: `Drafting ${art.title.split(" — ")[1]}`, kind: "write" },
        { label: `Saved to architect/artifacts/${art.id}.md`, kind: "write" },
      ],
      final: `Created **${art.title}** — it's in the **Artifacts** tab. Download it as HTML or Markdown, or ask me to change anything.`,
      label: `Artifact: ${art.title.split(" — ")[1]}`,
      summary: art.title,
      files: [`architect/artifacts/${art.id}.md`],
      mutate: (p) => ({ ...p, artifacts: [art, ...(p.artifacts || [])] }),
      speed: 450,
      credits: 1.5,
    });
  }

  function applyTheme(t: ThemeDef) {
    if (!project) return;
    updateProject(project.id, (p) => {
      const np = { ...p, theme: { ...t.tokens, name: t.name }, content: { ...p.content, "style.accent": "" } };
      const cp = { ...checkpoint(`Applied theme “${t.name}”`, `Design tokens from ${t.source}`, ["app/globals.css", "architect/spec.yaml"], "you", p.branch || "main"), snap: snap(np) };
      return { ...np, checkpoints: [...np.checkpoints, cp], chat: [...np.chat, { id: uid(), role: "assistant", text: `Applied the **${t.name}** theme across every page.`, checkpoint: cp.id, at: Date.now() }] };
    });
    toast(`Theme “${t.name}” applied`);
  }

  function openFile(path: string) {
    setDepth("code");
    setRail("app");
    setOpenReq({ path, n: Date.now() });
  }

  const suggestions = useMemo(() => {
    if (!project) return [];
    if (lastPlan) return ["Build this plan"];
    if (project.stage === "ui") return ["Wire it up", "Make it dark", 'Change the title to "Welcome back"', "Use purple", "Make it rounder"];
    return [project.deployments.length ? "Deploy latest" : "Deploy to production", "Create a feature spec", "Add a Slack alert agent", "Make it dark", ...(project.github ? [] : ["Connect GitHub"])];
  }, [project, lastPlan]);

  if (!ready || !user) return <div className="min-h-screen" />;
  if (!project)
    return (
      <div className="grid min-h-screen place-items-center text-center">
        <div>
          <div className="text-[15px] font-medium">Project not found</div>
          <p className="mt-1 text-[13px] text-ink-3">It may have been deleted, or it lives in another browser (demo mode stores projects locally).</p>
          <Button className="mt-4" onClick={() => router.push("/home")}>Back to home</Button>
        </div>
      </div>
    );

  const stage = { ui: ["UI preview", "warn"], wired: ["Agents live", "bp"], deployed: ["Live", "ok"], planning: ["Planning", "neutral"] }[project.stage] as [string, "warn" | "bp" | "ok" | "neutral"];
  const RAIL: { k: Rail; icon: typeof Bot; label: string }[] = [
    { k: "app", icon: depth === "code" ? Code2 : depth === "blueprint" ? LayoutGrid : Monitor, label: depth === "code" ? "Code" : depth === "blueprint" ? "Blueprint" : "Preview" },
    { k: "agents", icon: Bot, label: "Agents" },
    { k: "artifacts", icon: FileText, label: "Artifacts" },
    { k: "data", icon: Database, label: "Database" },
    { k: "integrations", icon: Plug, label: "Apps" },
    { k: "security", icon: Shield, label: "Security" },
    { k: "deploys", icon: Rocket, label: "Deploys" },
    { k: "settings", icon: Settings, label: "Settings" },
  ];
  const prod = project.deployments.find((d) => d.env === "production" && d.status === "ready");

  const updateSpec = (s: Spec, label: string) =>
    updateProject(project.id, (p) => {
      const np = { ...p, spec: s };
      return { ...np, checkpoints: [...np.checkpoints, { ...checkpoint(label, "Edited in Blueprint", ["architect/spec.yaml"], "you", p.branch || "main"), snap: snap(np) }] };
    });

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line bg-white px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/home" className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-paper-2" title="All projects"><ArrowLeft className="h-4 w-4" /></Link>
          <LogoMark size={20} />
          <span className="truncate text-[14px] font-semibold">{project.name}</span>
          <Badge tone={stage[1]}>{stage[0]}</Badge>
          {project.stage === "ui" && !busy && (
            <Button size="sm" variant="dark" className="ml-1 hidden lg:inline-flex" icon={<Sparkles className="h-3.5 w-3.5" />} onClick={wireUp}>Wire it up</Button>
          )}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <Segmented
            value={depth}
            onChange={(d) => {
              setDepth(d);
              setRail("app");
            }}
            options={[
              { value: "outcome", label: <><MessageSquare className="h-3.5 w-3.5" /> Outcome</>, hint: "Chat + live preview (⌘1)" },
              { value: "blueprint", label: <><LayoutGrid className="h-3.5 w-3.5" /> Blueprint</>, hint: "Pages, agents & data as cards (⌘2)" },
              { value: "code", label: <><Code2 className="h-3.5 w-3.5" /> Code</>, hint: "Full IDE (⌘3)" },
            ]}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="hidden xl:flex items-center gap-1 text-[11.5px] text-ink-4 mr-1" title="Credits left"><Coins className="h-3.5 w-3.5" /> {Math.round(settings.credits)}</span>
          <Button size="sm" variant="ghost" icon={<History className="h-3.5 w-3.5" />} onClick={() => setModal("history")}>{project.checkpoints.length}</Button>
          <Button size="sm" variant="ghost" icon={<Github className="h-3.5 w-3.5" />} onClick={() => setModal("github")} title={project.github?.repo}>
            <span className="hidden lg:inline max-w-[140px] truncate">{project.github ? project.github.repo.split("/")[1] : "Connect"}</span>
            {project.github && <Circle className="h-2 w-2 fill-ok text-ok" />}
          </Button>
          <Button size="sm" variant="ghost" icon={<Share2 className="h-3.5 w-3.5" />} onClick={() => setModal("share")}><span className="hidden lg:inline">Share</span></Button>
          <Button size="sm" variant="primary" icon={<Rocket className="h-3.5 w-3.5" />} onClick={() => setModal("deploy")} disabled={building}>{prod ? "Redeploy" : "Deploy"}</Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Rail */}
        <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-line bg-paper-2/60 py-2">
          {RAIL.map((r) => (
            <button
              key={r.k}
              onClick={() => setRail(r.k)}
              className={cn("group relative flex w-12 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px]", rail === r.k ? "bg-white text-ink shadow-card" : "text-ink-4 hover:text-ink hover:bg-white/60")}
            >
              <r.icon className="h-[18px] w-[18px]" />
              {r.label}
              {r.k === "integrations" && project.spec.integrations.some((i) => !project.integrations.includes(i)) && project.stage !== "ui" && <span className="absolute right-2 top-1 h-1.5 w-1.5 rounded-full bg-warn" />}
            </button>
          ))}
          <div className="mt-auto"><HelpWidget compact /></div>
          <div className="flex flex-col items-center gap-1 pb-1 text-[9.5px] text-ink-4" title="Sandbox running">
            <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulseDot" /> sandbox
          </div>
        </nav>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {rail === "app" && depth === "outcome" && <Preview project={project} building={building} buildProgress={progress} onEdit={onPreviewEdit} onAskAI={(t) => { setCtx(t); setChatOpen(true); }} onWire={wireUp} onApplyTheme={applyTheme} />}
          {rail === "app" && depth === "blueprint" && <Blueprint project={project} onSpec={updateSpec} onPrd={(md) => updateProject(project.id, (p) => ({ ...p, prd: md, checkpoints: [...p.checkpoints, { ...checkpoint("Edited PRD", "Updated architect/prd.md", ["architect/prd.md"], "you"), snap: snap({ ...p, prd: md }) }] }))} openFile={openFile} openAgent={(aid) => { setAgentFocus(aid); setRail("agents"); }} />}
          {rail === "app" && depth === "code" && (
            <div className="flex h-full">
              <div className={cn("min-w-0", codeSplit ? "w-[58%]" : "flex-1")}>
                <IDE
                  project={project}
                  openRequest={openReq}
                  dirty={dirty}
                  setDirty={setDirty}
                  onSaveFile={(path, content) => updateProject(project.id, (p) => ({ ...p, files: { ...p.files, [path]: content } }))}
                  onCommit={(msg, files, push) => {
                    updateProject(project.id, (p) => ({ ...p, checkpoints: [...p.checkpoints, { ...checkpoint(msg || "Update files", `${files.length} file(s) · ${push && p.github ? "pushed to " + p.github.repo : "local commit"}`, files, "you", p.branch || "main"), snap: snap(p) }] }));
                    toast(push && project.github ? `Committed & pushed to ${project.github.repo}` : "Committed");
                  }}
                  onBranch={(b) => updateProject(project.id, (p) => ({ ...p, branch: b, branches: Array.from(new Set([...(p.branches || []), b].filter((x) => x !== "main"))) }))}
                  onPR={(title) => {
                    updateProject(project.id, (p) => ({ ...p, prs: [...(p.prs || []), { id: 12 + (p.prs?.length || 0), title, head: p.branch || "feature", base: "main", status: "open", at: Date.now() }] }));
                    toast(`PR opened on ${project.github?.repo || "your repo"} · preview deploying`);
                  }}
                />
              </div>
              {codeSplit && (
                <div className="w-[42%] border-l border-line">
                  <Preview narrow project={project} building={building} buildProgress={progress} onEdit={onPreviewEdit} onAskAI={(t) => { setCtx(t); setChatOpen(true); }} onWire={wireUp} onApplyTheme={applyTheme} />
                </div>
              )}
            </div>
          )}
          {rail === "agents" && <AgentsPanel project={project} depth={depth} focus={agentFocus} openFile={openFile} onUpdate={(agents, label) => updateSpec({ ...project.spec, agents }, label)} />}
          {rail === "data" && <DataPanel project={project} depth={depth} />}
          {rail === "integrations" && <IntegrationsPanel project={project} onConnect={(n) => updateProject(project.id, (p) => ({ ...p, integrations: Array.from(new Set([...p.integrations, n])) }))} onEnv={(env) => updateProject(project.id, (p) => ({ ...p, env }))} />}
          {rail === "security" && (
            <SecurityPanel
              project={project}
              onFix={(fid) => {
                updateProject(project.id, (p) => ({ ...p, security: { lastScan: Date.now(), fixed: [...(p.security?.fixed || []), fid] } }));
                runScript({ steps: [{ label: "Reading app/api/run/route.ts", kind: "read", file: "app/api/run/route.ts" }, { label: "Applying fix", kind: "write", file: fid === "rate" ? "middleware.ts" : "agents/" }, { label: "Re-running security scan ✓", kind: "run" }], final: `Fixed: **${{ rate: "rate limiting on /api/run (20 req/min per user)", inject: "prompt-injection guard on tool-using agents", pii: "PII redaction in logs" }[fid] || fid}**.`, label: "Security fix", summary: fid, files: ["middleware.ts"], speed: 350, credits: 1 });
                setChatOpen(true);
              }}
            />
          )}
          {rail === "artifacts" && <ArtifactsPanel project={project} onCreate={(k) => createArtifact(k)} />}
          {rail === "deploys" && (
            <DeploymentsPanel
              project={project}
              onDeploy={() => setModal("deploy")}
              onRename={(sub) => updateProject(project.id, (p) => ({ ...p, subdomain: sub, deployments: p.deployments.map((d) => (d.env === "production" ? { ...d, url: `https://${sub}.architect.app` } : d)) }))}
              onPromote={(did) => updateProject(project.id, (p) => {
                const d = p.deployments.find((x) => x.id === did)!;
                return { ...p, stage: "deployed", deployments: [{ ...d, id: uid("d_"), env: "production", url: d.url.replace(/-git-[\w-]+/, ""), at: Date.now() }, ...p.deployments] };
              })}
              onRollback={(did) => {
                updateProject(project.id, (p) => {
                  const d = p.deployments.find((x) => x.id === did)!;
                  return { ...p, deployments: [{ ...d, id: uid("d_"), at: Date.now() }, ...p.deployments.map((x) => (x.env === "production" && x.status === "ready" ? { ...x, status: "rolled-back" as const } : x))] };
                });
                toast("Rolled back · live in 4s");
              }}
            />
          )}
          {rail === "settings" && <ProjectSettings project={project} onRename={(n) => { updateProject(project.id, (p) => ({ ...p, name: n })); toast("Renamed"); }} onDelete={() => { deleteProject(project.id); router.replace("/home"); }} onGitHub={() => setModal("github")} />}
        </main>

        {/* Chat */}
        {chatOpen ? (
          <aside className="w-[360px] shrink-0 border-l border-line">
            <Chat
              project={project}
              depth={depth}
              busy={busy}
              streaming={streaming}
              context={ctx?.label}
              clearContext={() => setCtx(null)}
              onSend={onSend}
              onStop={() => (cancel.current = true)}
              onOpenFile={openFile}
              onRestore={restore}
              onCollapse={() => setChatOpen(false)}
              suggestions={suggestions}
            />
          </aside>
        ) : (
          <button onClick={() => setChatOpen(true)} className="absolute bottom-5 right-5 z-20 flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13px] text-white shadow-pop hover:bg-ink-2">
            <PanelRightOpen className="h-4 w-4" /> Chat {busy && <span className="h-1.5 w-1.5 rounded-full bg-[#7CE0A5] animate-pulseDot" />}
          </button>
        )}
      </div>

      {rail === "app" && depth === "code" && (
        <button onClick={() => setCodeSplit(!codeSplit)} className={cn("fixed bottom-9 z-20 flex items-center gap-1.5 rounded-full border border-ide-line bg-ide-panel px-3 py-1.5 text-[12px] text-ide-text shadow-pop hover:text-white", chatOpen ? "right-[376px]" : "right-36")}>
          <Columns2 className="h-3.5 w-3.5" /> {codeSplit ? "Hide preview" : "Split with preview"}
        </button>
      )}

      <GitHubModal
        open={modal === "github"}
        onClose={() => setModal(null)}
        project={project}
        login={login}
        onConnect={(g) => {
          updateProject(project.id, (p) => ({ ...p, github: g }));
          toast(`Synced to github.com/${g.repo}`);
        }}
        onDisconnect={() => updateProject(project.id, (p) => ({ ...p, github: undefined }))}
      />
      <DeployModal
        open={modal === "deploy"}
        onClose={() => setModal(null)}
        project={project}
        openSecurity={() => setRail("security")}
        onFixEnv={(env) => updateProject(project.id, (p) => ({ ...p, env }))}
        onDeployed={(env, url) => {
          const sha = project.checkpoints[project.checkpoints.length - 1]?.sha || "0000000";
          updateProject(project.id, (p) => ({
            ...p,
            stage: env === "production" && p.stage !== "ui" ? "deployed" : p.stage,
            deployments: [{ id: uid("d_"), env, sha, url, at: Date.now(), status: "ready" }, ...p.deployments],
            chat: [...p.chat, { id: uid(), role: "assistant", text: `🚀 Deployed to **${env}** → ${url.replace("https://", "")}`, at: Date.now() }],
          }));
          spendCredits(2);
        }}
      />
      <ShareModal open={modal === "share"} onClose={() => setModal(null)} project={project} />
      <HistoryDrawer open={modal === "history"} onClose={() => setModal(null)} project={project} depth={depth} onRestore={restore} />

    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense>
      <Workspace />
    </Suspense>
  );
}
