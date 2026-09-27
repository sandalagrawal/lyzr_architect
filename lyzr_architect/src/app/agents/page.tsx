"use client";
import { useState } from "react";
import { Bot, Search, BadgeCheck, Copy, Plus, Download } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input, Modal, Segmented, cn, toast } from "@/components/ui";
import { LIBRARY, type LibAgent } from "@/lib/library";
import { FRAMEWORKS, MODELS } from "@/lib/presets";
import { useStore } from "@/lib/store";

export default function AgentLibrary() {
  const { projects, updateProject } = useStore();
  const [scope, setScope] = useState<"all" | "workspace" | "public" | "mine">("all");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [open, setOpen] = useState<LibAgent | null>(null);
  const [tab, setTab] = useState<"sdk" | "rest" | "mcp">("sdk");

  const mine: LibAgent[] = projects.flatMap((p) =>
    Object.entries(p.publishedAgents || {}).map(([aid, v]) => {
      const a = p.spec.agents.find((x) => x.id === aid);
      return { id: `${p.name.toLowerCase()}/${aid}`, name: a?.name || aid, desc: a?.role || "", owner: "You", version: v, installs: "0", framework: a?.framework || "lyzr", model: a?.model || "auto", tools: a?.tools || [], category: "Ops" as const, scope: "workspace" as const };
    })
  );
  const all = [...mine, ...LIBRARY];
  const cats = ["All", "Research", "Sales", "Support", "Docs", "Engineering", "Ops"];
  const list = all.filter((a) => (scope === "all" ? true : scope === "mine" ? a.owner === "You" : a.scope === scope) && (cat === "All" || a.category === cat) && (a.name + a.desc).toLowerCase().includes(q.toLowerCase()));

  const snippet = (a: LibAgent) =>
    ({
      sdk: `import { agents } from "@architect/sdk";\n\nconst agent = agents.use("${a.id}@${a.version}");\nconst out = await agent.run(input);`,
      rest: `curl -X POST https://api.architect.new/v1/agents/${a.id}/run \\\n  -H "Authorization: Bearer $ARCHITECT_KEY" \\\n  -d '{"input": "…"}'`,
      mcp: `"${a.id.split("/").pop()}": { "url": "https://mcp.architect.new/${a.id}" }`,
    })[tab];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight">Agent Library</h1>
            <p className="mt-1 text-[14px] text-ink-3">Tested, versioned agents you can plug into any app — via the SDK, a REST call or MCP.</p>
          </div>
          <Button variant="dark" icon={<Plus className="h-4 w-4" />} onClick={() => toast("Open any project → Agents → Use & publish to add yours here", "info")}>Publish an agent</Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Segmented value={scope} onChange={setScope} options={[{ value: "all", label: "All" }, { value: "workspace", label: "My workspace" }, { value: "public", label: "Marketplace" }, { value: "mine", label: `Published by me (${mine.length})` }]} />
          <div className="relative ml-auto w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-4" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agents" className="pl-8" /></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("rounded-full px-3 py-1 text-[12.5px]", cat === c ? "bg-ink text-white" : "bg-paper-3 text-ink-3 hover:text-ink")}>{c}</button>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <button key={a.id} onClick={() => setOpen(a)} className="rounded-2xl border border-line bg-white p-4 text-left shadow-card hover:border-bp/40 hover:shadow-pop transition-all">
              <div className="flex items-start justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-bp-soft text-bp"><Bot className="h-4.5 w-4.5 h-[18px] w-[18px]" /></div>
                <span className="font-mono text-[11px] text-ink-4">v{a.version}</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[14px] font-semibold">{a.name}{a.verified && <BadgeCheck className="h-4 w-4 text-bp" />}</div>
              <p className="mt-1 text-[12.5px] text-ink-3 line-clamp-2 min-h-[36px]">{a.desc}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge>{FRAMEWORKS.find((f) => f.id === a.framework)?.name}</Badge>
                <Badge>{MODELS.find((m) => m.id === a.model)?.name}</Badge>
                <span className="ml-auto flex items-center gap-1 text-[11.5px] text-ink-4"><Download className="h-3 w-3" /> {a.installs}</span>
              </div>
              <div className="mt-2 text-[11.5px] text-ink-4">{a.owner} · {a.scope === "public" ? "Marketplace" : "Workspace"}</div>
            </button>
          ))}
        </div>
        {!list.length && <Card className="mt-5 p-10 text-center text-[13px] text-ink-3">No agents match. Publish one from any project&apos;s Agents tab.</Card>}
      </div>

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} width={600} title={open?.name} subtitle={open ? `${open.owner} · v${open.version} · ${open.installs} installs` : ""}>
        {open && (
          <div className="space-y-4">
            <p className="text-[13.5px] text-ink-2">{open.desc}</p>
            <div className="grid grid-cols-3 gap-2 text-[12px]">
              <div className="rounded-lg bg-paper-2 p-2.5"><div className="text-ink-4">Framework</div><div className="font-medium">{FRAMEWORKS.find((f) => f.id === open.framework)?.name}</div></div>
              <div className="rounded-lg bg-paper-2 p-2.5"><div className="text-ink-4">Default model</div><div className="font-medium">{MODELS.find((m) => m.id === open.model)?.name}</div></div>
              <div className="rounded-lg bg-paper-2 p-2.5"><div className="text-ink-4">Eval pass rate</div><div className="font-medium text-ok">96%</div></div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between"><span className="text-[13px] font-semibold">Use in code</span><Segmented size="sm" value={tab} onChange={setTab} options={[{ value: "sdk", label: "SDK" }, { value: "rest", label: "REST" }, { value: "mcp", label: "MCP" }]} /></div>
              <div className="relative"><pre className="overflow-x-auto rounded-xl bg-ide-bg p-4 font-mono text-[12px] leading-5 text-ide-text">{snippet(open)}</pre><button onClick={() => { navigator.clipboard?.writeText(snippet(open)); toast("Copied"); }} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-ide-line text-ide-text"><Copy className="h-3.5 w-3.5" /></button></div>
            </div>
            <div>
              <div className="mb-2 text-[13px] font-semibold">Or add to a project</div>
              {projects.length ? (
                <div className="flex flex-wrap gap-2">
                  {projects.slice(0, 6).map((p) => (
                    <Button key={p.id} size="sm" onClick={() => {
                      updateProject(p.id, (pp) => ({ ...pp, spec: { ...pp.spec, agents: [...pp.spec.agents, { id: open.id.split("/").pop() + "-" + (pp.spec.agents.length + 1), name: open.name, role: open.desc, model: open.model, tools: open.tools, instructions: open.desc, framework: open.framework, libraryId: open.id, live: pp.stage !== "ui" }] } }));
                      toast(`${open.name} added to ${p.name}`);
                      setOpen(null);
                    }}>+ {p.name}</Button>
                  ))}
                </div>
              ) : (
                <div className="text-[12.5px] text-ink-3">Create a project first.</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
