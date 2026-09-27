"use client";
import { useEffect, useState } from "react";
import { Check, FileText, PenTool as Figma, FolderUp, Code2, Loader2, Plus, Trash2, Upload, Palette } from "lucide-react";
import { Github } from "./icons";
import { Badge, Button, Input, Label, Modal, Segmented, Switch, cn, toast } from "./ui";
import type { ThemeDef } from "@/lib/catalog";
import { deleteTheme, loadThemes, saveTheme } from "@/lib/themes";

export function ThemeSwatch({ t, size = "md" }: { t: ThemeDef; size?: "sm" | "md" }) {
  const k = t.tokens;
  return (
    <div className={cn("overflow-hidden border", size === "sm" ? "h-16 rounded-lg" : "h-28 rounded-xl")} style={{ background: k.bg, borderColor: k.dark ? "#262b35" : "#e7e6e1", color: k.text, fontFamily: k.font === "mono" ? "var(--font-mono)" : k.font === "serif" ? "Georgia, serif" : "var(--font-sans)" }}>
      <div className="p-2.5">
        <div className={cn("font-semibold", size === "sm" ? "text-[10px]" : "text-[13px]")}>Aa Heading</div>
        <div className={cn("mt-0.5 opacity-60", size === "sm" ? "text-[8px]" : "text-[11px]")}>Body text sample</div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className={cn("text-white", size === "sm" ? "px-1.5 py-0.5 text-[8px]" : "px-2.5 py-1 text-[11px]")} style={{ background: k.accent, borderRadius: k.radius / (size === "sm" ? 2 : 1) }}>Button</span>
          <span className={cn("border", size === "sm" ? "px-1.5 py-0.5 text-[8px]" : "px-2.5 py-1 text-[11px]")} style={{ borderRadius: k.radius / (size === "sm" ? 2 : 1), borderColor: k.dark ? "#333" : "#ddd" }}>Input</span>
        </div>
      </div>
    </div>
  );
}

type Src = "figma" | "doc" | "github" | "zip" | "css";
const SOURCES: { k: Src; label: string; icon: typeof FileText; hint: string }[] = [
  { k: "figma", label: "Figma file", icon: Figma, hint: "Paste a Figma link (beta)" },
  { k: "doc", label: "Brand guide", icon: FileText, hint: "PDF, Word or text" },
  { k: "github", label: "GitHub repo", icon: Github as unknown as typeof FileText, hint: "Reads your tailwind / CSS vars" },
  { k: "zip", label: "ZIP", icon: FolderUp, hint: "A design-system package" },
  { k: "css", label: "Paste CSS", icon: Code2, hint: "CSS variables or Tailwind config" },
];

function parseCss(css: string): Partial<ThemeDef["tokens"]> {
  const colors = css.match(/#[0-9a-fA-F]{6}\b/g) || [];
  const radius = css.match(/radius[^:]*:\s*([\d.]+)(px|rem)/);
  const out: Partial<ThemeDef["tokens"]> = {};
  const accent = css.match(/--(?:primary|accent|brand)[^:]*:\s*(#[0-9a-fA-F]{6})/);
  if (accent) out.accent = accent[1];
  else if (colors[0]) out.accent = colors[0];
  const bg = css.match(/--(?:background|bg)[^:]*:\s*(#[0-9a-fA-F]{6})/);
  if (bg) {
    out.bg = bg[1];
    const n = parseInt(bg[1].slice(1), 16);
    const lum = ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
    out.dark = lum < 128;
    out.text = out.dark ? "#E8EAEE" : "#15171C";
  }
  if (radius) out.radius = Math.round(parseFloat(radius[1]) * (radius[2] === "rem" ? 16 : 1));
  if (/mono/i.test(css)) out.font = "mono";
  else if (/serif/i.test(css) && !/sans-serif/i.test(css)) out.font = "serif";
  return out;
}

export function ThemeCreator({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (t: ThemeDef) => void }) {
  const [step, setStep] = useState<"source" | "extract" | "edit">("source");
  const [src, setSrc] = useState<Src>("css");
  const [input, setInput] = useState(":root {\n  --primary: #7C3AED;\n  --background: #FFFFFF;\n  --radius: 0.75rem;\n  font-family: Inter, sans-serif;\n}");
  const [t, setT] = useState<ThemeDef>({ id: "", name: "My brand", desc: "", source: "", tokens: { accent: "#7C3AED", radius: 12, dark: false, font: "sans", bg: "#FFFFFF", text: "#15171C" }, instructions: "Use the accent only for primary actions. Prefer generous whitespace." });
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setStep("source");
      setLog([]);
    }
  }, [open]);

  async function extract() {
    setStep("extract");
    const lines =
      src === "css"
        ? ["Parsing CSS variables", "Mapping colours → accent / background / text", "Detecting radius & typography"]
        : src === "figma"
        ? ["Opening Figma file", "Reading colour & text styles", "Reading component variants"]
        : src === "github"
        ? ["Cloning repo", "Found tailwind.config.ts", "Reading CSS custom properties"]
        : ["Reading document", "Extracting brand colours & fonts", "Summarising usage rules"];
    for (const l of lines) {
      setLog((x) => [...x, l]);
      await new Promise((r) => setTimeout(r, 450));
    }
    const parsed = src === "css" ? parseCss(input) : { accent: "#0D9488", radius: 8 };
    setT((cur) => ({ ...cur, id: "th_" + Math.random().toString(36).slice(2, 8), source: SOURCES.find((s) => s.k === src)!.label, tokens: { ...cur.tokens, ...parsed } }));
    setStep("edit");
  }

  const k = t.tokens;
  const setK = (p: Partial<ThemeDef["tokens"]>) => setT({ ...t, tokens: { ...k, ...p } });

  return (
    <Modal open={open} onClose={onClose} width={step === "edit" ? 780 : 560} title={<span className="flex items-center gap-2"><Palette className="h-4 w-4 text-bp" /> Create a theme</span>} subtitle="Bring your design system once — every app you build can use it.">
      {step === "source" && (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {SOURCES.map((s) => (
              <button key={s.k} onClick={() => setSrc(s.k)} className={cn("rounded-xl border p-2.5 text-center", src === s.k ? "border-bp bg-bp-soft/50" : "border-line hover:border-line-2")}>
                <s.icon className="mx-auto h-4 w-4 text-ink-2" />
                <div className="mt-1.5 text-[12px] font-medium">{s.label}</div>
              </button>
            ))}
          </div>
          <div className="text-[12px] text-ink-4">{SOURCES.find((s) => s.k === src)?.hint}</div>
          {src === "css" && <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={7} className="w-full rounded-lg border border-line bg-paper p-3 font-mono text-[12px] outline-none focus:border-bp" />}
          {src === "figma" && <Input placeholder="https://www.figma.com/design/…" />}
          {src === "github" && <Input placeholder="github.com/your-org/design-system" />}
          {(src === "doc" || src === "zip") && (
            <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-line-2 p-6 text-[13px] text-ink-3 hover:border-bp/50">
              <Upload className="h-5 w-5" /> <span className="mt-2">Drop a {src === "zip" ? ".zip" : "PDF / .docx / .txt"} or click to browse</span>
              <input type="file" className="hidden" />
            </label>
          )}
          <div className="flex justify-end"><Button variant="primary" onClick={extract}>Extract design tokens</Button></div>
        </div>
      )}
      {step === "extract" && (
        <div className="space-y-2 py-2 font-mono text-[12.5px]">
          {log.map((l, i) => (
            <div key={i} className="flex items-center gap-2">{i === log.length - 1 ? <Loader2 className="h-3.5 w-3.5 animate-spin text-bp" /> : <Check className="h-3.5 w-3.5 text-ok" />} {l}</div>
          ))}
        </div>
      )}
      {step === "edit" && (
        <div className="grid gap-5 md:grid-cols-[1fr_300px]">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} /></div>
              <div><Label>Description</Label><Input value={t.desc} onChange={(e) => setT({ ...t, desc: e.target.value })} placeholder="What it's for" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["accent", "bg", "text"] as const).map((key) => (
                <div key={key}>
                  <Label>{key === "bg" ? "Background" : key === "text" ? "Text" : "Accent"}</Label>
                  <div className="flex items-center gap-2 rounded-lg border border-line px-2 h-9">
                    <input type="color" value={k[key]} onChange={(e) => setK({ [key]: e.target.value })} className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0" />
                    <span className="font-mono text-[12px]">{k[key]}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 items-end">
              <div>
                <Label hint={`${k.radius}px`}>Corner radius</Label>
                <input type="range" min={0} max={24} value={k.radius} onChange={(e) => setK({ radius: +e.target.value })} className="w-full accent-[#3452F5]" />
              </div>
              <div>
                <Label>Font</Label>
                <Segmented size="sm" value={k.font} onChange={(f) => setK({ font: f })} options={[{ value: "sans", label: "Sans" }, { value: "serif", label: "Serif" }, { value: "mono", label: "Mono" }]} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-line px-3 h-9 text-[12.5px]">Dark <Switch checked={k.dark} onChange={(d) => setK({ dark: d, bg: d ? "#0F1115" : "#FFFFFF", text: d ? "#E8EAEE" : "#15171C" })} /></div>
            </div>
            <div>
              <Label hint="The builder follows these">Usage instructions</Label>
              <textarea value={t.instructions} onChange={(e) => setT({ ...t, instructions: e.target.value })} rows={3} className="w-full rounded-lg border border-line p-2.5 text-[13px] outline-none focus:border-bp" />
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line-2 px-3 py-2 text-[12.5px] text-ink-3 hover:border-bp/50"><Upload className="h-3.5 w-3.5" /> Upload logo & brand assets<input type="file" className="hidden" /></label>
          </div>
          <div>
            <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-ink-4">Live preview</div>
            <ThemeSwatch t={t} />
            <div className="mt-3 flex gap-1.5">{[k.accent, k.bg, k.text].map((c, i) => <div key={i} className="h-8 flex-1 rounded-md border border-line" style={{ background: c }} />)}</div>
            <div className="mt-2 text-[11.5px] text-ink-4">Imported from {t.source}</div>
            <Button variant="primary" className="mt-4 w-full" onClick={() => { saveTheme(t); onSaved(t); toast(`Theme “${t.name}” saved`); onClose(); }}>Save theme</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/** Theme picker used inside a project. */
export function ThemePicker({ open, onClose, current, onApply }: { open: boolean; onClose: () => void; current: { accent: string; font: string; dark: boolean; radius: number }; onApply: (t: ThemeDef) => void }) {
  const [themes, setThemes] = useState<ThemeDef[]>([]);
  const [create, setCreate] = useState(false);
  useEffect(() => {
    if (open) setThemes(loadThemes());
  }, [open]);
  return (
    <>
      <Modal open={open && !create} onClose={onClose} width={640} title="Theme" subtitle="Apply a design system to this app. It becomes a commit — restore any time.">
        <div className="grid gap-3 sm:grid-cols-3">
          {themes.map((t) => {
            const on = t.tokens.accent === current.accent && t.tokens.dark === current.dark && t.tokens.radius === current.radius;
            return (
              <button key={t.id} onClick={() => { onApply(t); onClose(); }} className={cn("rounded-xl border p-2 text-left", on ? "border-bp ring-4 ring-bp/10" : "border-line hover:border-line-2")}>
                <ThemeSwatch t={t} size="sm" />
                <div className="mt-2 flex items-center justify-between px-0.5"><span className="text-[12.5px] font-medium">{t.name}</span>{on && <Check className="h-3.5 w-3.5 text-bp" />}</div>
                <div className="px-0.5 text-[11px] text-ink-4">{t.source}</div>
              </button>
            );
          })}
          <button onClick={() => setCreate(true)} className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-2 p-4 text-[12.5px] text-ink-3 hover:border-bp/50 hover:text-ink">
            <Plus className="h-4 w-4" /> Import a design system
          </button>
        </div>
      </Modal>
      <ThemeCreator open={create} onClose={() => setCreate(false)} onSaved={(t) => { setThemes(loadThemes()); onApply(t); onClose(); }} />
    </>
  );
}

export function ThemeGrid() {
  const [themes, setThemes] = useState<ThemeDef[]>([]);
  const [create, setCreate] = useState(false);
  useEffect(() => {
    setThemes(loadThemes());
  }, []);
  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button onClick={() => setCreate(true)} className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 text-[13px] text-ink-3 hover:border-bp/50 hover:text-ink">
          <Plus className="h-5 w-5" /> Create theme
          <span className="text-[11.5px] text-ink-4">from Figma, a PDF, GitHub, a ZIP or CSS</span>
        </button>
        {themes.map((t) => (
          <div key={t.id} className="rounded-2xl border border-line bg-white p-3 shadow-card">
            <ThemeSwatch t={t} />
            <div className="mt-3 flex items-center justify-between px-1">
              <div>
                <div className="text-[13.5px] font-semibold">{t.name}</div>
                <div className="text-[11.5px] text-ink-4">{t.desc || t.source}</div>
              </div>
              {t.source === "Built-in" ? <Badge>Built-in</Badge> : (
                <button onClick={() => { deleteTheme(t.id); setThemes(loadThemes()); }} className="text-ink-4 hover:text-bad" aria-label="Delete theme"><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
          </div>
        ))}
      </div>
      <ThemeCreator open={create} onClose={() => setCreate(false)} onSaved={() => setThemes(loadThemes())} />
    </>
  );
}
