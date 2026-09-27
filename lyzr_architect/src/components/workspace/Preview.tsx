"use client";
import { useState } from "react";
import { Monitor, Tablet, Smartphone, MousePointer2, RotateCw, ExternalLink, Lock, X, Sparkles, Check, Bot, Undo2, Palette } from "lucide-react";
import type { Project } from "@/lib/types";
import { GeneratedApp, type EditTarget } from "./GeneratedApp";
import { Badge, Button, Segmented, cn } from "@/components/ui";
import { slug } from "@/lib/generate";
import { ThemePicker } from "@/components/ThemeManager";
import type { ThemeDef } from "@/lib/catalog";

const SWATCHES = ["#3452F5", "#E0457B", "#0F9D76", "#F59E0B", "#7C3AED", "#0E1116"];

export function Preview({
  project,
  building,
  buildProgress,
  onEdit,
  onAskAI,
  onWire,
  narrow,
  onApplyTheme,
}: {
  project: Project;
  building: boolean;
  buildProgress: number;
  onEdit: (changes: Record<string, string>, label: string) => void;
  onAskAI: (t: EditTarget) => void;
  onWire: () => void;
  narrow?: boolean;
  onApplyTheme?: (t: ThemeDef) => void;
}) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [route, setRoute] = useState("/");
  const [editMode, setEditMode] = useState(false);
  const [sel, setSel] = useState<EditTarget | null>(null);
  const [draft, setDraft] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const [themeOpen, setThemeOpen] = useState(false);
  const live = project.stage === "wired" || project.stage === "deployed";
  const url = `${slug(project.name)}-${project.id.slice(2, 6)}.sandbox.architect.new${route === "/" ? "" : route}`;
  const width = device === "desktop" ? "100%" : device === "tablet" ? 768 : 390;

  function select(t: EditTarget) {
    setSel(t);
    const el = document.querySelector(`[data-edit="${t.key}"]`) as HTMLElement | null;
    setDraft(project.content[t.key] ?? el?.innerText ?? "");
    setColor(null);
  }

  function apply() {
    if (!sel) return;
    const changes: Record<string, string> = {};
    if (draft.trim()) changes[sel.key] = draft.trim();
    if (color) changes["style.accent"] = color;
    onEdit(changes, sel.label);
    setSel(null);
  }

  return (
    <div className="flex h-full flex-col bg-paper-3/60">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line bg-white px-3">
        <div className="flex items-center gap-1">
          <button onClick={() => setKey((k) => k + 1)} className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-paper-2" title="Reload"><RotateCw className="h-3.5 w-3.5" /></button>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-paper-2 px-2.5 h-7 text-[12px] text-ink-3">
          <Lock className="h-3 w-3 shrink-0 text-ok" />
          {!narrow && <span className="truncate font-mono">{url}</span>}
          <select value={route} onChange={(e) => setRoute(e.target.value)} className="ml-auto bg-transparent text-[12px] text-ink-2 outline-none cursor-pointer" title="Page">
            {project.spec.pages.map((p) => (
              <option key={p.route} value={p.route}>{p.name}</option>
            ))}
          </select>
        </div>
        {!narrow && <Badge tone={live ? "ok" : "warn"}>
          <Bot className="h-3 w-3" /> {live ? "Live agents" : "Mocked agents"}
        </Badge>}
        <Segmented
          size="sm"
          value={device}
          onChange={setDevice}
          options={[
            { value: "desktop", label: <Monitor className="h-3.5 w-3.5" />, hint: "Desktop" },
            { value: "tablet", label: <Tablet className="h-3.5 w-3.5" />, hint: "Tablet" },
            { value: "mobile", label: <Smartphone className="h-3.5 w-3.5" />, hint: "Mobile" },
          ]}
        />
        {onApplyTheme && <Button size="sm" variant="secondary" icon={<Palette className="h-3.5 w-3.5" />} onClick={() => setThemeOpen(true)} disabled={building} title="Theme">{!narrow && "Theme"}</Button>}
        <Button
          size="sm"
          variant={editMode ? "primary" : "secondary"}
          icon={<MousePointer2 className="h-3.5 w-3.5" />}
          onClick={() => {
            setEditMode(!editMode);
            setSel(null);
          }}
          disabled={building}
          title="Click any element in the preview to edit it"
        >
          {editMode ? "Editing" : "Edit"}
        </Button>
        <button className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-paper-2" title="Open in new tab"><ExternalLink className="h-3.5 w-3.5" /></button>
      </div>

      {editMode && !sel && (
        <div className="shrink-0 bg-bp text-white text-[12.5px] px-4 py-1.5 flex items-center justify-between">
          <span>Click any highlighted element to edit its text or colour — or ask the AI to change it.</span>
          <button onClick={() => setEditMode(false)} className="underline opacity-80 hover:opacity-100">Done</button>
        </div>
      )}
      {!live && !building && project.stage === "ui" && !editMode && (
        <div className="shrink-0 border-b border-warn/20 bg-warn-soft text-[12.5px] px-4 py-2 flex items-center justify-between gap-3">
          <span className="text-warn"><b className="font-semibold">UI preview.</b> Agents return mocked data so you can perfect the experience first.</span>
          <Button size="sm" variant="dark" onClick={onWire}>Looks good — wire it up</Button>
        </div>
      )}

      <div className="relative flex-1 overflow-auto scroll-thin p-4">
        <div
          key={key}
          data-edit-mode={editMode}
          className={cn("mx-auto h-full min-h-[520px] overflow-auto rounded-xl border border-line bg-white shadow-card transition-all scroll-thin", device !== "desktop" && "shadow-pop")}
          style={{ width, maxWidth: "100%" }}
        >
          <GeneratedApp project={project} route={route} setRoute={setRoute} editMode={editMode} selected={sel?.key} onSelect={select} buildProgress={building ? buildProgress : 1} compact={device === "mobile" || narrow} />
        </div>

        {building && (
          <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-ink text-white text-[12px] px-3 py-1.5 shadow-pop flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7CE0A5] animate-pulseDot" /> Building UI · {Math.round(buildProgress * 100)}%
          </div>
        )}

        {sel && (
          <div className="absolute right-6 top-6 w-72 rounded-xl border border-line bg-white shadow-pop animate-in">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <div className="text-[12.5px] font-medium">{sel.label}</div>
              <button onClick={() => setSel(null)} className="text-ink-4 hover:text-ink"><X className="h-3.5 w-3.5" /></button>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <div className="mb-1 text-[11.5px] text-ink-4">Text</div>
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} className="w-full rounded-lg border border-line p-2 text-[13px] outline-none focus:border-bp" />
              </div>
              {sel.kind === "button" && (
                <div>
                  <div className="mb-1 text-[11.5px] text-ink-4">Brand colour</div>
                  <div className="flex gap-1.5">
                    {SWATCHES.map((c) => (
                      <button key={c} onClick={() => setColor(c)} className={cn("h-6 w-6 rounded-full ring-offset-2", color === c && "ring-2 ring-bp")} style={{ background: c }} aria-label={c} />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="primary" icon={<Check className="h-3.5 w-3.5" />} onClick={apply}>Apply</Button>
                <Button size="sm" icon={<Sparkles className="h-3.5 w-3.5" />} onClick={() => { onAskAI(sel); setSel(null); }}>Ask AI</Button>
                {project.content[sel.key] && (
                  <Button size="sm" variant="ghost" icon={<Undo2 className="h-3.5 w-3.5" />} onClick={() => { onEdit({ [sel.key]: "" }, sel.label + " (reset)"); setSel(null); }} title="Reset" />
                )}
              </div>
              <div className="text-[11px] text-ink-4">Edits are saved as a checkpoint and committed to <span className="font-mono">app/page.tsx</span>.</div>
            </div>
          </div>
        )}
      </div>
      {onApplyTheme && <ThemePicker open={themeOpen} onClose={() => setThemeOpen(false)} current={project.theme} onApply={onApplyTheme} />}
    </div>
  );
}
