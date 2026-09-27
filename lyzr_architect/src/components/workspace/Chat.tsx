"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, FileCode2, GitCommitHorizontal, Loader2, Paperclip, Play, RotateCcw, Sparkles, Square, X, Brain, MessageCircleQuestion, Hammer, PanelRightClose, Coins, BookOpen } from "lucide-react";
import type { Depth, Msg, Project } from "@/lib/types";
import { Avatar, Segmented, cn } from "@/components/ui";
import { Markdown } from "@/lib/md";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/generate";

export type ChatMode = "build" | "plan" | "ask";

const IN_APP_PROMPTS = [
  "Create a feature spec for this app",
  "Make a 6-slide pitch deck for this app",
  "Add a Slack alert agent for failed runs",
  "Make it dark and use purple",
  'Change the title to "Welcome back"',
  "Write a user guide for new users",
  "Wire it up",
];

export function Chat({
  project,
  depth,
  busy,
  streaming,
  context,
  clearContext,
  onSend,
  onStop,
  onOpenFile,
  onRestore,
  onCollapse,
  suggestions,
}: {
  project: Project;
  depth: Depth;
  busy: boolean;
  streaming?: Msg | null;
  context?: string | null;
  clearContext: () => void;
  onSend: (text: string, mode: ChatMode) => void;
  onStop: () => void;
  onOpenFile: (f: string) => void;
  onRestore: (cpId: string) => void;
  onCollapse: () => void;
  suggestions: string[];
}) {
  const { user } = useStore();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<ChatMode>("build");
  const [lib, setLib] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const msgs = streaming ? [...project.chat, streaming] : project.chat;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length, streaming?.steps?.length, streaming?.text]);

  function send(t = text) {
    if (!t.trim() || busy) return;
    onSend(t.trim(), mode);
    setText("");
  }

  const cps = Object.fromEntries(project.checkpoints.map((c) => [c.id, c]));
  const est = mode === "build" ? "~3" : mode === "plan" ? "~1" : "~0.5";

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-3">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <Sparkles className="h-4 w-4 text-bp" /> Architect
          {busy && <span className="flex items-center gap-1 text-[11.5px] font-normal text-ink-3"><Loader2 className="h-3 w-3 animate-spin" /> working</span>}
        </div>
        <button onClick={onCollapse} className="grid h-7 w-7 place-items-center rounded-md text-ink-4 hover:bg-paper-2 hover:text-ink" title="Hide chat"><PanelRightClose className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-3 py-4 space-y-4">
        {msgs.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end gap-2 animate-in">
              <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-ink px-3 py-2 text-[13px] leading-relaxed text-white whitespace-pre-wrap">{m.text}</div>
              <Avatar name={user?.name || "You"} src={user?.avatar} size={22} />
            </div>
          ) : (
            <div key={m.id} className="animate-in">
              {m.steps && m.steps.length > 0 && (
                <div className="mb-2 rounded-xl border border-line bg-paper/70 p-2 space-y-0.5">
                  {m.steps.map((s, i) => {
                    const last = streaming?.id === m.id && i === m.steps!.length - 1 && busy;
                    return (
                      <div key={i} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[12px]">
                        {last ? <Loader2 className="h-3 w-3 shrink-0 animate-spin text-bp" /> : <Check className="h-3 w-3 shrink-0 text-ok" />}
                        <span className={cn("truncate", last ? "text-ink" : "text-ink-3")}>{s.label}</span>
                        {s.file && (
                          <button onClick={() => onOpenFile(s.file!)} className="ml-auto flex shrink-0 items-center gap-1 rounded bg-white border border-line px-1.5 py-0.5 font-mono text-[10.5px] text-ink-3 hover:text-bp hover:border-bp/40" title={depth === "code" ? "Open file" : "Open in Code"}>
                            <FileCode2 className="h-3 w-3" /> {s.file.split("/").pop()}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {m.text && <Markdown src={m.text} className="text-[13px] [&_p]:text-ink-2" />}
              {m.checkpoint && cps[m.checkpoint] && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] text-ink-3">
                  <GitCommitHorizontal className="h-3.5 w-3.5 text-ink-4" />
                  {depth === "code" ? (
                    <span className="font-mono">{cps[m.checkpoint].sha} · {cps[m.checkpoint].label}</span>
                  ) : (
                    <span>Checkpoint saved · {timeAgo(cps[m.checkpoint].at)}</span>
                  )}
                  <button onClick={() => onRestore(m.checkpoint!)} className="ml-auto flex items-center gap-1 text-ink-3 hover:text-bp"><RotateCcw className="h-3 w-3" /> Restore</button>
                </div>
              )}
            </div>
          )
        )}
        {!msgs.length && (
          <div className="text-center text-[13px] text-ink-3 py-10">Ask for a change, or click something in the preview.</div>
        )}
        <div ref={endRef} />
      </div>

      {!busy && suggestions.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto px-3 pb-2 scroll-thin">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full border border-line bg-white px-2.5 py-1 text-[12px] text-ink-3 hover:border-bp/40 hover:text-ink">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="shrink-0 border-t border-line p-2.5">
        {context && (
          <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-bp-soft px-2 py-1 text-[12px] text-bp-2">
            <Square className="h-3 w-3" /> Editing: <b className="font-medium">{context}</b>
            <button onClick={clearContext} className="ml-auto"><X className="h-3 w-3" /></button>
          </div>
        )}
        <div className="rounded-xl border border-line focus-within:border-bp/50 bg-white">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder={mode === "build" ? (depth === "code" ? "Describe a change, or @file to reference code…" : "Describe a change…") : mode === "plan" ? "Think it through with me — no code changes" : "Ask about your app or its code…"}
            className="w-full resize-none bg-transparent px-3 pt-2.5 text-[13px] outline-none placeholder:text-ink-4"
          />
          <div className="flex items-center justify-between px-1.5 pb-1.5">
            <div className="flex items-center gap-1">
              <Segmented
                size="sm"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "build", label: <><Hammer className="h-3 w-3" /> Build</>, hint: "Make changes to the app" },
                  { value: "plan", label: <><Brain className="h-3 w-3" /> Plan</>, hint: "Discuss & plan — nothing changes until you approve" },
                  { value: "ask", label: <><MessageCircleQuestion className="h-3 w-3" /> Ask</>, hint: "Ask questions — read-only" },
                ]}
              />
              <button className="grid h-6 w-6 place-items-center rounded-md text-ink-4 hover:bg-paper-2" title="Attach file or screenshot"><Paperclip className="h-3.5 w-3.5" /></button>
              <div className="relative">
                <button onClick={() => setLib(!lib)} className={cn("grid h-6 w-6 place-items-center rounded-md hover:bg-paper-2", lib ? "text-bp" : "text-ink-4")} title="Prompt library"><BookOpen className="h-3.5 w-3.5" /></button>
                {lib && (
                  <div className="absolute bottom-8 left-0 z-30 w-72 rounded-xl border border-line bg-white p-1 shadow-pop animate-in">
                    <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Prompt library</div>
                    {IN_APP_PROMPTS.map((pr) => (
                      <button key={pr} onClick={() => { setText(pr); setLib(false); }} className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[12.5px] text-ink-2 hover:bg-paper-2">{pr}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-ink-4" title="Estimated credits"><Coins className="h-3 w-3" />{est}</span>
              {busy ? (
                <button onClick={onStop} className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-white" title="Stop"><Square className="h-3 w-3 fill-white" /></button>
              ) : (
                <button onClick={() => send()} disabled={!text.trim()} className="grid h-7 w-7 place-items-center rounded-lg bg-bp text-white disabled:bg-paper-3 disabled:text-ink-4" title="Send">
                  {mode === "build" ? <ArrowUp className="h-3.5 w-3.5" /> : <Play className="h-3 w-3" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
