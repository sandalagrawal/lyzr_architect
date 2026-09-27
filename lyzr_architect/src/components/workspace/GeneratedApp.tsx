"use client";
import { useState } from "react";
import { Search, Bell, LogIn, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import type { Project } from "@/lib/types";
import { presetFor } from "@/lib/generate";
import { Markdown } from "@/lib/md";
import { mockAgentReply, runAgent, sleep } from "@/lib/client";
import { useStore } from "@/lib/store";

export interface EditTarget { key: string; label: string; kind: "text" | "button" | "color" }

type Result = { title: string; meta: string; body: string; score: number; tag: string; md?: boolean };

/** The "generated" end-user app rendered inside the preview frame. */
export function GeneratedApp({
  project,
  route,
  setRoute,
  editMode,
  selected,
  onSelect,
  buildProgress = 1,
  compact,
}: {
  project: Project;
  route: string;
  setRoute: (r: string) => void;
  editMode: boolean;
  selected?: string | null;
  onSelect: (t: EditTarget) => void;
  buildProgress?: number;
  compact?: boolean;
}) {
  const { settings, spendCredits } = useStore();
  const s = project.spec;
  const preset = presetFor(s.domain);
  const t = project.theme;
  const c = project.content;
  const live = project.stage === "wired" || project.stage === "deployed";
  const [input, setInput] = useState("");
  const [running, setRunning] = useState<number>(-1);
  const [extra, setExtra] = useState<Result[]>([]);

  const dark = t.dark;
  const bg = t.bg || (dark ? "#0f1115" : "#ffffff");
  const panel = dark ? "#161a21" : "#f7f7f5";
  const border = dark ? "#262b35" : "#e7e6e1";
  const text = t.text || (dark ? "#e8eaee" : "#15171c");
  const sub = dark ? "#9aa1ad" : "#6b707a";
  const fontFamily = t.font === "mono" ? "var(--font-mono)" : t.font === "serif" ? "Georgia, serif" : "var(--font-sans)";
  const r = t.radius;

  const txt = (key: string, fallback: string) => c[key] ?? fallback;
  const editable = (key: string, label: string, kind: EditTarget["kind"] = "text") =>
    editMode
      ? {
          "data-edit": key,
          "data-selected": selected === key ? "true" : undefined,
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect({ key, label, kind });
          },
        }
      : {};

  const accent = c["style.accent"] || t.accent;
  const show = (threshold: number) => buildProgress >= threshold;
  const Skel = ({ h }: { h: number }) => <div className="animate-pulse" style={{ height: h, borderRadius: r, background: panel }} />;

  async function run() {
    if (!input.trim() || running >= 0) return;
    const q = input.trim();
    for (let i = 0; i < s.agents.length; i++) {
      setRunning(i);
      await sleep(live ? 250 : 650);
    }
    let body = "";
    let md = false;
    if (live) {
      const pipeline = { name: s.appName + " pipeline", role: s.agents.map((a) => a.name).join(" → "), instructions: s.agents.map((a) => `${a.name}: ${a.instructions}`).join(" "), tools: s.agents.flatMap((a) => a.tools) };
      const res = await runAgent(pipeline, q, settings, project.id);
      body = res.live && res.response ? res.response : mockAgentReply({ name: s.agents[s.agents.length - 1]?.name || "Agent", role: "" }, q);
      md = true;
      spendCredits(1.2);
    } else {
      body = `Mocked response — ${s.agents.map((a) => a.name).join(" → ")} will run for real after you wire up the app.`;
    }
    setExtra((x) => [{ title: q.length > 48 ? q.slice(0, 48) + "…" : q, meta: live ? "Just now · live agents" : "Just now · mocked", body, score: live ? 88 : 0, tag: live ? "New" : "Mock", md }, ...x]);
    setInput("");
    setRunning(-1);
  }

  const nav = s.pages.filter((p) => p.route !== "/login");
  const page = s.pages.find((p) => p.route === route) || s.pages[0];
  const results: Result[] = [...extra, ...preset.sample.results];

  if (route === "/login") {
    return (
      <div style={{ background: panel, color: text, fontFamily, minHeight: "100%" }} className="grid place-items-center p-8">
        <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: r + 4 }} className="w-full max-w-sm p-7 shadow-sm">
          <div className="flex items-center gap-2 font-semibold"><span className="h-6 w-6 rounded-md" style={{ background: accent }} /> {s.appName}</div>
          <div className="mt-6 text-[20px] font-semibold" {...editable("login.title", "Sign-in title")}>{txt("login.title", "Sign in to continue")}</div>
          <div className="mt-5 space-y-2.5">
            <div className="flex h-10 items-center justify-center gap-2 text-[13px]" style={{ border: `1px solid ${border}`, borderRadius: r }}>Continue with Google</div>
            <div className="flex h-10 items-center px-3 text-[13px]" style={{ border: `1px solid ${border}`, borderRadius: r, color: sub }}>you@company.com</div>
            <div className="flex h-10 items-center justify-center gap-2 text-[13px] text-white font-medium" style={{ background: accent, borderRadius: r }}><LogIn className="h-4 w-4" /> Sign in</div>
          </div>
          <button onClick={() => setRoute("/")} className="mt-5 text-[12px]" style={{ color: sub }}>← Back to app (preview only)</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: bg, color: text, fontFamily, minHeight: "100%" }} className="flex text-[13px]">
      {!compact && (
        <aside style={{ borderRight: `1px solid ${border}`, background: panel }} className="w-48 shrink-0 p-3 hidden sm:block">
          {show(0.15) ? (
            <>
              <div className="flex items-center gap-2 px-1.5 font-semibold text-[14px]" {...editable("brand.name", "App name")}>
                <span className="h-5 w-5" style={{ background: accent, borderRadius: Math.min(r, 8) }} /> {txt("brand.name", s.appName)}
              </div>
              <nav className="mt-5 space-y-0.5">
                {nav.map((p) => (
                  <button key={p.route} onClick={() => !editMode && setRoute(p.route)} className="w-full text-left px-2 py-1.5 text-[12.5px]" style={{ borderRadius: r - 2, background: page.route === p.route ? (dark ? "#232833" : "#ebeae6") : "transparent", fontWeight: page.route === p.route ? 600 : 400 }}>
                    {p.name}
                  </button>
                ))}
              </nav>
            </>
          ) : (
            <div className="space-y-2"><Skel h={20} /><Skel h={14} /><Skel h={14} /><Skel h={14} /></div>
          )}
        </aside>
      )}
      <main className="flex-1 min-w-0">
        <div style={{ borderBottom: `1px solid ${border}` }} className="flex h-12 items-center justify-between px-5">
          <div className="flex items-center gap-2 text-[12px]" style={{ color: sub }}>
            <Search className="h-3.5 w-3.5" /> Search
          </div>
          <div className="flex items-center gap-3" style={{ color: sub }}>
            <Bell className="h-3.5 w-3.5" />
            <div className="h-6 w-6 rounded-full" style={{ background: accent, opacity: 0.8 }} />
          </div>
        </div>
        <div className="p-5 sm:p-6 space-y-5">
          {page.route === "/" || page === s.pages[0] ? (
            <>
              {show(0.3) ? (
                <div>
                  <h1 className="text-[22px] font-semibold tracking-tight" {...editable("hero.title", "Page title")}>{txt("hero.title", s.appName)}</h1>
                  <p className="mt-1" style={{ color: sub }} {...editable("hero.sub", "Subtitle")}>{txt("hero.sub", s.tagline)}</p>
                </div>
              ) : (
                <div className="space-y-2"><Skel h={26} /><Skel h={14} /></div>
              )}
              {show(0.45) ? (
                <div style={{ border: `1px solid ${border}`, borderRadius: r + 2, background: panel }} className="p-4">
                  <div className="text-[12.5px] font-medium" {...editable("run.label", "Input label")}>{txt("run.label", preset.sample.inputLabel)}</div>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && run()}
                      placeholder={txt("run.placeholder", preset.sample.placeholder)}
                      style={{ border: `1px solid ${border}`, borderRadius: r, background: bg, color: text }}
                      className="h-9 flex-1 px-3 outline-none text-[13px]"
                      disabled={editMode}
                    />
                    <button onClick={run} style={{ background: accent, borderRadius: r }} className="h-9 px-4 text-white text-[13px] font-medium flex items-center gap-1.5" {...editable("run.cta", "Primary button", "button")}>
                      {running >= 0 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {txt("run.cta", preset.sample.cta)}
                    </button>
                  </div>
                  {running >= 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11.5px]">
                      {s.agents.map((a, i) => (
                        <span key={a.id} className="flex items-center gap-1 px-2 py-1" style={{ borderRadius: 99, background: i < running ? (dark ? "#17301f" : "#e6f5ec") : i === running ? (dark ? "#1d2440" : "#edf0ff") : "transparent", color: i <= running ? text : sub, border: `1px solid ${border}` }}>
                          {i < running ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : i === running ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                          {a.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Skel h={92} />
              )}
              {show(0.6) ? (
                <div className={compact ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 lg:grid-cols-4 gap-3"}>
                  {preset.sample.stats.map((st, i) => (
                    <div key={st.label} style={{ border: `1px solid ${border}`, borderRadius: r }} className="p-3">
                      <div className="text-[11.5px]" style={{ color: sub }}>{st.label}</div>
                      <div className="mt-1 text-[20px] font-semibold tabular-nums" style={i === 0 ? { color: accent } : {}}>{st.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3"><Skel h={62} /><Skel h={62} /><Skel h={62} /><Skel h={62} /></div>
              )}
              {show(0.8) ? (
                <div>
                  <div className="mb-2 text-[13px] font-semibold" {...editable("results.title", "Section title")}>{txt("results.title", preset.sample.resultTitle)}</div>
                  <div style={{ border: `1px solid ${border}`, borderRadius: r + 2 }} className="divide-y" >
                    {results.map((x, i) => (
                      <div key={i} className="flex items-start gap-3 p-3.5" style={{ borderColor: border }}>
                        <div className="grid h-9 w-9 shrink-0 place-items-center text-[12px] font-semibold tabular-nums" style={{ borderRadius: r, background: x.score >= 70 ? (dark ? "#17301f" : "#e6f5ec") : x.score >= 45 ? (dark ? "#332512" : "#fef3e2") : x.score > 0 ? (dark ? "#3a1a1c" : "#fdecec") : panel, color: x.score >= 70 ? "#138a4b" : x.score >= 45 ? "#b45309" : x.score > 0 ? "#d93a40" : sub }}>
                          {x.score || "—"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{x.title}</span>
                            <span className="px-1.5 py-0.5 text-[10.5px]" style={{ borderRadius: 6, background: panel, color: sub }}>{x.tag}</span>
                          </div>
                          <div className="text-[11.5px]" style={{ color: sub }}>{x.meta}</div>
                          {x.md ? <Markdown src={x.body} className="mt-1 text-[12.5px] [&_*]:!text-inherit [&_code]:!bg-transparent" /> : <div className="mt-1 text-[12.5px]" style={{ color: dark ? "#c5cad3" : "#3b3f47" }}>{x.body}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2"><Skel h={56} /><Skel h={56} /><Skel h={56} /></div>
              )}
            </>
          ) : (
            <SubPage project={project} pageName={page.name} purpose={page.purpose} border={border} sub={sub} r={r} accent={accent} panel={panel} />
          )}
        </div>
      </main>
    </div>
  );
}

function SubPage({ project, pageName, purpose, border, sub, r, accent, panel }: { project: Project; pageName: string; purpose: string; border: string; sub: string; r: number; accent: string; panel: string }) {
  const preset = presetFor(project.spec.domain);
  const table = project.spec.data[0];
  const cols = table ? table.fields.filter((f) => f.name !== "id").slice(0, 4) : [];
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">{pageName}</h1>
          <p className="mt-0.5 text-[12.5px]" style={{ color: sub }}>{purpose}</p>
        </div>
        <div className="h-8 px-3 text-white text-[12.5px] font-medium flex items-center" style={{ background: accent, borderRadius: r }}>New</div>
      </div>
      {pageName.toLowerCase().includes("setting") ? (
        <div className="mt-5 space-y-3 max-w-lg">
          {["Workspace name", "Default tone", "Notification email"].map((l) => (
            <div key={l}>
              <div className="text-[12px] mb-1" style={{ color: sub }}>{l}</div>
              <div className="h-9 px-3 flex items-center text-[12.5px]" style={{ border: `1px solid ${border}`, borderRadius: r }}>—</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden" style={{ border: `1px solid ${border}`, borderRadius: r + 2 }}>
          <div className="grid text-[11.5px] font-medium px-3 py-2" style={{ gridTemplateColumns: `repeat(${cols.length || 1}, minmax(0,1fr))`, background: panel, color: sub }}>
            {cols.map((cc) => (
              <div key={cc.name}>{cc.name}</div>
            ))}
          </div>
          {preset.sample.results.map((row, i) => (
            <div key={i} className="grid px-3 py-2.5 text-[12.5px]" style={{ gridTemplateColumns: `repeat(${cols.length || 1}, minmax(0,1fr))`, borderTop: `1px solid ${border}` }}>
              {cols.map((cc, j) => (
                <div key={cc.name} className="truncate pr-2">{j === 0 ? row.title : cc.type === "int" ? row.score : cc.name === "status" ? row.tag : j === 1 ? row.meta : "…"}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
