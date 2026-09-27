"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Bot, Check, Database, FileText, LayoutGrid, Pencil, Plug, Plus, Sparkles, Trash2, Wand2, X, Eye, Coins, Clock, Info } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { Badge, Button, Card, Input, Spinner, cn, toast } from "@/components/ui";
import { useStore } from "@/lib/store";
import { buildPRD, buildSpec, discoveryQuestions, newProject, slug } from "@/lib/generate";
import { MODELS } from "@/lib/presets";
import { Markdown } from "@/lib/md";
import type { AgentSpec, Spec } from "@/lib/types";

type StepKey = "discover" | "prd" | "specs";
const STEPS: { key: StepKey; label: string; icon: typeof Sparkles }[] = [
  { key: "discover", label: "Discover", icon: Sparkles },
  { key: "prd", label: "PRD", icon: FileText },
  { key: "specs", label: "Specs", icon: LayoutGrid },
];

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const prompt = params.get("prompt") || "";
  const quick = params.get("quick") === "1";
  const { user, ready, saveProject, settings, spendCredits } = useStore();
  const { preset, questions } = useMemo(() => discoveryQuestions(prompt), [prompt]);
  const [step, setStep] = useState<StepKey>("discover");
  const [qi, setQi] = useState(0);
  const [thinking, setThinking] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [prd, setPrd] = useState("");
  const [prdEdit, setPrdEdit] = useState(false);
  const [prdBusy, setPrdBusy] = useState(false);
  const [prdLive, setPrdLive] = useState(false);
  const [change, setChange] = useState("");
  const [spec, setSpec] = useState<Spec | null>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=new");
  }, [ready, user, router]);

  useEffect(() => {
    const t = setTimeout(() => setThinking(false), 900);
    return () => clearTimeout(t);
  }, []);

  // quick mode — skip planning with smart defaults
  useEffect(() => {
    if (!quick || !ready || !user || !prompt) return;
    const a = defaults();
    const s = buildSpec(prompt, preset, a, settings.defaultAgentModel);
    createAndBuild(s, buildPRD(prompt, s), a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quick, ready, user]);

  function defaults() {
    const a: Record<string, string | string[]> = {};
    questions.forEach((q) => (a[q.id] = q.multi ? q.options.slice(0, Math.min(3, q.options.length)) : q.options[0]));
    return { ...a, ...answers };
  }

  const q = questions[qi];
  const cur = answers[q?.id];

  // multi-select questions start with our recommendation pre-selected
  useEffect(() => {
    if (q?.multi && answers[q.id] === undefined) setAnswers((a) => ({ ...a, [q.id]: q.options.slice(0, Math.min(3, q.options.length)) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi, thinking]);

  function pick(opt: string) {
    if (q.multi) {
      const arr = (cur as string[]) || [];
      setAnswers({ ...answers, [q.id]: arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt] });
    } else {
      setAnswers({ ...answers, [q.id]: opt });
      setTimeout(() => nextQ(), 220);
    }
  }

  function nextQ() {
    if (qi < questions.length - 1) setQi((x) => x + 1);
    else toPRD();
  }

  async function toPRD(a = answers) {
    const full = { ...defaults(), ...a };
    setAnswers(full);
    const s = buildSpec(prompt, preset, full, settings.defaultAgentModel);
    setSpec(s);
    const draft = buildPRD(prompt, s);
    setPrd(draft);
    setStep("prd");
    setPrdBusy(true);
    try {
      const r = await fetch("/api/prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, spec: s, draft, apiKey: settings.byok.lyzr_key, agentId: settings.byok.lyzr_agent }),
      }).then((x) => x.json());
      if (r.live && r.prd) {
        setPrd(r.prd);
        setPrdLive(true);
      }
    } catch {}
    setPrdBusy(false);
  }

  function applyChange() {
    if (!change.trim()) return;
    const marker = "## Additional requirements";
    setPrd((p) => (p.includes(marker) ? p.replace(marker, `${marker}\n- ${change.trim()}`) : `${p.trim()}\n\n${marker}\n- ${change.trim()}\n`));
    setChange("");
    toast("Added to the PRD");
  }

  function createAndBuild(s: Spec, prdText: string, a: Record<string, string | string[]>) {
    const p = newProject({ prompt, spec: s, prd: prdText, answers: a });
    const login = (user?.name || "you").toLowerCase().replace(/\s+/g, "");
    let gh = false;
    try {
      gh = Boolean(localStorage.getItem("a2.github"));
    } catch {}
    if (gh) p.github = { repo: `${login}/${slug(s.appName)}`, branch: "main", autoCommit: true, org: login };
    saveProject(p);
    spendCredits(4);
    router.replace(`/project/${p.id}?build=ui`);
  }

  if (!prompt) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Button onClick={() => router.push("/home")}>Back to home</Button>
      </div>
    );
  }
  if (quick) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-3 text-[14px]">
        <div className="flex items-center gap-2"><Spinner /> Skipping planning — using smart defaults…</div>
      </div>
    );
  }

  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const est = spec ? 6 + spec.pages.length * 2 + spec.agents.length * 4 : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push("/home")} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-paper-3" aria-label="Exit"><X className="h-4 w-4" /></button>
            <LogoMark />
            <div className="truncate text-[13px] text-ink-3 max-w-[340px]" title={prompt}>“{prompt}”</div>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 h-7 text-[12.5px] font-medium", i === stepIdx ? "bg-ink text-white" : i < stepIdx ? "text-ok" : "text-ink-4")}>
                  {i < stepIdx ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />} {s.label}
                </div>
                <div className="w-5 h-px bg-line-2 mx-0.5" />
              </div>
            ))}
            <div className="flex items-center gap-1.5 rounded-full px-2.5 h-7 text-[12.5px] font-medium text-ink-4"><Eye className="h-3.5 w-3.5" /> UI preview</div>
          </div>
          <div className="w-[120px] flex justify-end">
            <Badge tone="bp"><Sparkles className="h-3 w-3" /> AI consultant</Badge>
          </div>
        </div>
      </header>

      {step === "discover" && (
        <div className="flex-1 flex items-start justify-center px-4 pt-[7vh] pb-16">
          <div className="w-full max-w-2xl">
            {thinking ? (
              <div className="flex items-center gap-2 text-[14px] text-ink-3 animate-in"><Spinner /> Reading your idea…</div>
            ) : (
              <div key={qi} className="animate-in">
                <div className="flex items-center gap-3 text-[12.5px] text-ink-4">
                  <span className="font-mono">{qi + 1}/{questions.length}</span>
                  <div className="flex-1 h-1 rounded-full bg-paper-3 overflow-hidden">
                    <div className="h-full bg-bp transition-all" style={{ width: `${((qi + 1) / questions.length) * 100}%` }} />
                  </div>
                  <span>Looks like a <b className="font-medium text-ink-2">{preset.key === "generic" ? "workflow" : preset.key}</b> app</span>
                </div>
                <h2 className="mt-6 text-[26px] font-semibold tracking-tight">{q.q}</h2>
                <p className="mt-1.5 text-[13.5px] text-ink-3 flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> {q.why}{q.multi && " We've pre-selected our recommendation."}</p>
                <div className="mt-6 space-y-2">
                  {q.options.map((o, i) => {
                    const on = q.multi ? ((cur as string[]) || []).includes(o) : cur === o;
                    return (
                      <button
                        key={o}
                        onClick={() => pick(o)}
                        className={cn("flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] transition-all", on ? "border-bp bg-bp-soft/50 shadow-card" : "border-line bg-white hover:border-line-2")}
                      >
                        <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[10.5px] font-mono", on ? "border-bp bg-bp text-white" : "border-line-2 text-ink-4")}>
                          {on ? <Check className="h-3 w-3" /> : i + 1}
                        </span>
                        {o}
                      </button>
                    );
                  })}
                  <OtherInput
                    onAdd={(v) => {
                      if (q.multi) setAnswers({ ...answers, [q.id]: [...((cur as string[]) || []), v] });
                      else {
                        setAnswers({ ...answers, [q.id]: v });
                        setTimeout(nextQ, 200);
                      }
                    }}
                  />
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} disabled={qi === 0} onClick={() => setQi(qi - 1)}>Back</Button>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => toPRD()}>Skip — use smart defaults</Button>
                    <Button variant="dark" onClick={nextQ} disabled={q.multi ? !((cur as string[]) || []).length : !cur}>
                      {qi === questions.length - 1 ? "Write the PRD" : "Next"} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === "prd" && spec && (
        <div className="flex-1 grid lg:grid-cols-[1fr_340px] animate-in">
          <div className="border-r border-line px-4 sm:px-10 py-8 overflow-y-auto">
            <div className="mx-auto max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[12.5px] text-ink-3">
                  <FileText className="h-4 w-4" /> architect/prd.md
                  {prdBusy ? <Badge tone="bp"><Spinner className="h-3 w-3" /> Refining with Lyzr…</Badge> : prdLive ? <Badge tone="ok"><Check className="h-3 w-3" /> Refined by a live Lyzr agent</Badge> : <Badge>Draft</Badge>}
                </div>
                <Button size="sm" variant={prdEdit ? "dark" : "secondary"} icon={prdEdit ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />} onClick={() => setPrdEdit(!prdEdit)}>
                  {prdEdit ? "Done editing" : "Edit"}
                </Button>
              </div>
              <Card className="p-7">
                {prdEdit ? (
                  <textarea value={prd} onChange={(e) => setPrd(e.target.value)} className="w-full min-h-[560px] resize-y font-mono text-[12.5px] leading-6 outline-none" />
                ) : (
                  <Markdown src={prd} />
                )}
              </Card>
            </div>
          </div>
          <aside className="px-5 py-8 space-y-5 bg-paper-2/50">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-ink-4">What I heard</div>
              <div className="mt-3 space-y-2 text-[13px]">
                {questions.map((qq) => (
                  <div key={qq.id} className="rounded-lg border border-line bg-white p-2.5">
                    <div className="text-[11.5px] text-ink-4">{qq.q}</div>
                    <div className="mt-0.5 text-ink-2">{Array.isArray(answers[qq.id]) ? (answers[qq.id] as string[]).join(", ") : (answers[qq.id] as string)}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => { setStep("discover"); setQi(0); }} className="mt-2 text-[12.5px] text-bp hover:underline">Change answers</button>
            </div>
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-ink-4">Ask for a change</div>
              <textarea
                value={change}
                onChange={(e) => setChange(e.target.value)}
                rows={3}
                placeholder="e.g. Students should also see a leaderboard"
                className="mt-2 w-full rounded-lg border border-line bg-white p-2.5 text-[13px] outline-none focus:border-bp"
              />
              <Button size="sm" className="mt-2" icon={<Wand2 className="h-3.5 w-3.5" />} onClick={applyChange} disabled={!change.trim()}>Update PRD</Button>
            </div>
            <Button variant="primary" size="lg" className="w-full" onClick={() => setStep("specs")}>
              Approve PRD → specs <ArrowRight className="h-4 w-4" />
            </Button>
          </aside>
        </div>
      )}

      {step === "specs" && spec && (
        <div className="flex-1 grid lg:grid-cols-[1fr_320px] animate-in">
          <div className="px-4 sm:px-8 py-8 overflow-y-auto">
            <div className="mx-auto max-w-4xl">
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1">
                  <input value={spec.appName} onChange={(e) => setSpec({ ...spec, appName: e.target.value })} className="bg-transparent text-[26px] font-semibold tracking-tight outline-none border-b border-transparent hover:border-line focus:border-bp" />
                  <input value={spec.tagline} onChange={(e) => setSpec({ ...spec, tagline: e.target.value })} className="block w-full bg-transparent text-[14px] text-ink-3 outline-none mt-1" />
                </div>
              </div>

              <SpecSection icon={Bot} title="Agents" hint="Each agent can be tested and swapped on its own. They run mocked until you wire them up.">
                <div className="grid gap-3 md:grid-cols-2">
                  {spec.agents.map((a, i) => (
                    <AgentCard key={a.id} a={a} idx={i} onChange={(na) => setSpec({ ...spec, agents: spec.agents.map((x) => (x.id === a.id ? na : x)) })} onRemove={() => setSpec({ ...spec, agents: spec.agents.filter((x) => x.id !== a.id) })} />
                  ))}
                  <button
                    onClick={() => {
                      const n = spec.agents.length + 1;
                      setSpec({ ...spec, agents: [...spec.agents, { id: `agent-${n}`, name: `New agent ${n}`, role: "Describe what this agent does", model: "auto", tools: [], instructions: "", framework: "lyzr" }] });
                    }}
                    className="rounded-xl border border-dashed border-line-2 p-4 text-[13px] text-ink-3 hover:border-bp/50 hover:text-ink flex items-center justify-center gap-2 min-h-[120px]"
                  >
                    <Plus className="h-4 w-4" /> Add agent
                  </button>
                </div>
              </SpecSection>

              <SpecSection icon={LayoutGrid} title="Pages" hint="The screens users will see.">
                <div className="rounded-xl border border-line bg-white divide-y divide-line">
                  {spec.pages.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2">
                      <input value={p.name} onChange={(e) => setSpec({ ...spec, pages: spec.pages.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} className="w-36 text-[13.5px] font-medium outline-none" />
                      <code className="font-mono text-[12px] text-ink-4 w-32">{p.route}</code>
                      <input value={p.purpose} onChange={(e) => setSpec({ ...spec, pages: spec.pages.map((x, j) => (j === i ? { ...x, purpose: e.target.value } : x)) })} className="flex-1 text-[13px] text-ink-3 outline-none" />
                      <button onClick={() => setSpec({ ...spec, pages: spec.pages.filter((_, j) => j !== i) })} className="text-ink-4 hover:text-bad" aria-label="Remove page"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => setSpec({ ...spec, pages: [...spec.pages, { name: "New page", route: `/page-${spec.pages.length}`, purpose: "What is this page for?" }] })} className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-ink-3 hover:text-ink">
                    <Plus className="h-3.5 w-3.5" /> Add page
                  </button>
                </div>
              </SpecSection>

              <div className="grid gap-6 md:grid-cols-2">
                <SpecSection icon={Database} title="Data" hint="Tables in your managed database.">
                  <div className="space-y-2">
                    {spec.data.map((t) => (
                      <div key={t.name} className="rounded-xl border border-line bg-white p-3">
                        <div className="font-mono text-[12.5px] font-medium">{t.name}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {t.fields.map((f) => (
                            <span key={f.name} className="rounded-md bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-3">{f.name}<span className="text-ink-4">:{f.type}</span></span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </SpecSection>
                <SpecSection icon={Plug} title="Integrations" hint="Connected when you wire up the app.">
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set([...preset.integrations, ...spec.integrations])).map((i) => {
                      const on = spec.integrations.includes(i);
                      return (
                        <button key={i} onClick={() => setSpec({ ...spec, integrations: on ? spec.integrations.filter((x) => x !== i) : [...spec.integrations, i] })} className={cn("flex items-center gap-1.5 rounded-lg border px-3 h-8 text-[13px]", on ? "border-bp bg-bp-soft/60 text-bp-2" : "border-line bg-white text-ink-3")}>
                          {on && <Check className="h-3.5 w-3.5" />} {i}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[12.5px] text-ink-3">
                    <input type="checkbox" checked={spec.auth} onChange={(e) => setSpec({ ...spec, auth: e.target.checked })} className="accent-[#3452F5]" id="auth" />
                    <label htmlFor="auth">Add sign-in & user roles</label>
                  </div>
                </SpecSection>
              </div>
            </div>
          </div>
          <aside className="border-l border-line bg-paper-2/50 px-5 py-8">
            <div className="lg:sticky lg:top-20 space-y-4">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-ink-4">Build plan</div>
              <ol className="space-y-3 text-[13px]">
                {[
                  ["UI preview", `${spec.pages.length} pages with mocked agent responses`, true],
                  ["Your review", "Click anything in the preview to edit it", false],
                  ["Wire it up", `${spec.agents.length} live agents, database, API & tests`, false],
                  ["Deploy", "Security scan, preview, then production", false],
                ].map(([t, b, now], i) => (
                  <li key={i} className="flex gap-3">
                    <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-mono", now ? "bg-bp text-white" : "bg-paper-3 text-ink-4")}>{i + 1}</span>
                    <div>
                      <div className="font-medium">{t as string}</div>
                      <div className="text-[12px] text-ink-3">{b as string}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <Card className="p-3.5 space-y-2 text-[12.5px]">
                <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-ink-3"><Coins className="h-3.5 w-3.5" /> This step</span><b className="tabular-nums">~{est} credits</b></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-ink-3"><Clock className="h-3.5 w-3.5" /> Time</span><b>~1 min</b></div>
                <div className="flex items-center justify-between"><span className="text-ink-3">Balance after</span><span className="tabular-nums">{Math.round(settings.credits - est)}</span></div>
              </Card>
              <Button variant="primary" size="lg" className="w-full" disabled={!spec.agents.length || !spec.pages.length} onClick={() => createAndBuild(spec, prd, answers)}>
                Build UI preview <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep("prd")}>Back to PRD</Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function OtherInput({ onAdd }: { onAdd: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-line-2 bg-white/50 px-3 py-1.5">
      <Pencil className="h-3.5 w-3.5 text-ink-4" />
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && v.trim()) {
            onAdd(v.trim());
            setV("");
          }
        }}
        placeholder="Something else… (press Enter)"
        className="flex-1 bg-transparent py-1.5 text-[14px] outline-none placeholder:text-ink-4"
      />
    </div>
  );
}

function SpecSection({ icon: Icon, title, hint, children }: { icon: typeof Bot; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline gap-2">
        <Icon className="h-4 w-4 text-bp self-center" />
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <span className="text-[12.5px] text-ink-4">{hint}</span>
      </div>
      {children}
    </section>
  );
}

function AgentCard({ a, idx, onChange, onRemove }: { a: AgentSpec; idx: number; onChange: (a: AgentSpec) => void; onRemove: () => void }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3.5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-bp-soft font-mono text-[11px] text-bp-2">{idx + 1}</span>
          <input value={a.name} onChange={(e) => onChange({ ...a, name: e.target.value })} className="min-w-0 flex-1 text-[14px] font-medium outline-none" />
        </div>
        <button onClick={onRemove} className="text-ink-4 hover:text-bad" aria-label="Remove agent"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      <Input value={a.role} onChange={(e) => onChange({ ...a, role: e.target.value })} className="mt-2 !h-8 !text-[12.5px]" />
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {a.tools.map((t) => (
            <span key={t} className="rounded-md bg-paper-2 px-1.5 py-0.5 font-mono text-[10.5px] text-ink-3">{t}</span>
          ))}
          {!a.tools.length && <span className="text-[11.5px] text-ink-4">No tools</span>}
        </div>
        <select value={a.model} onChange={(e) => onChange({ ...a, model: e.target.value })} className="rounded-md border border-line bg-white px-1.5 h-7 text-[12px] outline-none" title="Model">
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function NewPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
