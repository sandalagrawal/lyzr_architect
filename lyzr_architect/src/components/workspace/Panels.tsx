"use client";
import { useState } from "react";
import { Database, Table2, Shield, KeyRound, Plus, Eye, EyeOff, Check, Loader2, AlertTriangle, ShieldCheck, Cpu, Globe, Rocket, RotateCcw, ArrowUpRight, Server, Users, Lock, Wand2, Circle, Plug, ExternalLink } from "lucide-react";
import type { Depth, Project } from "@/lib/types";
import { Badge, Button, Card, Input, Label, Modal, Segmented, Switch, cn, toast } from "@/components/ui";
import { presetFor, timeAgo } from "@/lib/generate";
import { sleep } from "@/lib/client";
import { CATALOG } from "@/lib/integrations";

/* ---------------- Database ---------------- */
export function DataPanel({ project, depth }: { project: Project; depth: Depth }) {
  const tables = project.spec.data;
  const [t, setT] = useState(tables[0]?.name);
  const [view, setView] = useState<"rows" | "schema" | "policies">(depth === "code" ? "schema" : "rows");
  const table = tables.find((x) => x.name === t) || tables[0];
  const wired = project.stage !== "ui";
  const sample = presetFor(project.spec.domain).sample.results;
  if (!wired)
    return (
      <div className="grid h-full place-items-center bg-paper p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-bp-soft text-bp"><Database className="h-5 w-5" /></div>
          <div className="mt-4 text-[15px] font-semibold">Database is provisioned when you wire up the app</div>
          <p className="mt-1.5 text-[13px] text-ink-3">Your schema is already planned: {tables.map((x) => x.name).join(", ")}. We&apos;ll create it with row-level security, then connect the agents to it.</p>
        </div>
      </div>
    );
  return (
    <div className="flex h-full bg-paper">
      <div className="w-52 shrink-0 border-r border-line bg-white p-2">
        <div className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Tables</div>
        {tables.map((x) => (
          <button key={x.name} onClick={() => setT(x.name)} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-mono text-[12.5px]", x.name === table?.name ? "bg-bp-soft/70 text-bp-2" : "hover:bg-paper-2")}>
            <Table2 className="h-3.5 w-3.5" /> {x.name}
          </button>
        ))}
        <div className="mt-4 px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Auth</div>
        <button onClick={() => toast("3 users · Google & email sign-in enabled", "info")} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] hover:bg-paper-2"><Users className="h-3.5 w-3.5" /> Users & roles</button>
        <div className="mt-4 rounded-lg bg-paper-2 p-2.5 text-[11.5px] text-ink-3">
          Managed Postgres · 12 MB / 500 MB
          <button onClick={() => toast("Bring your own Supabase, Postgres or MongoDB — coming from Settings", "info")} className="mt-1 block text-bp hover:underline">Connect your own DB</button>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 items-center justify-between border-b border-line bg-white px-4">
          <span className="font-mono text-[13px] font-medium">{table?.name}</span>
          <Segmented size="sm" value={view} onChange={setView} options={[{ value: "rows", label: "Rows" }, { value: "schema", label: "Schema" }, { value: "policies", label: "Access rules" }]} />
        </div>
        <div className="flex-1 overflow-auto scroll-thin p-4">
          {view === "rows" && table && (
            <Card className="overflow-hidden">
              <table className="w-full text-left text-[12.5px]">
                <thead className="bg-paper-2 text-ink-3">
                  <tr>{table.fields.map((f) => <th key={f.name} className="px-3 py-2 font-mono font-medium">{f.name}</th>)}</tr>
                </thead>
                <tbody>
                  {sample.map((r, i) => (
                    <tr key={i} className="border-t border-line">
                      {table.fields.map((f, j) => (
                        <td key={f.name} className="px-3 py-2 truncate max-w-[200px]">
                          {f.name === "id" ? <span className="font-mono text-ink-4">{(i + 1).toString(16).padStart(8, "a")}…</span> : f.type === "int" ? r.score : f.type === "bool" ? "true" : f.type === "jsonb" ? <span className="font-mono text-ink-4">{"{…}"}</span> : f.name === "status" ? r.tag : j === 1 ? r.title : r.meta}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          {view === "schema" && (
            <pre className="rounded-xl bg-ide-bg p-4 font-mono text-[12px] leading-5 text-ide-text">{`create table ${table?.name} (\n${table?.fields.map((f) => `  ${f.name} ${f.type}${f.name === "id" ? " primary key default gen_random_uuid()" : ""}`).join(",\n")}\n);`}</pre>
          )}
          {view === "policies" && (
            <div className="space-y-2">
              {[
                ["Row-level security", "Enabled", true],
                ["Users can read their own rows", "auth.uid() = owner_id", true],
                ["Agents write via service role only", "server-side key, never exposed to the browser", true],
                ["Public read", "Disabled", false],
              ].map(([t, d, ok]) => (
                <Card key={t as string} className="flex items-center justify-between p-3">
                  <div>
                    <div className="text-[13px] font-medium">{t as string}</div>
                    <div className="font-mono text-[11.5px] text-ink-4">{d as string}</div>
                  </div>
                  {ok ? <Badge tone="ok"><Lock className="h-3 w-3" /> on</Badge> : <Badge>off</Badge>}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Integrations ---------------- */
export function IntegrationsPanel({ project, onConnect, onEnv }: { project: Project; onConnect: (name: string) => void; onEnv: (env: Record<string, string>) => void }) {
  const [tab, setTab] = useState<"apps" | "mcp" | "secrets">("apps");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcps, setMcps] = useState<string[]>(["github (official)"]);
  const [apiUrl, setApiUrl] = useState("");
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [k, setK] = useState("");
  const [v, setV] = useState("");
  const needed = project.spec.integrations;
  const envKeys = Array.from(new Set(["ARCHITECT_API_KEY", ...needed.map((i) => `${i.toUpperCase().replace(/[^A-Z]/g, "_")}_TOKEN`), ...Object.keys(project.env)]));
  const app = CATALOG.find((c) => c.name === connecting);
  return (
    <div className="h-full overflow-y-auto scroll-thin bg-paper">
      <div className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-line bg-white px-4">
        <Segmented size="sm" value={tab} onChange={setTab} options={[{ value: "apps", label: <><Plug className="h-3 w-3" /> Apps</> }, { value: "mcp", label: <><Server className="h-3 w-3" /> MCP & custom tools</> }, { value: "secrets", label: <><KeyRound className="h-3 w-3" /> Secrets</> }]} />
        <span className="text-[11.5px] text-ink-4">Credentials are stored in an encrypted vault, never in your code.</span>
      </div>
      <div className="mx-auto max-w-4xl p-6">
        {tab === "apps" && (
          <>
            <div className="text-[13px] font-semibold">Used by this app</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {needed.map((n) => {
                const on = project.integrations.includes(n);
                const c = CATALOG.find((x) => x.name === n);
                return (
                  <Card key={n} className="flex items-center gap-3 p-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg text-[13px] font-bold text-white" style={{ background: c?.color || "#555" }}>{n[0]}</div>
                    <div className="flex-1">
                      <div className="text-[13.5px] font-medium">{n}</div>
                      <div className="text-[11.5px] text-ink-4">{on ? "Connected · used by " + Math.max(1, project.spec.agents.filter((a) => a.tools.some((t) => t.toLowerCase().includes(n.toLowerCase().split(" ").pop() || ""))).length) + " agent(s)" : "Needs access"}</div>
                    </div>
                    {on ? <Badge tone="ok"><Check className="h-3 w-3" /> Connected</Badge> : <Button size="sm" variant="dark" onClick={() => setConnecting(n)}>Connect</Button>}
                  </Card>
                );
              })}
            </div>
            <div className="mt-8 text-[13px] font-semibold">Catalog</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {CATALOG.filter((c) => !needed.includes(c.name)).map((c) => (
                <button key={c.name} onClick={() => setConnecting(c.name)} className="flex items-center gap-2.5 rounded-xl border border-line bg-white p-2.5 text-left hover:border-bp/40">
                  <div className="grid h-8 w-8 place-items-center rounded-lg text-[12px] font-bold text-white" style={{ background: c.color }}>{c.name[0]}</div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">{c.name}</div>
                    <div className="truncate text-[11px] text-ink-4">{c.cat}</div>
                  </div>
                  {project.integrations.includes(c.name) && <Check className="ml-auto h-3.5 w-3.5 text-ok" />}
                </button>
              ))}
            </div>
          </>
        )}
        {tab === "mcp" && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="text-[13.5px] font-semibold">Add an MCP server</div>
              <p className="text-[12.5px] text-ink-3">Any tool with an MCP endpoint becomes available to every agent in this app.</p>
              <div className="mt-3 flex gap-2">
                <Input value={mcpUrl} onChange={(e) => setMcpUrl(e.target.value)} placeholder="https://mcp.linear.app/sse" />
                <Button variant="dark" disabled={!mcpUrl} onClick={async () => { const n = mcpUrl.replace(/https?:\/\//, "").split("/")[0]; setMcpUrl(""); await sleep(500); setMcps([...mcps, n]); toast(`${n} connected · 12 tools discovered`); }}>Connect</Button>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[13.5px] font-semibold">Add a custom tool</div>
              <p className="text-[12.5px] text-ink-3">Point to an OpenAPI spec or a single HTTP endpoint — each operation becomes a tool your agents can call.</p>
              <div className="mt-3 flex gap-2">
                <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://api.yourcompany.com/openapi.json" />
                <Button disabled={!apiUrl} onClick={async () => { const n = apiUrl.replace(/https?:\/\//, "").split("/")[0]; setApiUrl(""); await sleep(500); setMcps([...mcps, `${n} (OpenAPI)`]); toast(`${n}: 7 operations imported as tools`); }}>Import</Button>
              </div>
            </Card>
            {mcps.map((m) => (
              <Card key={m} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2"><Server className="h-4 w-4 text-bp" /><span className="font-mono text-[13px]">{m}</span></div>
                <div className="flex items-center gap-2 text-[12px] text-ink-3">12 tools <Badge tone="ok">healthy</Badge></div>
              </Card>
            ))}
          </div>
        )}
        {tab === "secrets" && (
          <Card className="overflow-hidden">
            <div className="grid grid-cols-[1fr_1.4fr_110px] gap-3 border-b border-line bg-paper-2 px-4 py-2 text-[11.5px] font-medium text-ink-3"><span>Key</span><span>Value</span><span>Environments</span></div>
            {envKeys.map((key) => {
              const val = project.env[key] || (key === "ARCHITECT_API_KEY" ? "arch_live_•••••••" : "");
              return (
                <div key={key} className="grid grid-cols-[1fr_1.4fr_110px] items-center gap-3 border-b border-line px-4 py-2">
                  <span className="truncate font-mono text-[12px]">{key}</span>
                  <span className="flex items-center gap-2 font-mono text-[12px] text-ink-3">
                    {val ? (show[key] ? val : "••••••••••••") : <span className="text-warn font-sans">Missing — needed to deploy</span>}
                    {val && <button onClick={() => setShow({ ...show, [key]: !show[key] })}>{show[key] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>}
                  </span>
                  <span className="text-[11.5px] text-ink-4">Preview · Prod</span>
                </div>
              );
            })}
            <div className="flex gap-2 p-3">
              <Input value={k} onChange={(e) => setK(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))} placeholder="KEY" className="font-mono" />
              <Input value={v} onChange={(e) => setV(e.target.value)} placeholder="value" type="password" />
              <Button disabled={!k || !v} onClick={() => { onEnv({ ...project.env, [k]: v }); setK(""); setV(""); toast(`${k} saved to vault`); }}>Add</Button>
            </div>
          </Card>
        )}
      </div>

      <Modal open={Boolean(connecting)} onClose={() => setConnecting(null)} width={420} title={`Connect ${connecting}`} subtitle="Architect will ask for the minimum access your agents need."
        footer={<><Button variant="ghost" onClick={() => setConnecting(null)}>Cancel</Button><Button variant="primary" onClick={async () => { const n = connecting!; setConnecting(null); await sleep(300); onConnect(n); toast(`${n} connected (simulated OAuth)`); }}>Authorize</Button></>}>
        <div className="space-y-2">
          {(app?.scopes || ["Read data", "Write data"]).map((s) => (
            <div key={s} className="flex items-center gap-2 rounded-lg bg-paper-2 px-3 py-2 text-[13px]"><Check className="h-3.5 w-3.5 text-ok" /> {s}</div>
          ))}
          <p className="pt-2 text-[12px] text-ink-4">You can revoke access at any time. Tokens are encrypted and scoped to this app only.</p>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- Security & sandbox ---------------- */
type Check_ = { id: string; title: string; detail: string; sev: "critical" | "warn" | "ok"; fix?: string };
export function SecurityPanel({ project, onFix }: { project: Project; onFix: (label: string) => void }) {
  const fixed = project.security?.fixed || [];
  const [scanning, setScanning] = useState(false);
  const [ran, setRan] = useState(Boolean(project.security));
  const wired = project.stage !== "ui";
  const base: Check_[] = [
    { id: "secrets", title: "No secrets in client code", detail: "Scanned 38 files for API keys and tokens", sev: "ok" },
    { id: "rls", title: "Row-level security on all tables", detail: wired ? `${project.spec.data.length} tables protected` : "Database not provisioned yet", sev: wired ? "ok" : "warn" },
    { id: "rate", title: "Rate limiting on /api/run", detail: "Anyone could run your agents in a loop and burn credits", sev: "critical", fix: "Add 20 req/min per user limit" },
    { id: "inject", title: "Prompt-injection guard on agents that use tools", detail: `${project.spec.agents.filter((a) => a.tools.length).length} agents call external tools`, sev: "warn", fix: "Enable input guardrail on tool-using agents" },
    { id: "pii", title: "PII redacted from logs", detail: "Agent inputs may contain emails & phone numbers", sev: "warn", fix: "Turn on PII redaction for logs" },
    { id: "deps", title: "Dependencies", detail: "0 known vulnerabilities (npm audit)", sev: "ok" },
    { id: "auth", title: project.spec.auth ? "All routes require sign-in" : "App is open — no sign-in", detail: project.spec.auth ? "Middleware protects 4 routes" : "Fine for internal tools; risky for public apps", sev: project.spec.auth ? "ok" : "warn" },
  ];
  const checks: Check_[] = base.map((c) => (fixed.includes(c.id) ? { ...c, sev: "ok" as const, detail: "Fixed by Architect · " + c.fix } : c));
  const [view, setView] = useState<"scan" | "audit">("scan");
  const audit = [
    ...project.checkpoints.map((c) => ({ at: c.at, who: c.author === "you" ? "You" : "Architect", what: `Committed ${c.sha} — ${c.label}` })),
    ...project.deployments.map((d) => ({ at: d.at, who: "You", what: `Deployed ${d.sha} to ${d.env}` })),
    ...project.integrations.map((n, i) => ({ at: project.createdAt + (i + 1) * 60000, who: "You", what: `Granted ${n} access (OAuth)` })),
    { at: project.createdAt, who: "You", what: "Created project" },
  ].sort((a, b) => b.at - a.at);
  const crit = checks.filter((c) => c.sev === "critical").length;
  const warn = checks.filter((c) => c.sev === "warn").length;
  return (
    <div className="h-full overflow-y-auto scroll-thin bg-paper">
      <div className="mx-auto max-w-4xl p-6 space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4 sm:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[15px] font-semibold"><ShieldCheck className="h-4.5 w-4.5 h-[18px] w-[18px] text-bp" /> Security scan</div>
                <div className="text-[12.5px] text-ink-3">Runs on every commit and blocks deploys with critical issues.</div>
              </div>
              <Button size="sm" variant="dark" loading={scanning} onClick={async () => { setScanning(true); await sleep(1200); setScanning(false); setRan(true); }}>{ran ? "Re-scan" : "Run scan"}</Button>
            </div>
            {ran && (
              <div className="mt-4 flex gap-2 text-[12.5px]">
                <Badge tone={crit ? "bad" : "ok"}>{crit} critical</Badge>
                <Badge tone={warn ? "warn" : "ok"}>{warn} warnings</Badge>
                <Badge tone="ok">{checks.filter((c) => c.sev === "ok").length} passed</Badge>
              </div>
            )}
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold"><Cpu className="h-4 w-4 text-bp" /> Sandbox</div>
            <div className="mt-2 space-y-1 text-[12px] text-ink-3">
              <div className="flex justify-between"><span>Status</span><span className="text-ok">● running</span></div>
              <div className="flex justify-between"><span>Isolation</span><span>microVM</span></div>
              <div className="flex justify-between"><span>Egress</span><span>allowlist (4)</span></div>
              <div className="flex justify-between"><span>CPU / RAM</span><span>12% · 610 MB</span></div>
            </div>
          </Card>
        </div>
        <div className="flex items-center justify-between">
          <Segmented size="sm" value={view} onChange={setView} options={[{ value: "scan", label: "Scan results" }, { value: "audit", label: "Audit log" }]} />
          {view === "audit" && <Button size="sm" variant="ghost" onClick={() => toast("Audit log exported as CSV", "info")}>Export CSV</Button>}
        </div>
        {view === "audit" ? (
          <Card className="divide-y divide-line">
            {audit.map((e, i) => (
              <div key={i} className="grid grid-cols-[110px_120px_1fr] gap-3 px-4 py-2.5 text-[12.5px]">
                <span className="text-ink-4 tabular-nums">{new Date(e.at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <span className="font-medium">{e.who}</span>
                <span className="text-ink-2">{e.what}</span>
              </div>
            ))}
          </Card>
        ) : ran ? (
          <Card className="divide-y divide-line">
            {checks.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                {c.sev === "ok" ? <Check className="h-4 w-4 text-ok" /> : c.sev === "critical" ? <AlertTriangle className="h-4 w-4 text-bad" /> : <AlertTriangle className="h-4 w-4 text-warn" />}
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{c.title}</div>
                  <div className="text-[12px] text-ink-3">{c.detail}</div>
                </div>
                {c.fix && c.sev !== "ok" && (
                  <Button size="sm" icon={<Wand2 className="h-3.5 w-3.5" />} onClick={() => onFix(c.id)}>Fix: {c.fix}</Button>
                )}
              </div>
            ))}
          </Card>
        ) : (
          <Card className="p-8 text-center text-[13px] text-ink-3">Run a scan to check secrets, access rules, rate limits, prompt injection and PII handling.</Card>
        )}
      </div>
    </div>
  );
}

/* ---------------- Deployments list ---------------- */
export function DeploymentsPanel({ project, onDeploy, onRollback, onPromote, onRename }: { project: Project; onDeploy: () => void; onRollback: (id: string) => void; onPromote: (id: string) => void; onRename: (sub: string) => void }) {
  const [renaming, setRenaming] = useState(false);
  const [sub, setSub] = useState(project.subdomain || project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  const prod = project.deployments.find((d) => d.env === "production" && d.status === "ready");
  return (
    <div className="h-full overflow-y-auto scroll-thin bg-paper">
      <div className="mx-auto max-w-4xl p-6 space-y-5">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[12px] font-medium uppercase tracking-wider text-ink-4">Production</div>
              {prod ? (
                <>
                  <a href="#" onClick={(e) => e.preventDefault()} className="mt-1 flex items-center gap-1.5 text-[18px] font-semibold text-bp hover:underline">{prod.url.replace("https://", "")} <ArrowUpRight className="h-4 w-4" /></a>
                  <div className="mt-1 text-[12.5px] text-ink-3">Deployed {timeAgo(prod.at)} · commit <span className="font-mono">{prod.sha}</span> · <button onClick={() => setRenaming(true)} className="text-bp hover:underline">Rename URL</button></div>
                  {renaming && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Input value={sub} onChange={(e) => setSub(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className="!h-8 w-44 font-mono !text-[12.5px]" />
                      <span className="font-mono text-[12.5px] text-ink-3">.architect.app</span>
                      <Button size="sm" variant="dark" disabled={!sub} onClick={() => { onRename(sub); setRenaming(false); toast(`Now live at ${sub}.architect.app — old URL redirects`); }}>Save</Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-1 text-[15px] font-medium text-ink-3">Not deployed yet</div>
              )}
            </div>
            <Button variant="primary" icon={<Rocket className="h-4 w-4" />} onClick={onDeploy}>{prod ? "Deploy latest" : "Deploy"}</Button>
          </div>
          {prod && (
            <div className="mt-4 grid grid-cols-4 gap-3 border-t border-line pt-4 text-[12px]">
              {[["Uptime", "100%"], ["p95 latency", "1.9s"], ["Agent runs (24h)", "143"], ["Errors", "0.4%"]].map(([k, v]) => (
                <div key={k}><div className="text-ink-4">{k}</div><div className="mt-0.5 text-[15px] font-semibold tabular-nums">{v}</div></div>
              ))}
            </div>
          )}
        </Card>
        <div>
          <div className="mb-2 text-[13px] font-semibold">History</div>
          {project.deployments.length === 0 ? (
            <Card className="p-8 text-center text-[13px] text-ink-3">Every deploy shows up here with a one-click rollback.</Card>
          ) : (
            <Card className="divide-y divide-line">
              {project.deployments.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-2.5 text-[12.5px]">
                  <Circle className={cn("h-2.5 w-2.5 fill-current", d.status === "ready" ? "text-ok" : d.status === "failed" ? "text-bad" : "text-ink-4")} />
                  <Badge tone={d.env === "production" ? "dark" : "neutral"}>{d.env}</Badge>
                  <span className="font-mono text-ink-3">{d.sha}</span>
                  <span className="truncate text-ink-3">{d.url.replace("https://", "")}</span>
                  <span className="ml-auto text-ink-4">{timeAgo(d.at)}</span>
                  {d.status === "rolled-back" && <Badge>rolled back</Badge>}
                  {d.env === "preview" && d.status === "ready" && <Button size="sm" variant="ghost" onClick={() => onPromote(d.id)}>Promote</Button>}
                  {d.env === "production" && d.status === "ready" && d.id !== prod?.id && <Button size="sm" variant="ghost" icon={<RotateCcw className="h-3 w-3" />} onClick={() => onRollback(d.id)}>Roll back to this</Button>}
                </div>
              ))}
            </Card>
          )}
        </div>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[13.5px] font-semibold"><Globe className="h-4 w-4 text-bp" /> Custom domain</div>
              <div className="text-[12.5px] text-ink-3">Point a CNAME to <span className="font-mono">cname.architect.app</span>. SSL is automatic.</div>
            </div>
            <DomainAdder />
          </div>
        </Card>
      </div>
    </div>
  );
}

function DomainAdder() {
  const [d, setD] = useState("");
  const [added, setAdded] = useState<string | null>(null);
  if (added) return <Badge tone="warn"><Loader2 className="h-3 w-3 animate-spin" /> {added} · verifying DNS</Badge>;
  return (
    <div className="flex gap-2">
      <Input value={d} onChange={(e) => setD(e.target.value)} placeholder="app.yourcompany.com" className="w-52" />
      <Button disabled={!d.includes(".")} onClick={() => setAdded(d)}>Add</Button>
    </div>
  );
}

/* ---------------- Project settings ---------------- */
export function ProjectSettings({ project, onRename, onDelete, onGitHub }: { project: Project; onRename: (n: string) => void; onDelete: () => void; onGitHub: () => void }) {
  const [name, setName] = useState(project.name);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="h-full overflow-y-auto scroll-thin bg-paper">
      <div className="mx-auto max-w-2xl p-6 space-y-5">
        <Card className="p-5 space-y-4">
          <div>
            <Label>Project name</Label>
            <div className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} /><Button disabled={name === project.name || !name.trim()} onClick={() => onRename(name.trim())}>Save</Button></div>
          </div>
          <div>
            <Label>Repository</Label>
            <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[13px]">
              <span className="font-mono">{project.github?.repo || "Hosted by Architect (not on GitHub yet)"}</span>
              <Button size="sm" onClick={onGitHub}>{project.github ? "Manage" : "Connect GitHub"}</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[12.5px]">
            <div className="rounded-lg bg-paper-2 p-3"><div className="text-ink-4">Created</div><div className="mt-0.5 font-medium">{new Date(project.createdAt).toLocaleString()}</div></div>
            <div className="rounded-lg bg-paper-2 p-3"><div className="text-ink-4">Source</div><div className="mt-0.5 font-medium capitalize">{project.source?.type}{project.source?.ref ? ` · ${project.source.ref}` : ""}</div></div>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <div><div className="font-medium">Allow remix</div><div className="text-[12px] text-ink-3">Others in your workspace can copy this app as a template.</div></div>
            <Switch checked={false} onChange={() => toast("Remix enabled", "info")} />
          </div>
        </Card>
        <Card className="p-5 border-bad/30">
          <div className="text-[13.5px] font-semibold text-bad">Danger zone</div>
          <div className="mt-2 flex items-center justify-between text-[12.5px] text-ink-3">
            Delete this project, its deployments and agents. Your GitHub repo is not touched.
            <Button variant="danger" size="sm" onClick={() => setConfirm(true)}>Delete</Button>
          </div>
        </Card>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title={`Delete ${project.name}?`} subtitle="This can't be undone." width={400} footer={<><Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" onClick={onDelete}>Delete project</Button></>}>
        <p className="text-[13px] text-ink-3">Production URL will stop working immediately.</p>
      </Modal>
    </div>
  );
}

export { ExternalLink };
