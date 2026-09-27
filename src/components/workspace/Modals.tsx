"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Rocket, AlertTriangle, ShieldCheck, FlaskConical, KeyRound, Globe, Copy, ExternalLink, Lock, RotateCcw, GitCommitHorizontal, X, Link2, Mail, Bot } from "lucide-react";
import { Github } from "@/components/icons";
import type { Depth, Project } from "@/lib/types";
import { Badge, Button, Input, Label, Modal, Segmented, Switch, cn, toast } from "@/components/ui";
import { slug, timeAgo } from "@/lib/generate";
import { sleep } from "@/lib/client";

/* ---------------- GitHub ---------------- */
export function GitHubModal({ open, onClose, project, login, onConnect, onDisconnect }: { open: boolean; onClose: () => void; project: Project; login: string; onConnect: (g: NonNullable<Project["github"]>) => void; onDisconnect: () => void }) {
  const [step, setStep] = useState<"auth" | "repo" | "creating" | "done">("auth");
  const [owner, setOwner] = useState(login);
  const [name, setName] = useState(slug(project.name));
  const [vis, setVis] = useState<"private" | "public">("private");
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [autoCommit, setAutoCommit] = useState(true);
  const [prFlow, setPrFlow] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    let authed = false;
    try {
      authed = Boolean(localStorage.getItem("a2.github"));
    } catch {}
    setStep(project.github ? "done" : authed ? "repo" : "auth");
    setLog([]);
  }, [open, project.github]);

  async function create() {
    setStep("creating");
    const lines = [`Creating ${vis} repo ${owner}/${name}`, `Pushing ${project.checkpoints.length || 1} checkpoints as commits`, "Adding .github/workflows/architect-preview.yml", "Installing Architect GitHub App (webhooks for 2-way sync)"];
    for (const l of lines) {
      setLog((x) => [...x, l]);
      await sleep(450);
    }
    onConnect({ repo: `${owner}/${name}`, branch: "main", autoCommit, org: owner });
    setStep("done");
  }

  return (
    <Modal open={open} onClose={onClose} width={500} title={<span className="flex items-center gap-2"><Github className="h-4 w-4" /> GitHub</span>} subtitle={step === "done" ? "Two-way sync is on. Edits in Architect are commits; pushes to GitHub show up here." : "Your project is already a Git repo. Put it on your GitHub to own it fully."}>
      {step === "auth" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-paper-2 p-4 text-[13px] text-ink-2 space-y-2">
            {["Create & sync repositories", "Open pull requests from Architect", "Import existing repos"].map((t) => (
              <div key={t} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-ok" /> {t}</div>
            ))}
            <div className="flex items-center gap-2 text-ink-4"><Lock className="h-3.5 w-3.5" /> Access only to repos you select</div>
          </div>
          <Button variant="dark" className="w-full" size="lg" icon={<Github className="h-4 w-4" />} onClick={async () => { await sleep(700); try { localStorage.setItem("a2.github", JSON.stringify({ login })); } catch {} setStep("repo"); toast("GitHub authorized (simulated OAuth)", "info"); }}>
            Authorize Architect on GitHub
          </Button>
        </div>
      )}
      {step === "repo" && (
        <div className="space-y-4">
          <Segmented value={mode} onChange={setMode} options={[{ value: "new", label: "Create new repo" }, { value: "existing", label: "Use existing repo" }]} />
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div>
              <Label>Owner</Label>
              <select value={owner} onChange={(e) => setOwner(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-white px-2 text-[13px]">
                <option>{login}</option>
                <option>acme-labs</option>
              </select>
            </div>
            <div>
              <Label>{mode === "new" ? "Repository name" : "Repository"}</Label>
              {mode === "new" ? <Input value={name} onChange={(e) => setName(slug(e.target.value) || e.target.value)} /> : (
                <select value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-white px-2 text-[13px]">
                  {[slug(project.name), "lyzr_architect", "side-project", "company-website"].map((r) => <option key={r}>{r}</option>)}
                </select>
              )}
            </div>
          </div>
          {mode === "new" && (
            <div className="flex gap-2">
              {(["private", "public"] as const).map((v) => (
                <button key={v} onClick={() => setVis(v)} className={cn("flex-1 rounded-lg border px-3 py-2 text-left text-[13px] capitalize", vis === v ? "border-bp bg-bp-soft/50" : "border-line")}>{v}</button>
              ))}
            </div>
          )}
          <div className="space-y-3 rounded-xl border border-line p-3 text-[13px]">
            <div className="flex items-center justify-between"><div><div className="font-medium">Commit every checkpoint</div><div className="text-[12px] text-ink-3">Your GitHub history mirrors Architect&apos;s history.</div></div><Switch checked={autoCommit} onChange={setAutoCommit} /></div>
            <div className="flex items-center justify-between"><div><div className="font-medium">AI changes go through pull requests</div><div className="text-[12px] text-ink-3">For teams: Architect works on <span className="font-mono">architect/*</span> branches.</div></div><Switch checked={prFlow} onChange={setPrFlow} /></div>
          </div>
          <Button variant="primary" className="w-full" onClick={create}>{mode === "new" ? `Create ${owner}/${name}` : `Link ${owner}/${name}`}</Button>
        </div>
      )}
      {step === "creating" && (
        <div className="space-y-2 font-mono text-[12.5px]">
          {log.map((l, i) => (
            <div key={i} className="flex items-center gap-2">{i === log.length - 1 ? <Loader2 className="h-3.5 w-3.5 animate-spin text-bp" /> : <Check className="h-3.5 w-3.5 text-ok" />} {l}</div>
          ))}
        </div>
      )}
      {step === "done" && project.github && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-line p-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white"><Github className="h-5 w-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="truncate font-mono text-[13.5px] font-medium">{project.github.repo}</div>
              <div className="text-[12px] text-ink-3">branch {project.branch || project.github.branch} · synced just now · {project.checkpoints.length} commits</div>
            </div>
            <Badge tone="ok">synced</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button icon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => window.open(`https://github.com/${project.github!.repo}`, "_blank")}>Open on GitHub</Button>
            <Button icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={async () => { await sleep(600); toast("Already up to date with origin/main"); }}>Pull latest</Button>
          </div>
          <div className="rounded-lg bg-paper-2 p-3 font-mono text-[12px] text-ink-2">
            git clone git@github.com:{project.github.repo}.git
          </div>
          <button onClick={() => { onDisconnect(); onClose(); }} className="text-[12.5px] text-bad hover:underline">Disconnect repository</button>
        </div>
      )}
    </Modal>
  );
}

/* ---------------- Deploy ---------------- */
type Phase = "setup" | "checks" | "building" | "done";
export function DeployModal({ open, onClose, project, onDeployed, onFixEnv, openSecurity }: { open: boolean; onClose: () => void; project: Project; onDeployed: (env: "preview" | "production", url: string) => void; onFixEnv: (env: Record<string, string>) => void; openSecurity: () => void }) {
  const [env, setEnv] = useState<"preview" | "production">("production");
  const [phase, setPhase] = useState<Phase>("setup");
  const [logs, setLogs] = useState<string[]>([]);
  const [checks, setChecks] = useState<Record<string, "run" | "ok" | "warn">>({});
  const [missing, setMissing] = useState<Record<string, string>>({});
  const url = `https://${project.subdomain || slug(project.name)}${env === "preview" ? "-git-" + (project.branch || "main") : ""}.architect.app`;
  const wired = project.stage !== "ui";
  const needKeys = project.spec.integrations.map((i) => `${i.toUpperCase().replace(/[^A-Z]/g, "_")}_TOKEN`).filter((k) => !project.env[k] && !project.integrations.some((n) => k.startsWith(n.toUpperCase().replace(/[^A-Z]/g, "_"))));
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [logs]);

  useEffect(() => {
    if (open) {
      setPhase("setup");
      setLogs([]);
      setChecks({});
      setMissing({});
    }
  }, [open]);

  async function runChecks() {
    setPhase("checks");
    for (const k of ["tests", "evals", "security", "secrets"]) {
      setChecks((c) => ({ ...c, [k]: "run" }));
      await sleep(550);
      const crit = k === "security" && !(project.security?.fixed || []).includes("rate");
      setChecks((c) => ({ ...c, [k]: k === "secrets" && needKeys.length ? "warn" : crit ? "warn" : "ok" }));
    }
  }

  async function build() {
    if (Object.keys(missing).length) onFixEnv({ ...project.env, ...missing });
    setPhase("building");
    const steps = [
      `▲ Cloning ${project.github?.repo || "architect-hosted repo"} @ ${project.checkpoints[project.checkpoints.length - 1]?.sha || "HEAD"}`,
      "Installing dependencies (cached) · 3.1s",
      "Running next build",
      `✓ Compiled ${project.spec.pages.length} routes`,
      wired ? `Registering ${project.spec.agents.length} agents with Lyzr runtime (${env})` : "Bundling mocked agents (UI-only deploy)",
      wired ? "Applying database migrations · 0 pending" : "Skipping database — not wired yet",
      "Uploading to edge · 42 regions",
      `✓ Assigned ${url.replace("https://", "")}`,
    ];
    for (const s of steps) {
      setLogs((l) => [...l, s]);
      await sleep(480);
    }
    onDeployed(env, url);
    setPhase("done");
  }

  const allDone = ["tests", "evals", "security", "secrets"].every((k) => checks[k] && checks[k] !== "run");
  const labels: Record<string, { t: string; icon: typeof Check; warn: string }> = {
    tests: { t: `Tests pass`, icon: FlaskConical, warn: "" },
    evals: { t: "Agent evals pass", icon: Bot, warn: "" },
    security: { t: "Security scan", icon: ShieldCheck, warn: "1 critical: no rate limit on /api/run" },
    secrets: { t: "Secrets present", icon: KeyRound, warn: `${needKeys.length} missing for ${env}` },
  };

  return (
    <Modal open={open} onClose={onClose} width={560} title={<span className="flex items-center gap-2"><Rocket className="h-4 w-4 text-bp" /> Deploy {project.name}</span>} subtitle={phase === "done" ? undefined : "Pre-flight checks run first — nothing ships broken."}>
      {phase === "setup" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["preview", "Preview", "A private URL to test & share. Doesn't affect users."],
                ["production", "Production", "Your live app. Previous version kept for rollback."],
              ] as const
            ).map(([k, t, b]) => (
              <button key={k} onClick={() => setEnv(k)} className={cn("rounded-xl border p-3 text-left", env === k ? "border-bp bg-bp-soft/40 ring-4 ring-bp/10" : "border-line")}>
                <div className="text-[13.5px] font-semibold">{t}</div>
                <div className="mt-0.5 text-[12px] text-ink-3">{b}</div>
              </button>
            ))}
          </div>
          <div className="rounded-xl bg-paper-2 p-3 text-[12.5px] space-y-1.5">
            <div className="flex justify-between"><span className="text-ink-3">URL</span><span className="font-mono">{url.replace("https://", "")}</span></div>
            <div className="flex justify-between"><span className="text-ink-3">Commit</span><span className="font-mono">{project.checkpoints[project.checkpoints.length - 1]?.sha || "—"} · {project.branch || "main"}</span></div>
            <div className="flex justify-between"><span className="text-ink-3">Agents</span><span>{wired ? `${project.spec.agents.length} live on Lyzr` : "mocked (wire up for live agents)"}</span></div>
          </div>
          {!wired && (
            <div className="flex items-start gap-2 rounded-lg bg-warn-soft px-3 py-2 text-[12.5px] text-warn"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> This deploys the UI with mocked agents — great for sharing a clickable prototype.</div>
          )}
          <Button variant="primary" size="lg" className="w-full" onClick={runChecks}>Run pre-flight checks</Button>
        </div>
      )}
      {phase === "checks" && (
        <div className="space-y-3">
          {Object.entries(labels).map(([k, l]) => (
            <div key={k} className="rounded-xl border border-line px-3 py-2.5">
              <div className="flex items-center gap-2.5 text-[13px]">
                {checks[k] === "run" ? <Loader2 className="h-4 w-4 animate-spin text-bp" /> : checks[k] === "ok" ? <Check className="h-4 w-4 text-ok" /> : checks[k] === "warn" ? <AlertTriangle className="h-4 w-4 text-warn" /> : <l.icon className="h-4 w-4 text-ink-4" />}
                <span className="font-medium">{l.t}</span>
                {checks[k] === "warn" && <span className="text-[12px] text-warn">{l.warn}</span>}
                {k === "security" && checks[k] === "warn" && <button onClick={() => { onClose(); openSecurity(); }} className="ml-auto text-[12px] text-bp hover:underline">Fix in Security →</button>}
              </div>
              {k === "secrets" && checks[k] === "warn" && (
                <div className="mt-2 space-y-1.5 pl-6">
                  {needKeys.map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-44 truncate font-mono text-[11.5px]">{key}</span>
                      <Input type="password" placeholder="paste value or connect the app" value={missing[key] || ""} onChange={(e) => setMissing({ ...missing, [key]: e.target.value })} className="!h-8 !text-[12px]" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {allDone && (
            <div className="flex justify-between gap-2 pt-1">
              <Button variant="ghost" onClick={() => setPhase("setup")}>Back</Button>
              <div className="flex gap-2">
                {Object.values(checks).includes("warn") && <span className="self-center text-[12px] text-ink-4">Warnings don&apos;t block {env}</span>}
                <Button variant="primary" icon={<Rocket className="h-4 w-4" />} onClick={build}>Deploy to {env}</Button>
              </div>
            </div>
          )}
        </div>
      )}
      {phase === "building" && (
        <div className="h-64 overflow-y-auto rounded-xl bg-ide-bg p-3 font-mono text-[12px] leading-5 text-ide-text scroll-thin">
          {logs.map((l, i) => (
            <div key={i} className={l.startsWith("✓") ? "text-[#9ECE6A]" : ""}>{l}</div>
          ))}
          <div className="flex items-center gap-2 text-ide-dim"><Loader2 className="h-3 w-3 animate-spin" /> building…</div>
          <div ref={endRef} />
        </div>
      )}
      {phase === "done" && (
        <div className="text-center py-2">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ok-soft text-ok"><Check className="h-6 w-6" /></div>
          <div className="mt-4 text-[18px] font-semibold tracking-tight">{env === "production" ? "You're live!" : "Preview is ready"}</div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 font-mono text-[13px]"><Globe className="h-3.5 w-3.5 text-ok" /> {url.replace("https://", "")}</div>
            <Button size="sm" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => { navigator.clipboard?.writeText(url); toast("URL copied"); }} />
          </div>
          <p className="mt-3 text-[12.5px] text-ink-3">Simulated deploy for this demo. Rollback & custom domains are in the Deploys tab.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ---------------- Share ---------------- */
export function ShareModal({ open, onClose, project }: { open: boolean; onClose: () => void; project: Project }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Editor");
  const [people, setPeople] = useState<{ email: string; role: string }[]>([]);
  const [link, setLink] = useState(true);
  return (
    <Modal open={open} onClose={onClose} width={480} title="Share project" subtitle="Invite teammates. Each person picks their own depth — a PM in Blueprint, an engineer in Code.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="h-9 rounded-lg border border-line bg-white px-2 text-[13px]">
            <option>Viewer</option>
            <option>Editor</option>
            <option>Developer</option>
            <option>Admin</option>
          </select>
          <Button variant="dark" icon={<Mail className="h-3.5 w-3.5" />} disabled={!email.includes("@")} onClick={() => { setPeople([...people, { email, role }]); setEmail(""); toast(`Invite sent to ${email}`); }}>Invite</Button>
        </div>
        <div className="text-[11.5px] text-ink-4">Viewer: preview & comment · Editor: chat & visual edits · Developer: + code, terminal, deploy · Admin: + billing & secrets</div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px]"><span>You</span><span className="text-ink-4">Owner</span></div>
          {people.map((p) => (
            <div key={p.email} className="flex items-center justify-between rounded-lg bg-paper-2 px-2 py-1.5 text-[13px]"><span>{p.email}</span><span className="flex items-center gap-2 text-ink-3">{p.role} <Badge tone="warn">pending</Badge><button onClick={() => setPeople(people.filter((x) => x.email !== p.email))}><X className="h-3 w-3" /></button></span></div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-xl border border-line p-3">
          <div className="flex items-center gap-2 text-[13px]"><Link2 className="h-4 w-4 text-ink-3" /><div><div className="font-medium">Preview link</div><div className="text-[12px] text-ink-3">Anyone with the link can try the app (not edit)</div></div></div>
          <Switch checked={link} onChange={setLink} />
        </div>
        {link && (
          <div className="flex gap-2">
            <Input readOnly value={`https://${slug(project.name)}-${project.id.slice(2, 6)}.preview.architect.new`} className="font-mono !text-[12px]" />
            <Button icon={<Copy className="h-3.5 w-3.5" />} onClick={() => toast("Link copied")}>Copy</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ---------------- History ---------------- */
export function HistoryDrawer({ open, onClose, project, depth, onRestore }: { open: boolean; onClose: () => void; project: Project; depth: Depth; onRestore: (id: string) => void }) {
  if (!open) return null;
  const list = [...project.checkpoints].reverse();
  return (
    <div className="fixed inset-0 z-40" onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()} className="absolute right-0 top-0 h-full w-[380px] border-l border-line bg-white shadow-pop animate-in flex flex-col">
        <div className="flex h-12 items-center justify-between border-b border-line px-4">
          <div className="text-[14px] font-semibold">{depth === "code" ? "Commits" : "History"}</div>
          <button onClick={onClose} className="text-ink-4 hover:text-ink"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-4 py-2 text-[12px] text-ink-3 border-b border-line">{depth === "code" ? `${project.github?.repo || "local"} · ${project.branch || "main"}` : "Every change is saved. Restore any version — nothing is ever lost."}</div>
        <div className="flex-1 overflow-y-auto scroll-thin">
          {list.map((c, i) => (
            <div key={c.id} className="group relative flex gap-3 px-4 py-3 hover:bg-paper">
              <div className="flex flex-col items-center">
                <GitCommitHorizontal className={cn("h-4 w-4", i === 0 ? "text-bp" : "text-ink-4")} />
                {i < list.length - 1 && <div className="mt-1 w-px flex-1 bg-line" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-medium">{c.label}</span>
                  {i === 0 && <Badge tone="bp">current</Badge>}
                </div>
                <div className="text-[12px] text-ink-3">{c.summary}</div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-4">
                  {depth === "code" && <span className="font-mono">{c.sha}</span>}
                  <span>{c.author === "you" ? "You" : "Architect"}</span>·<span>{timeAgo(c.at)}</span>
                  {depth === "code" && <span>· {c.files.length} files</span>}
                </div>
              </div>
              {i > 0 && (
                <button onClick={() => onRestore(c.id)} className="self-start rounded-md border border-line px-2 py-1 text-[11.5px] opacity-0 group-hover:opacity-100 hover:border-bp/40 hover:text-bp">Restore</button>
              )}
            </div>
          ))}
          {!list.length && <div className="p-6 text-center text-[13px] text-ink-3">No checkpoints yet.</div>}
        </div>
      </div>
    </div>
  );
}
