"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Files, Search, GitBranch, FlaskConical, ChevronRight, ChevronDown, FileCode2, FileJson, FileText, Folder, X, Plus, GitPullRequest, Check, Terminal as TermIcon, AlertTriangle, ScrollText, Play, Circle, Upload } from "lucide-react";
import type { Project } from "@/lib/types";
import { cn, Modal, Button, toast } from "@/components/ui";
import { generateFiles } from "@/lib/generate";

/* ---------------- highlighting ---------------- */
const KW = /\b(import|from|export|default|function|return|const|let|var|async|await|if|else|for|of|in|new|type|interface|extends|true|false|null|undefined|create|table|primary|key|references|alter|enable|row|level|security|select|describe|it|expect)\b/g;
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function highlight(code: string, path: string) {
  const ext = path.split(".").pop() || "";
  return code
    .split("\n")
    .map((line) => {
      if (ext === "md") {
        if (/^#/.test(line)) return `<span style="color:#7AA2F7;font-weight:600">${esc(line)}</span>`;
        return esc(line).replace(/(\*\*[^*]+\*\*)/g, '<span style="color:#E0AF68">$1</span>').replace(/(`[^`]+`)/g, '<span style="color:#9ECE6A">$1</span>');
      }
      if (ext === "yaml" || ext === "yml" || path.startsWith(".env")) {
        if (/^\s*#/.test(line)) return `<span style="color:#565f89">${esc(line)}</span>`;
        const m = line.match(/^(\s*-?\s*)([\w.]+)(:|=)(.*)$/);
        const val = (v: string) => esc(v).replace(/(&quot;|")(.*?)("|&quot;)/g, '<span style="color:#9ECE6A">"$2"</span>');
        if (!m) return val(line);
        return `${esc(m[1])}<span style="color:#7AA2F7">${esc(m[2])}</span>${m[3]}${val(m[4])}`;
      }
      // ts/tsx/json/sql/css
      const parts: string[] = [];
      let rest = line;
      const cm = rest.match(/(\/\/.*|--.*)$/);
      let comment = "";
      if (cm && !/["'`]/.test(rest.slice(0, cm.index))) {
        comment = cm[0];
        rest = rest.slice(0, cm.index);
      }
      const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
      let last = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(rest))) {
        parts.push(esc(rest.slice(last, m.index)).replace(KW, '<span style="color:#BB9AF7">$1</span>').replace(/\b(\d+)\b/g, '<span style="color:#FF9E64">$1</span>').replace(/(&lt;\/?)([A-Z]\w*)/g, '$1<span style="color:#2AC3DE">$2</span>'));
        parts.push(`<span style="color:#9ECE6A">${esc(m[0])}</span>`);
        last = m.index + m[0].length;
      }
      parts.push(esc(rest.slice(last)).replace(KW, '<span style="color:#BB9AF7">$1</span>').replace(/\b(\d+)\b/g, '<span style="color:#FF9E64">$1</span>').replace(/(&lt;\/?)([A-Z]\w*)/g, '$1<span style="color:#2AC3DE">$2</span>'));
      if (comment) parts.push(`<span style="color:#565f89">${esc(comment)}</span>`);
      return parts.join("");
    })
    .join("\n");
}

/* ---------------- tree ---------------- */
type Node = { name: string; path: string; children?: Node[] };
function buildTree(paths: string[]): Node[] {
  const root: Node = { name: "", path: "", children: [] };
  for (const p of paths.sort()) {
    const segs = p.split("/");
    let cur = root;
    segs.forEach((seg, i) => {
      const path = segs.slice(0, i + 1).join("/");
      let n = cur.children!.find((c) => c.name === seg);
      if (!n) {
        n = { name: seg, path, children: i < segs.length - 1 ? [] : undefined };
        cur.children!.push(n);
      }
      cur = n;
    });
  }
  const sort = (ns: Node[]): Node[] =>
    ns.sort((a, b) => (a.children && !b.children ? -1 : !a.children && b.children ? 1 : a.name.localeCompare(b.name))).map((n) => (n.children ? { ...n, children: sort(n.children) } : n));
  return sort(root.children!);
}
function fileIcon(name: string) {
  if (name.endsWith(".json")) return <FileJson className="h-3.5 w-3.5 text-[#E0AF68]" />;
  if (name.endsWith(".md")) return <FileText className="h-3.5 w-3.5 text-[#7AA2F7]" />;
  if (name.endsWith(".yaml")) return <FileText className="h-3.5 w-3.5 text-[#F7768E]" />;
  if (name.endsWith(".sql")) return <FileText className="h-3.5 w-3.5 text-[#9ECE6A]" />;
  return <FileCode2 className="h-3.5 w-3.5 text-[#2AC3DE]" />;
}

/* ---------------- diff ---------------- */
function lineDiff(a: string, b: string) {
  const A = a.split("\n");
  const B = b.split("\n");
  const n = A.length,
    m = B.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: { t: " " | "+" | "-"; s: string }[] = [];
  let i = 0,
    j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      out.push({ t: " ", s: A[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ t: "-", s: A[i++] });
    else out.push({ t: "+", s: B[j++] });
  }
  while (i < n) out.push({ t: "-", s: A[i++] });
  while (j < m) out.push({ t: "+", s: B[j++] });
  return out;
}

type Side = "files" | "search" | "git" | "tests";

export function IDE({
  project,
  openRequest,
  dirty,
  setDirty,
  onSaveFile,
  onCommit,
  onBranch,
  onPR,
}: {
  project: Project;
  openRequest: { path: string; n: number } | null;
  dirty: string[];
  setDirty: (d: string[]) => void;
  onSaveFile: (path: string, content: string) => void;
  onCommit: (msg: string, files: string[], push: boolean) => void;
  onBranch: (b: string) => void;
  onPR: (title: string) => void;
}) {
  const files = useMemo(() => generateFiles(project), [project]);
  const base = useMemo(() => generateFiles({ ...project, files: {} }), [project]);
  const tree = useMemo(() => buildTree(Object.keys(files)), [files]);
  const [side, setSide] = useState<Side>("files");
  const [open, setOpen] = useState<string[]>(["app/page.tsx"]);
  const [active, setActive] = useState("app/page.tsx");
  const [diffMode, setDiffMode] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [buf, setBuf] = useState<Record<string, string>>({});
  const [panel, setPanel] = useState<"terminal" | "problems" | "output">("terminal");
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    if (!openRequest) return;
    const p = files[openRequest.path] !== undefined ? openRequest.path : Object.keys(files).find((f) => f.startsWith(openRequest.path));
    if (!p) return;
    setOpen((o) => (o.includes(p) ? o : [...o, p]));
    setActive(p);
    setDiffMode(false);
    setSide("files");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest?.n]);

  const content = buf[active] ?? files[active] ?? "";
  const unsaved = buf[active] !== undefined && buf[active] !== files[active];

  function save() {
    if (buf[active] === undefined) return;
    onSaveFile(active, buf[active]);
    if (!dirty.includes(active)) setDirty([...dirty, active]);
    setBuf((b) => {
      const n = { ...b };
      delete n[active];
      return n;
    });
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const branch = project.branch || "main";

  return (
    <div className="flex h-full flex-col bg-ide-bg text-ide-text">
      <div className="flex min-h-0 flex-1">
        {/* activity bar */}
        <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-ide-line bg-ide-panel py-2">
          {(
            [
              ["files", Files, "Explorer"],
              ["search", Search, "Search"],
              ["git", GitBranch, "Source control"],
              ["tests", FlaskConical, "Tests"],
            ] as const
          ).map(([k, Icon, label]) => (
            <button key={k} onClick={() => setSide(k)} title={label} className={cn("relative grid h-9 w-9 place-items-center rounded-md", side === k ? "text-white" : "text-ide-dim hover:text-ide-text")}>
              {side === k && <span className="absolute left-[-6px] top-1.5 bottom-1.5 w-0.5 rounded bg-bp" />}
              <Icon className="h-[18px] w-[18px]" />
              {k === "git" && dirty.length > 0 && <span className="absolute right-1 top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-bp px-1 text-[9px] text-white">{dirty.length}</span>}
            </button>
          ))}
        </div>

        {/* side panel */}
        <div className="flex w-60 shrink-0 flex-col border-r border-ide-line bg-ide-panel">
          {side === "files" && (
            <>
              <div className="flex h-9 items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider text-ide-dim">
                Explorer
                <button className="hover:text-white" title="New file" onClick={() => toast("New file — type a path in the chat or terminal", "info")}><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto scroll-thin pb-4 font-mono text-[12px]">
                <TreeView nodes={tree} depth={0} active={active} dirty={dirty} collapsed={collapsed} setCollapsed={setCollapsed} onOpen={(p) => { setOpen((o) => (o.includes(p) ? o : [...o, p])); setActive(p); setDiffMode(false); }} />
              </div>
            </>
          )}
          {side === "search" && <SearchPane files={files} onOpen={(p) => { setOpen((o) => (o.includes(p) ? o : [...o, p])); setActive(p); }} />}
          {side === "git" && (
            <GitPane
              project={project}
              dirty={dirty}
              branch={branch}
              onSelect={(p) => { setOpen((o) => (o.includes(p) ? o : [...o, p])); setActive(p); setDiffMode(true); }}
              onCommit={(msg, push) => { onCommit(msg, dirty, push); setDirty([]); setDiffMode(false); }}
              onBranch={onBranch}
              onPR={onPR}
            />
          )}
          {side === "tests" && <TestsPane project={project} />}
        </div>

        {/* editor */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-ide-line bg-ide-panel scroll-thin">
            {open.map((p) => (
              <div key={p} className={cn("group flex items-center gap-1.5 border-r border-ide-line px-3 text-[12px] cursor-pointer", p === active ? "bg-ide-bg text-white" : "text-ide-dim hover:text-ide-text")} onClick={() => setActive(p)}>
                {fileIcon(p)}
                <span className="font-mono">{p.split("/").pop()}</span>
                {dirty.includes(p) && <span className="text-[10px] text-[#E0AF68]">M</span>}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const rest = open.filter((x) => x !== p);
                    setOpen(rest);
                    if (active === p && rest.length) setActive(rest[rest.length - 1]);
                  }}
                  className="ml-1 opacity-0 group-hover:opacity-100 hover:text-white"
                >
                  {buf[p] !== undefined && buf[p] !== files[p] ? <Circle className="h-2 w-2 fill-current" /> : <X className="h-3 w-3" />}
                </button>
              </div>
            ))}
          </div>
          <div className="flex h-7 shrink-0 items-center justify-between border-b border-ide-line px-3 text-[11px] text-ide-dim font-mono">
            <span>{active.split("/").join(" › ")}</span>
            <span className="flex items-center gap-3">
              {dirty.includes(active) && (
                <button onClick={() => setDiffMode(!diffMode)} className={cn("hover:text-white", diffMode && "text-white")}>{diffMode ? "Hide diff" : "Show diff"}</button>
              )}
              {unsaved ? (
                <button onClick={save} className="text-[#E0AF68] hover:text-white">● Unsaved — ⌘S to save</button>
              ) : (
                <span>Saved</span>
              )}
            </span>
          </div>
          {open.length === 0 ? (
            <div className="grid flex-1 place-items-center text-[13px] text-ide-dim">Open a file from the explorer</div>
          ) : diffMode ? (
            <div className="flex-1 overflow-auto scroll-thin font-mono text-[12.5px] leading-[20px] py-2">
              {lineDiff(base[active] ?? "", files[active] ?? "").map((l, i) => (
                <div key={i} className={cn("px-4 whitespace-pre", l.t === "+" && "bg-[#1b3a2a] text-[#b8f0c9]", l.t === "-" && "bg-[#3a1b20] text-[#f0b8c0]")}>
                  <span className="inline-block w-4 select-none opacity-60">{l.t}</span>
                  {l.s || " "}
                </div>
              ))}
            </div>
          ) : (
            <Editor path={active} value={content} onChange={(v) => setBuf((b) => ({ ...b, [active]: v }))} />
          )}

          {/* bottom panel */}
          <div className={cn("shrink-0 border-t border-ide-line bg-ide-panel flex flex-col", panelOpen ? "h-52" : "h-8")}>
            <div className="flex h-8 shrink-0 items-center gap-4 px-3 text-[11px] uppercase tracking-wider">
              {(
                [
                  ["terminal", TermIcon, "Terminal"],
                  ["problems", AlertTriangle, "Problems"],
                  ["output", ScrollText, "Output"],
                ] as const
              ).map(([k, Icon, l]) => (
                <button key={k} onClick={() => { setPanel(k); setPanelOpen(true); }} className={cn("flex items-center gap-1.5 h-8 border-b-2", panel === k && panelOpen ? "border-bp text-white" : "border-transparent text-ide-dim hover:text-ide-text")}>
                  <Icon className="h-3 w-3" /> {l} {k === "problems" && <span className="rounded bg-ide-line px-1 normal-case">0</span>}
                </button>
              ))}
              <button onClick={() => setPanelOpen(!panelOpen)} className="ml-auto text-ide-dim hover:text-white normal-case">{panelOpen ? "▾" : "▴"}</button>
            </div>
            {panelOpen && (
              <div className="min-h-0 flex-1">
                {panel === "terminal" && <Terminal project={project} files={files} branch={branch} dirty={dirty} onBranch={onBranch} onCommit={(m) => { onCommit(m, dirty, true); setDirty([]); }} />}
                {panel === "problems" && <div className="px-4 py-2 font-mono text-[12px] text-ide-dim">No problems detected in the workspace. ✓ tsc · ✓ eslint</div>}
                {panel === "output" && (
                  <div className="overflow-y-auto h-full px-4 py-2 font-mono text-[12px] text-ide-dim space-y-0.5 scroll-thin">
                    <div>[sandbox] container sbx-{project.id.slice(2, 8)} · node 20 · 2 vCPU · 4 GB</div>
                    <div>[sandbox] network egress: allowlist (lyzr.ai, api.github.com, *.supabase.co)</div>
                    <div>[next] ready on http://0.0.0.0:3000 in 1.4s</div>
                    <div>[hmr] {Object.keys(files).length} modules compiled</div>
                    {project.stage !== "ui" && project.spec.agents.map((a) => <div key={a.id}>[agents] {a.id} loaded from agents/{a.id}/agent.yaml ({a.framework})</div>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* status bar */}
      <div className="flex h-6 shrink-0 items-center justify-between bg-bp px-3 text-[11px] text-white">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> {branch}{dirty.length ? "*" : ""}</span>
          <span>{project.github ? `↑0 ↓0 · ${project.github.repo}` : "local repo · not synced"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Sandbox ● running</span>
          <span>TypeScript</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}

function TreeView({ nodes, depth, active, dirty, collapsed, setCollapsed, onOpen }: { nodes: Node[]; depth: number; active: string; dirty: string[]; collapsed: Record<string, boolean>; setCollapsed: (c: Record<string, boolean>) => void; onOpen: (p: string) => void }) {
  return (
    <>
      {nodes.map((n) =>
        n.children ? (
          <div key={n.path}>
            <button onClick={() => setCollapsed({ ...collapsed, [n.path]: !collapsed[n.path] })} className="flex w-full items-center gap-1 py-[3px] pr-2 text-ide-text hover:bg-ide-hi" style={{ paddingLeft: 8 + depth * 12 }}>
              {collapsed[n.path] ? <ChevronRight className="h-3 w-3 text-ide-dim" /> : <ChevronDown className="h-3 w-3 text-ide-dim" />}
              <Folder className="h-3.5 w-3.5 text-[#7AA2F7]" /> {n.name}
            </button>
            {!collapsed[n.path] && <TreeView nodes={n.children} depth={depth + 1} active={active} dirty={dirty} collapsed={collapsed} setCollapsed={setCollapsed} onOpen={onOpen} />}
          </div>
        ) : (
          <button key={n.path} onClick={() => onOpen(n.path)} className={cn("flex w-full items-center gap-1.5 py-[3px] pr-2", active === n.path ? "bg-ide-line text-white" : "text-ide-text/90 hover:bg-ide-hi")} style={{ paddingLeft: 22 + depth * 12 }}>
            {fileIcon(n.name)} <span className="truncate">{n.name}</span>
            {dirty.includes(n.path) && <span className="ml-auto text-[10px] text-[#E0AF68]">M</span>}
          </button>
        )
      )}
    </>
  );
}

function Editor({ path, value, onChange }: { path: string; value: string; onChange: (v: string) => void }) {
  const lines = value.split("\n");
  const longest = Math.max(...lines.map((l) => l.length), 40);
  const html = useMemo(() => highlight(value, path), [value, path]);
  return (
    <div className="flex-1 overflow-auto scroll-thin">
      <div className="flex min-h-full font-mono text-[12.5px] leading-[20px]">
        <div className="sticky left-0 z-[1] shrink-0 select-none bg-ide-bg py-3 pl-3 pr-4 text-right text-ide-dim/70">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div className="relative flex-1 py-3 pr-6" style={{ minWidth: `${longest + 6}ch` }}>
          <pre className="pointer-events-none whitespace-pre text-ide-text m-0" aria-hidden dangerouslySetInnerHTML={{ __html: html + "\n" }} />
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            wrap="off"
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const t = e.currentTarget;
                const s = t.selectionStart;
                const v = t.value.slice(0, s) + "  " + t.value.slice(t.selectionEnd);
                onChange(v);
                requestAnimationFrame(() => (t.selectionStart = t.selectionEnd = s + 2));
              }
            }}
            className="absolute inset-0 resize-none overflow-hidden bg-transparent py-3 pr-6 text-transparent caret-white outline-none selection:bg-bp/40 whitespace-pre"
            style={{ font: "inherit", lineHeight: "inherit" }}
          />
        </div>
      </div>
    </div>
  );
}

function SearchPane({ files, onOpen }: { files: Record<string, string>; onOpen: (p: string) => void }) {
  const [q, setQ] = useState("");
  const hits = q.length < 2 ? [] : Object.entries(files).flatMap(([p, c]) => c.split("\n").map((l, i) => ({ p, l, i })).filter((x) => x.l.toLowerCase().includes(q.toLowerCase()))).slice(0, 60);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-2">
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files" className="h-7 w-full rounded border border-ide-line bg-ide-bg px-2 text-[12px] text-white outline-none focus:border-bp" />
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin font-mono text-[11.5px]">
        {hits.map((h, k) => (
          <button key={k} onClick={() => onOpen(h.p)} className="block w-full truncate px-3 py-1 text-left hover:bg-ide-hi">
            <span className="text-ide-dim">{h.p}:{h.i + 1}</span> <span className="text-ide-text">{h.l.trim()}</span>
          </button>
        ))}
        {q.length >= 2 && !hits.length && <div className="px-3 py-2 text-ide-dim">No results</div>}
      </div>
    </div>
  );
}

function GitPane({ project, dirty, branch, onSelect, onCommit, onBranch, onPR }: { project: Project; dirty: string[]; branch: string; onSelect: (p: string) => void; onCommit: (m: string, push: boolean) => void; onBranch: (b: string) => void; onPR: (t: string) => void }) {
  const [msg, setMsg] = useState("");
  const [prOpen, setPrOpen] = useState(false);
  const [newBranch, setNewBranch] = useState("");
  const branches = Array.from(new Set(["main", ...(project.branches || []), branch]));
  const aiMsg = dirty.length ? `Update ${dirty.map((d) => d.split("/").pop()).join(", ")}` : "";
  const log = [...project.checkpoints].reverse();
  return (
    <div className="flex min-h-0 flex-1 flex-col text-[12px]">
      <div className="flex h-9 items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider text-ide-dim">Source control</div>
      <div className="px-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5 text-ide-dim" />
          <select value={branch} onChange={(e) => onBranch(e.target.value)} className="h-7 flex-1 rounded border border-ide-line bg-ide-bg px-1.5 text-[12px] text-white outline-none">
            {branches.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1">
          <input value={newBranch} onChange={(e) => setNewBranch(e.target.value.replace(/\s+/g, "-"))} placeholder="new-branch" className="h-7 flex-1 rounded border border-ide-line bg-ide-bg px-2 text-[12px] text-white outline-none focus:border-bp font-mono" />
          <button disabled={!newBranch} onClick={() => { onBranch(newBranch); setNewBranch(""); }} className="h-7 rounded bg-ide-line px-2 text-ide-text disabled:opacity-40">Create</button>
        </div>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={aiMsg || "Commit message"} rows={2} className="w-full rounded border border-ide-line bg-ide-bg p-2 text-[12px] text-white outline-none focus:border-bp" />
        <div className="flex gap-1">
          <button disabled={!dirty.length} onClick={() => { onCommit(msg || aiMsg, true); setMsg(""); }} className="flex h-7 flex-1 items-center justify-center gap-1 rounded bg-bp text-white disabled:opacity-40"><Upload className="h-3 w-3" /> Commit & push</button>
          <button disabled={!dirty.length} onClick={() => { onCommit(msg || aiMsg, false); setMsg(""); }} className="h-7 rounded bg-ide-line px-2 text-ide-text disabled:opacity-40" title="Commit only"><Check className="h-3.5 w-3.5" /></button>
        </div>
        {branch !== "main" && (
          <button onClick={() => setPrOpen(true)} className="flex h-7 w-full items-center justify-center gap-1.5 rounded border border-ide-line text-ide-text hover:bg-ide-hi"><GitPullRequest className="h-3.5 w-3.5" /> Create pull request</button>
        )}
      </div>
      <div className="mt-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-ide-dim">Changes {dirty.length ? `(${dirty.length})` : ""}</div>
      <div className="mt-1">
        {dirty.map((d) => (
          <button key={d} onClick={() => onSelect(d)} className="flex w-full items-center gap-1.5 px-3 py-1 font-mono hover:bg-ide-hi">
            {fileIcon(d)} <span className="truncate">{d.split("/").pop()}</span> <span className="truncate text-[10.5px] text-ide-dim">{d}</span> <span className="ml-auto text-[#E0AF68]">M</span>
          </button>
        ))}
        {!dirty.length && <div className="px-3 py-1 text-ide-dim">No changes. Edit a file and press ⌘S.</div>}
      </div>
      {(project.prs || []).length > 0 && (
        <>
          <div className="mt-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-ide-dim">Pull requests</div>
          {(project.prs || []).map((p) => (
            <div key={p.id} className="flex items-center gap-1.5 px-3 py-1">
              <GitPullRequest className={cn("h-3.5 w-3.5", p.status === "open" ? "text-[#9ECE6A]" : "text-[#BB9AF7]")} /> <span className="truncate">#{p.id} {p.title}</span>
            </div>
          ))}
        </>
      )}
      <div className="mt-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-ide-dim">Commits</div>
      <div className="flex-1 overflow-y-auto scroll-thin pb-3">
        {log.map((c) => (
          <div key={c.id} className="px-3 py-1">
            <div className="flex items-center gap-1.5"><span className="font-mono text-[#E0AF68]">{c.sha}</span><span className="truncate">{c.label}</span></div>
            <div className="pl-[60px] text-[10.5px] text-ide-dim">{c.author === "you" ? "you" : "architect[bot]"} · {c.branch || "main"}</div>
          </div>
        ))}
      </div>
      <PRModal open={prOpen} onClose={() => setPrOpen(false)} project={project} branch={branch} onCreate={(t) => { onPR(t); setPrOpen(false); }} />
    </div>
  );
}

function PRModal({ open, onClose, project, branch, onCreate }: { open: boolean; onClose: () => void; project: Project; branch: string; onCreate: (t: string) => void }) {
  const recent = project.checkpoints.filter((c) => c.branch === branch);
  const [title, setTitle] = useState("");
  const body = `## Summary\n${recent.length ? recent.map((c) => `- ${c.label}`).join("\n") : "- Changes on " + branch}\n\n## Agent impact\n- No agent instructions changed\n\n## Checks\n- Preview: https://${branch}--${project.name.toLowerCase()}.preview.architect.new`;
  return (
    <Modal open={open} onClose={onClose} title="Open a pull request" subtitle={`${branch} → main · ${project.github?.repo || "local repo"}`} width={560}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon={<GitPullRequest className="h-3.5 w-3.5" />} onClick={() => onCreate(title || `Merge ${branch}`)}>Create pull request</Button></>}>
      <div className="space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={recent[0]?.label || `Merge ${branch}`} className="h-9 w-full rounded-lg border border-line px-3 text-[13.5px] outline-none focus:border-bp" />
        <div>
          <div className="mb-1 flex items-center justify-between text-[12px] text-ink-3"><span>Description</span><span className="text-bp">✦ written by Architect</span></div>
          <pre className="whitespace-pre-wrap rounded-lg border border-line bg-paper p-3 font-mono text-[12px] text-ink-2">{body}</pre>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[12.5px]">
          {["Build passes", "4/4 tests pass", "Security scan clean", "Preview deployed"].map((c) => (
            <div key={c} className="flex items-center gap-1.5 rounded-lg bg-ok-soft px-2.5 py-1.5 text-ok"><Check className="h-3.5 w-3.5" /> {c}</div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function TestsPane({ project }: { project: Project }) {
  const wired = project.stage !== "ui";
  const tests = wired
    ? ["pipeline returns an output", ...project.spec.agents.map((a) => `${a.id} follows output schema`), "api/run rejects empty input", project.spec.auth ? "api/run requires auth" : "db rls enabled"]
    : ["renders dashboard", "mock pipeline resolves"];
  const [state, setState] = useState<Record<string, "idle" | "run" | "pass">>({});
  async function runAll() {
    for (const t of tests) {
      setState((s) => ({ ...s, [t]: "run" }));
      await new Promise((r) => setTimeout(r, 350));
      setState((s) => ({ ...s, [t]: "pass" }));
    }
  }
  const ref = useRef(false);
  return (
    <div className="flex min-h-0 flex-1 flex-col text-[12px]">
      <div className="flex h-9 items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider text-ide-dim">
        Tests
        <button onClick={() => { ref.current = true; runAll(); }} className="flex items-center gap-1 normal-case text-ide-text hover:text-white"><Play className="h-3 w-3" /> Run all</button>
      </div>
      {tests.map((t) => (
        <div key={t} className="flex items-center gap-2 px-3 py-1">
          {state[t] === "pass" ? <Check className="h-3.5 w-3.5 text-[#9ECE6A]" /> : state[t] === "run" ? <Circle className="h-3 w-3 animate-pulse text-[#E0AF68]" /> : <Circle className="h-3 w-3 text-ide-dim" />}
          <span className="truncate">{t}</span>
        </div>
      ))}
      <div className="mt-3 px-3 text-[11px] text-ide-dim">Agent evals live in the Agents tab.</div>
    </div>
  );
}

function Terminal({ project, files, branch, dirty, onBranch, onCommit }: { project: Project; files: Record<string, string>; branch: string; dirty: string[]; onBranch: (b: string) => void; onCommit: (m: string) => void }) {
  const name = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const [lines, setLines] = useState<{ t: string; c?: string }[]>([
    { t: `Architect sandbox · ${name} · type "help" for commands`, c: "#565f89" },
  ]);
  const [v, setV] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  async function exec(cmd: string) {
    const out = (t: string, c?: string) => setLines((l) => [...l, { t, c }]);
    out(`${name} (${branch}) $ ${cmd}`, "#7AA2F7");
    const [c0, c1, ...rest] = cmd.trim().split(/\s+/);
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    if (!c0) return;
    if (c0 === "clear") return setLines([]);
    if (c0 === "help") return out("ls · cat <file> · git status|log|branch|checkout -b <name>|commit -m <msg> · npm run dev|test|build · architect deploy [--prod] · architect agents · clear");
    if (c0 === "ls") return out(Array.from(new Set(Object.keys(files).map((f) => f.split("/")[0]))).sort().join("   "));
    if (c0 === "cat") {
      const f = files[c1];
      return f ? f.split("\n").slice(0, 40).forEach((l) => out(l)) : out(`cat: ${c1}: No such file`, "#F7768E");
    }
    if (c0 === "git") {
      if (c1 === "status") {
        out(`On branch ${branch}`);
        if (!dirty.length) return out("nothing to commit, working tree clean");
        out("Changes not staged for commit:");
        dirty.forEach((d) => out(`   modified:   ${d}`, "#F7768E"));
        return;
      }
      if (c1 === "log") return [...project.checkpoints].reverse().slice(0, 12).forEach((cp) => out(`${cp.sha} ${cp.label}`, undefined));
      if (c1 === "branch") return ["main", ...(project.branches || [])].forEach((b) => out(`${b === branch ? "* " : "  "}${b}`, b === branch ? "#9ECE6A" : undefined));
      if (c1 === "checkout") {
        const b = rest[0] === "-b" ? rest[1] : rest[0];
        if (!b) return out("usage: git checkout [-b] <branch>", "#F7768E");
        onBranch(b);
        return out(`Switched to ${rest[0] === "-b" ? "a new " : ""}branch '${b}'`);
      }
      if (c1 === "commit") {
        const m = cmd.match(/-m\s+["']?(.+?)["']?$/)?.[1];
        if (!dirty.length) return out("nothing to commit");
        onCommit(m || "Update files");
        return out(`[${branch}] ${m || "Update files"} · ${dirty.length} file(s) changed`);
      }
      if (c1 === "push") return out(project.github ? `To github.com:${project.github.repo}.git   ${branch} -> ${branch}` : "fatal: no remote — connect GitHub from the top bar", project.github ? undefined : "#F7768E");
      return out(`git: '${c1}' is not supported in this demo`, "#E0AF68");
    }
    if (c0 === "npm") {
      if (c1 === "run" && rest[0] === "dev") {
        out("> next dev");
        await wait(500);
        return out("✓ Ready on http://localhost:3000 — mirrored in the Preview tab", "#9ECE6A");
      }
      if (c1 === "test" || (c1 === "run" && rest[0] === "test")) {
        out("> vitest run");
        await wait(600);
        out(project.stage === "ui" ? " ✓ tests/mock.test.ts (2)" : ` ✓ tests/pipeline.test.ts (${project.spec.agents.length + 2})`, "#9ECE6A");
        return out(" Test Files  1 passed · Duration 1.21s");
      }
      if (c1 === "run" && rest[0] === "build") {
        out("> next build");
        await wait(900);
        out("✓ Compiled successfully", "#9ECE6A");
        return out(`Route (app) — ${project.spec.pages.length} pages · First Load JS 88.4 kB`);
      }
      if (c1 === "install" || c1 === "i") {
        await wait(700);
        return out(`added ${rest.length || 1} package${rest.length > 1 ? "s" : ""} in 2s`, "#9ECE6A");
      }
    }
    if (c0 === "architect") {
      if (c1 === "agents") return project.spec.agents.forEach((a) => out(`${a.id.padEnd(22)} ${a.framework}  ${a.model}  ${project.stage === "ui" ? "mock" : "live"}`));
      if (c1 === "deploy") {
        out(`Deploying to ${rest.includes("--prod") ? "production" : "preview"}… (use the Deploy button for the guided flow)`);
        await wait(900);
        return out(`✓ https://${name}${rest.includes("--prod") ? "" : "-preview"}.architect.app`, "#9ECE6A");
      }
    }
    out(`command not found: ${c0}`, "#F7768E");
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin px-4 py-2 font-mono text-[12px] leading-5" onClick={() => document.getElementById("a2-term")?.focus()}>
      {lines.map((l, i) => (
        <div key={i} className="whitespace-pre-wrap" style={{ color: l.c }}>{l.t}</div>
      ))}
      <div className="flex items-center gap-2">
        <span className="text-[#7AA2F7]">{name} ({branch}) $</span>
        <input
          id="a2-term"
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              exec(v);
              setHist((h) => [v, ...h]);
              setHi(-1);
              setV("");
            } else if (e.key === "ArrowUp") {
              const n = Math.min(hi + 1, hist.length - 1);
              setHi(n);
              setV(hist[n] || "");
            } else if (e.key === "ArrowDown") {
              const n = Math.max(hi - 1, -1);
              setHi(n);
              setV(n < 0 ? "" : hist[n]);
            }
          }}
          className="flex-1 bg-transparent text-white outline-none"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      <div ref={endRef} />
    </div>
  );
}
