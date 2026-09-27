"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUp, Sparkles, Bot, ShieldCheck, GitBranch, Rocket, MessageSquare, LayoutGrid, Code2, FileText, Paperclip, Check } from "lucide-react";
import { Github } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { Button, Segmented, cn } from "@/components/ui";
import { useStore } from "@/lib/store";
import { TEMPLATES } from "@/lib/presets";
import type { Depth } from "@/lib/types";

const PLACEHOLDERS = [
  "An app that evaluates CA mock papers and gives mentor-style feedback…",
  "A lead research tool that scores companies and drafts outreach…",
  "A support inbox that drafts replies from our help center…",
];

export default function Landing() {
  const router = useRouter();
  const { user, ready } = useStore();
  const [prompt, setPrompt] = useState("");
  const [ph, setPh] = useState(0);
  const [depth, setDepth] = useState<Depth>("outcome");

  useEffect(() => {
    const t = setInterval(() => setPh((x) => (x + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  function start(p = prompt) {
    if (!p.trim()) return;
    try {
      sessionStorage.setItem("a2.pendingPrompt", p.trim());
    } catch {}
    router.push(user ? `/new?prompt=${encodeURIComponent(p.trim())}` : "/login?next=new");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6 text-[13.5px] text-ink-3">
              <a href="#depths" className="hover:text-ink">Product</a>
              <a href="#flow" className="hover:text-ink">How it works</a>
              <a href="#agents" className="hover:text-ink">Agents</a>
              <a href="#templates" className="hover:text-ink">Templates</a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {ready && user ? (
              <Button variant="dark" onClick={() => router.push("/home")}>Open dashboard <ArrowRight className="h-3.5 w-3.5" /></Button>
            ) : (
              <>
                <Link href="/login" className="text-[13.5px] text-ink-2 hover:text-ink px-2">Sign in</Link>
                <Button variant="dark" onClick={() => router.push("/login")}>Start building</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-paper [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[12px] text-ink-3 shadow-card">
            <span className="h-1.5 w-1.5 rounded-full bg-bp" /> Now with Code mode, Agent Library & GitHub two-way sync
          </div>
          <h1 className="mt-6 text-[44px] sm:text-[56px] font-semibold leading-[1.05] tracking-[-0.035em]">
            Build agentic apps
            <br />
            <span className="text-bp">at the depth you want.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16.5px] leading-relaxed text-ink-3">
            Describe it, shape it, or code it. One project with three views — so founders and engineers can build the same app, together.
          </p>

          <div className="mx-auto mt-9 max-w-2xl text-left">
            <div className="rounded-2xl border border-line bg-white p-2 shadow-pop focus-within:border-bp/60 transition-colors">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    start();
                  }
                }}
                rows={3}
                placeholder={PLACEHOLDERS[ph]}
                className="w-full resize-none bg-transparent px-3 pt-2 text-[15px] outline-none placeholder:text-ink-4"
              />
              <div className="flex items-center justify-between px-1 pb-0.5">
                <div className="flex items-center gap-1">
                  <button className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12.5px] text-ink-3 hover:bg-paper-2" title="Attach a PRD, screenshot or Figma export">
                    <Paperclip className="h-3.5 w-3.5" /> Attach
                  </button>
                  <button onClick={() => router.push(user ? "/import" : "/login?next=import")} className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12.5px] text-ink-3 hover:bg-paper-2">
                    <Github className="h-3.5 w-3.5" /> Import a repo
                  </button>
                </div>
                <button
                  onClick={() => start()}
                  disabled={!prompt.trim()}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-bp text-white disabled:bg-paper-3 disabled:text-ink-4 transition-colors"
                  aria-label="Start"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {TEMPLATES.map((t) => (
                <button key={t.title} onClick={() => setPrompt(t.prompt)} className="rounded-full border border-line bg-white/70 px-3 py-1 text-[12.5px] text-ink-3 hover:border-bp/50 hover:text-ink">
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Depths */}
      <section id="depths" className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.35fr] items-center">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-bp">One project, three depths</p>
            <h2 className="mt-3 text-[32px] font-semibold tracking-tight leading-tight">Everyone sees the same app — at the level of detail they want.</h2>
            <p className="mt-4 text-[15px] text-ink-3 leading-relaxed">
              The split isn&apos;t technical vs. non-technical. It&apos;s how much control you want <em>right now</em>. Flip the depth switch any time — every view reads and writes the same Git repo, so nothing ever falls out of sync.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { d: "outcome" as Depth, icon: MessageSquare, t: "Outcome", b: "Chat and a live, clickable preview. Changes explained in plain English." },
                { d: "blueprint" as Depth, icon: LayoutGrid, t: "Blueprint", b: "Pages, agents, data and integrations as editable cards." },
                { d: "code" as Depth, icon: Code2, t: "Code", b: "A full IDE: file tree, editor, terminal, diffs, branches and PRs." },
              ].map((x) => (
                <button
                  key={x.d}
                  onClick={() => setDepth(x.d)}
                  className={cn("flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all", depth === x.d ? "border-bp/40 bg-white shadow-card" : "border-transparent hover:bg-white/60")}
                >
                  <div className={cn("mt-0.5 grid h-8 w-8 place-items-center rounded-lg", depth === x.d ? "bg-bp text-white" : "bg-paper-3 text-ink-3")}>
                    <x.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium">{x.t}</div>
                    <div className="text-[13px] text-ink-3">{x.b}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <DepthDemo depth={depth} setDepth={setDepth} />
        </div>
      </section>

      {/* Flow */}
      <section id="flow" className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-bp">From idea to production</p>
          <h2 className="mt-3 text-[28px] font-semibold tracking-tight">Plan first. Build in the open. Ship with confidence.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {[
              { icon: Sparkles, t: "Discover", b: "An AI consultant asks the 5 questions that matter." },
              { icon: FileText, t: "PRD & specs", b: "An editable PRD, plus pages, agents and data you approve." },
              { icon: LayoutGrid, t: "UI preview", b: "Click anything in the preview to edit it. Agents are mocked." },
              { icon: Bot, t: "Wire it up", b: "Real agents, database and APIs replace the mocks." },
              { icon: Rocket, t: "Deploy", b: "Security scan → preview → production. Roll back in one click." },
            ].map((s, i) => (
              <div key={s.t} className="relative rounded-xl border border-line bg-paper p-4">
                <div className="flex items-center justify-between">
                  <s.icon className="h-4.5 w-4.5 h-[18px] w-[18px] text-bp" />
                  <span className="font-mono text-[11px] text-ink-4">0{i + 1}</span>
                </div>
                <div className="mt-4 text-[14px] font-medium">{s.t}</div>
                <div className="mt-1 text-[12.5px] text-ink-3 leading-relaxed">{s.b}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-line-2 px-4 py-3 text-[13px] text-ink-3">
            <GitBranch className="h-4 w-4 text-ink-4" /> Every step is a Git commit from minute one — shown as <b className="font-medium text-ink-2">History</b> in Outcome mode and as <b className="font-medium text-ink-2">commits & branches</b> in Code mode.
          </div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Bot, t: "Agents you can see into", b: "A visual pipeline, a test console with step-by-step traces, and a model picker per agent. Export to Lyzr, LangGraph, CrewAI or the OpenAI Agents SDK." },
            { icon: LayoutGrid, t: "An Agent Library", b: "Publish any agent with a version. Pull it into another app as a plugin — via the SDK, a REST endpoint or MCP." },
            { icon: ShieldCheck, t: "Safe by default", b: "Every project runs in its own sandbox. Deploys are gated by a scan for leaked secrets, open routes, PII and prompt injection." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <c.icon className="h-5 w-5 text-bp" />
              <div className="mt-4 text-[16px] font-semibold tracking-tight">{c.t}</div>
              <p className="mt-2 text-[13.5px] text-ink-3 leading-relaxed">{c.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="templates" className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-2xl bg-ink text-white p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-[26px] font-semibold tracking-tight">Start from a prompt, a template, or your repo.</h3>
            <p className="mt-2 text-white/60 text-[14px]">Free to start. Your code is always yours — synced to your GitHub.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="lg" onClick={() => router.push(user ? "/home" : "/login")}>Start building</Button>
            <Button size="lg" className="!bg-white/10 !text-white !border-white/15" icon={<Github className="h-4 w-4" />} onClick={() => router.push(user ? "/import" : "/login?next=import")}>
              Import repo
            </Button>
          </div>
        </div>
        <p className="mt-8 text-center text-[12px] text-ink-4">Architect 2.0 concept — built as a product assignment for Lyzr AI.</p>
      </section>
    </div>
  );
}

function DepthDemo({ depth, setDepth }: { depth: Depth; setDepth: (d: Depth) => void }) {
  return (
    <div className="rounded-2xl border border-line bg-white shadow-pop overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-3 h-11 bg-paper/60">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <span className="h-2 w-2 rounded-full bg-ok" /> GradeMate
        </div>
        <Segmented
          size="sm"
          value={depth}
          onChange={setDepth}
          options={[
            { value: "outcome", label: "Outcome" },
            { value: "blueprint", label: "Blueprint" },
            { value: "code", label: "Code" },
          ]}
        />
      </div>
      <div className="h-[340px] relative">
        {depth === "outcome" && (
          <div className="absolute inset-0 grid grid-cols-[1fr_200px] animate-in">
            <div className="p-4 bg-paper-2">
              <div className="h-full rounded-lg bg-white border border-line p-4">
                <div className="text-[15px] font-semibold">Evaluate a paper</div>
                <div className="mt-3 h-9 rounded-md border border-line bg-paper px-3 text-[12px] text-ink-4 flex items-center">Upload answer sheet…</div>
                <div className="mt-2 inline-flex h-8 items-center rounded-md bg-bp px-3 text-[12px] text-white">Evaluate</div>
                <div className="mt-4 space-y-2">
                  {["Rohan S. — Mock 3 · 64", "Meera K. — Mock 2 · 71", "Arjun P. — Mock 1 · 38"].map((r) => (
                    <div key={r} className="rounded-md border border-line px-3 py-2 text-[12px]">{r}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-l border-line p-3 text-[12px] space-y-2">
              <div className="ml-6 rounded-lg bg-ink text-white px-2.5 py-1.5">Make the scores colour-coded</div>
              <div className="rounded-lg bg-paper-2 px-2.5 py-1.5 text-ink-2">Done — green ≥ 60, amber 40–59, red below. <span className="text-bp">Restore</span></div>
            </div>
          </div>
        )}
        {depth === "blueprint" && (
          <div className="absolute inset-0 p-4 grid grid-cols-3 gap-3 bg-paper-2 animate-in text-[12px]">
            {[
              { h: "Agents", items: ["Sheet Reader", "Evaluator", "Mentor Coach"] },
              { h: "Pages", items: ["Dashboard /", "Submissions", "Report card"] },
              { h: "Data", items: ["submissions", "feedback", "users"] },
            ].map((c) => (
              <div key={c.h} className="rounded-lg border border-line bg-white p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-4">{c.h}</div>
                <div className="mt-2 space-y-1.5">
                  {c.items.map((i) => (
                    <div key={i} className="rounded-md border border-line px-2 py-1.5 flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-ok" /> {i}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="col-span-3 rounded-lg border border-dashed border-bp/40 bg-bp-soft/50 p-3 text-bp-2">Sheet Reader → Evaluator → Mentor Coach · model: Auto · 3 tools</div>
          </div>
        )}
        {depth === "code" && (
          <div className="absolute inset-0 grid grid-cols-[150px_1fr] bg-ide-bg text-ide-text font-mono text-[11.5px] animate-in">
            <div className="border-r border-ide-line p-2 space-y-1 text-ide-dim">
              <div>▾ app</div>
              <div className="pl-3">page.tsx</div>
              <div>▾ agents</div>
              <div className="pl-3 text-white bg-ide-hi rounded px-1">evaluator/</div>
              <div className="pl-6">agent.yaml</div>
              <div>▾ db</div>
              <div className="pl-3">schema.sql</div>
            </div>
            <div className="p-3 leading-5">
              <div><span className="text-ide-dim">1 </span><span className="text-[#7AA2F7]">id</span>: evaluator</div>
              <div><span className="text-ide-dim">2 </span><span className="text-[#7AA2F7]">framework</span>: lyzr</div>
              <div><span className="text-ide-dim">3 </span><span className="text-[#7AA2F7]">model</span>: auto</div>
              <div><span className="text-ide-dim">4 </span><span className="text-[#7AA2F7]">tools</span>:</div>
              <div><span className="text-ide-dim">5 </span>  - knowledge.marking_scheme</div>
              <div className="mt-4 rounded border border-ide-line bg-ide-panel p-2 text-ide-dim">
                $ git log --oneline<br />
                <span className="text-[#E0AF68]">a41c9e2</span> Colour-coded scores<br />
                <span className="text-[#E0AF68]">7b02d11</span> Wire Evaluator to Lyzr
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
