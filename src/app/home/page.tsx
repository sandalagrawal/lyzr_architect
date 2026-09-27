"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, LayoutTemplate, Sparkles, Paperclip, MoreHorizontal, Trash2, GitBranch, Globe, Bot, Zap, ListChecks, FolderUp, Lightbulb, BookOpen } from "lucide-react";
import { Github } from "@/components/icons";
import { AppShell } from "@/components/AppShell";
import { Consultant } from "@/components/Consultant";
import { PROMPT_LIBRARY } from "@/lib/catalog";
import { Badge, Button, Card, Segmented, Switch, cn, toast } from "@/components/ui";
import { useStore } from "@/lib/store";
import { TEMPLATES, MODELS } from "@/lib/presets";
import { timeAgo } from "@/lib/generate";
import { sampleProject } from "@/lib/sample";
import type { Project } from "@/lib/types";

const STAGE: Record<Project["stage"], { label: string; tone: "neutral" | "bp" | "ok" | "warn" }> = {
  planning: { label: "Planning", tone: "neutral" },
  ui: { label: "UI preview", tone: "warn" },
  wired: { label: "Agents live", tone: "bp" },
  deployed: { label: "Deployed", tone: "ok" },
};

export default function HomePage() {
  const router = useRouter();
  const { user, projects, saveProject, deleteProject, settings } = useStore();
  const [tab, setTab] = useState<"describe" | "ideas" | "import" | "template">("describe");
  const [prompt, setPrompt] = useState("");
  const [planFirst, setPlanFirst] = useState(true);
  const [model, setModel] = useState(settings.builderModel);
  const [menu, setMenu] = useState<string | null>(null);

  function go(p = prompt) {
    if (!p.trim()) return;
    router.push(`/new?prompt=${encodeURIComponent(p.trim())}${planFirst ? "" : "&quick=1"}`);
  }

  function openSample(key: string) {
    const login = (user?.name || "you").toLowerCase().replace(/\s+/g, "");
    const p = sampleProject(key, login);
    saveProject(p);
    router.push(`/project/${p.id}`);
  }

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div id="new" className="text-center">
          <h1 className="text-[30px] font-semibold tracking-tight">{greet}, {user?.name.split(" ")[0]}. What are we building?</h1>
          <p className="mt-1.5 text-[14px] text-ink-3">Describe an app, bring a repo, or start from a template.</p>
        </div>

        <div className="mx-auto mt-7 max-w-3xl">
          <div className="flex justify-center mb-3">
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: "describe", label: <><Sparkles className="h-3.5 w-3.5" /> Describe</> },
                { value: "ideas", label: <><Lightbulb className="h-3.5 w-3.5" /> Get ideas</> },
                { value: "import", label: <><Github className="h-3.5 w-3.5" /> Import</> },
                { value: "template", label: <><LayoutTemplate className="h-3.5 w-3.5" /> Template</> },
              ]}
            />
          </div>

          {tab === "describe" && (
            <div className="rounded-2xl border border-line bg-white p-2 shadow-pop focus-within:border-bp/50 animate-in">
              <textarea
                autoFocus
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    go();
                  }
                }}
                rows={3}
                placeholder="e.g. An app where CA students upload mock answer sheets and get marks plus mentor-style feedback…"
                className="w-full resize-none bg-transparent px-3 pt-2 text-[15px] outline-none placeholder:text-ink-4"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1">
                  <button onClick={() => toast("Attach a PRD, screenshot or Figma export — we'll use it as context", "info")} className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12.5px] text-ink-3 hover:bg-paper-2">
                    <Paperclip className="h-3.5 w-3.5" /> Attach
                  </button>
                  <label className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12.5px] text-ink-3 hover:bg-paper-2 cursor-pointer" title="Builder model">
                    <Zap className="h-3.5 w-3.5" />
                    <select value={model} onChange={(e) => setModel(e.target.value)} className="bg-transparent outline-none cursor-pointer">
                      {MODELS.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </label>
                  <div className="flex h-8 items-center gap-2 rounded-lg px-2 text-[12.5px] text-ink-3" title="Plan first: discovery questions + PRD before any code">
                    <ListChecks className="h-3.5 w-3.5" /> Plan first <Switch checked={planFirst} onChange={setPlanFirst} label="Plan first" />
                  </div>
                </div>
                <button onClick={() => go()} disabled={!prompt.trim()} className="grid h-9 w-9 place-items-center rounded-xl bg-bp text-white disabled:bg-paper-3 disabled:text-ink-4" aria-label="Start">
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {tab === "ideas" && <Consultant onPick={(p) => { setPrompt(p); setTab("describe"); }} />}

          {tab === "describe" && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              <span className="flex items-center gap-1 text-[12px] text-ink-4 mr-1"><BookOpen className="h-3.5 w-3.5" /> From the Prompt Library:</span>
              {PROMPT_LIBRARY.flatMap((c) => c.items).slice(0, 4).map((i) => (
                <button key={i.title} onClick={() => setPrompt(i.prompt)} className="rounded-full border border-line bg-white px-2.5 py-1 text-[12px] text-ink-3 hover:border-bp/40 hover:text-ink">{i.title}</button>
              ))}
              <a href="/prompts" className="text-[12px] font-medium text-bp hover:underline ml-1">Browse all →</a>
            </div>
          )}

          {tab === "import" && (
            <div className="grid gap-3 sm:grid-cols-3 animate-in">
              {[
                { icon: Github, t: "GitHub repository", b: "Pick a repo — we analyse it and keep syncing", q: "github" },
                { icon: FolderUp, t: "Upload a ZIP", b: "Any Next.js, React, Python or Node project", q: "zip" },
                { icon: GitBranch, t: "Public Git URL", b: "Paste a URL from GitHub, GitLab or Bitbucket", q: "url" },
              ].map((x) => (
                <button key={x.t} onClick={() => router.push(`/import?via=${x.q}`)} className="rounded-2xl border border-line bg-white p-5 text-left shadow-card hover:border-bp/40 hover:shadow-pop transition-all">
                  <x.icon className="h-5 w-5 text-ink-2" />
                  <div className="mt-6 text-[14px] font-medium">{x.t}</div>
                  <div className="mt-1 text-[12.5px] text-ink-3">{x.b}</div>
                </button>
              ))}
            </div>
          )}

          {tab === "template" && (
            <div className="grid gap-3 sm:grid-cols-2 animate-in">
              <a href="/marketplace" className="sm:col-span-2 flex items-center justify-between rounded-2xl border border-dashed border-bp/40 bg-bp-soft/40 px-4 py-3 text-[13px] text-bp-2 hover:bg-bp-soft">Browse community apps in the Marketplace — remix any of them <span>→</span></a>
              {TEMPLATES.map((t) => (
                <div key={t.title} className="rounded-2xl border border-line bg-white p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="text-[14px] font-medium">{t.title}</div>
                    <span className="text-[11.5px] text-ink-4">{t.uses} uses</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] text-ink-3 line-clamp-2">{t.prompt}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="dark" onClick={() => go(t.prompt)}>Customise</Button>
                    <Button size="sm" variant="ghost" onClick={() => openSample(t.preset)}>Open finished example</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-14 flex items-end justify-between">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight">Your projects</h2>
            <p className="text-[12.5px] text-ink-4 mt-0.5">{projects.length} project{projects.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        {projects.length === 0 ? (
          <Card className="mt-4 p-8 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-bp-soft text-bp"><Sparkles className="h-5 w-5" /></div>
            <div className="mt-3 text-[14.5px] font-medium">No projects yet</div>
            <p className="mt-1 text-[13px] text-ink-3">Describe an idea above, or open a finished example to explore every feature.</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="primary" onClick={() => openSample("education")}>Open example: GradeMate</Button>
              <Button onClick={() => openSample("sales")}>Open example: LeadScout</Button>
            </div>
          </Card>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const st = STAGE[p.stage];
              const live = p.deployments.find((d) => d.env === "production" && d.status === "ready");
              return (
                <div key={p.id} className="group relative rounded-2xl border border-line bg-white shadow-card hover:shadow-pop hover:border-line-2 transition-all">
                  <Link href={`/project/${p.id}`} className="block">
                    <div className="h-28 rounded-t-2xl border-b border-line overflow-hidden relative" style={{ background: p.theme.dark ? "#0f1115" : "#F3F3F0" }}>
                      <div className="absolute left-4 top-4 right-4 bottom-0 rounded-t-lg border border-line/60 bg-white/90 p-2.5" style={p.theme.dark ? { background: "#171a21", borderColor: "#252a33" } : {}}>
                        <div className="h-2 w-16 rounded" style={{ background: p.theme.accent }} />
                        <div className="mt-2 grid grid-cols-4 gap-1.5">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-5 rounded" style={{ background: p.theme.dark ? "#232833" : "#F3F3F0" }} />
                          ))}
                        </div>
                        <div className="mt-1.5 h-8 rounded" style={{ background: p.theme.dark ? "#232833" : "#F3F3F0" }} />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-[14px] font-medium">{p.name}</div>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11.5px] text-ink-4">
                        <span className="flex items-center gap-1"><Bot className="h-3 w-3" /> {p.spec.agents.length} agents</span>
                        {p.github && <span className="flex items-center gap-1 truncate"><Github className="h-3 w-3" /> {p.github.repo}</span>}
                        {live && <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> live</span>}
                      </div>
                      <div className="mt-2 text-[11.5px] text-ink-4">Edited {timeAgo(p.updatedAt)}</div>
                    </div>
                  </Link>
                  <button onClick={() => setMenu(menu === p.id ? null : p.id)} className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg bg-white/90 border border-line opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Project menu">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menu === p.id && (
                    <div className="absolute right-3 top-11 z-10 w-40 rounded-xl border border-line bg-white p-1 shadow-pop animate-in">
                      <button
                        onClick={() => {
                          deleteProject(p.id);
                          setMenu(null);
                          toast(`Deleted ${p.name}`);
                        }}
                        className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-[13px] text-bad hover:bg-bad-soft"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete project
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={() => openSample("education")} className="rounded-2xl border border-dashed border-line-2 p-4 text-[13px] text-ink-3 hover:border-bp/50 hover:text-ink min-h-[200px] flex flex-col items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" /> Add a finished example project
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

