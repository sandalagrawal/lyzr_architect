"use client";
import { useState } from "react";
import { ArrowRight, Bot, Database, FileCode2, FileText, LayoutGrid, Plug, User, Check, Pencil, Circle } from "lucide-react";
import type { Project, Spec } from "@/lib/types";
import { Badge, Button, Card, Segmented, cn } from "@/components/ui";
import { Markdown } from "@/lib/md";
import { MODELS } from "@/lib/presets";

export function Blueprint({
  project,
  onSpec,
  onPrd,
  openFile,
  openAgent,
}: {
  project: Project;
  onSpec: (s: Spec, label: string) => void;
  onPrd: (md: string) => void;
  openFile: (path: string) => void;
  openAgent: (id: string) => void;
}) {
  const [tab, setTab] = useState<"map" | "prd">("map");
  const [edit, setEdit] = useState(false);
  const [prd, setPrd] = useState(project.prd);
  const s = project.spec;
  const live = project.stage === "wired" || project.stage === "deployed";

  const FileTag = ({ path }: { path: string }) => (
    <button onClick={() => openFile(path)} className="flex items-center gap-1 font-mono text-[10.5px] text-ink-4 hover:text-bp" title="Open in Code">
      <FileCode2 className="h-3 w-3" /> {path}
    </button>
  );

  return (
    <div className="h-full overflow-y-auto scroll-thin bg-paper">
      <div className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-line bg-paper/90 backdrop-blur px-4">
        <Segmented
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            { value: "map", label: <><LayoutGrid className="h-3 w-3" /> App map</> },
            { value: "prd", label: <><FileText className="h-3 w-3" /> PRD</> },
          ]}
        />
        <span className="text-[11.5px] text-ink-4">Every card is a file in your repo — edits here are commits.</span>
      </div>

      {tab === "map" && (
        <div className="mx-auto max-w-5xl p-6 space-y-8">
          {/* Pipeline */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[14px] font-semibold"><Bot className="h-4 w-4 text-bp" /> Agent pipeline</h3>
              <FileTag path="lib/agents.ts" />
            </div>
            <div className="grid-paper rounded-2xl border border-line p-5 overflow-x-auto">
              <div className="flex items-stretch gap-2 min-w-max">
                <div className="flex w-28 flex-col items-center justify-center rounded-xl border border-dashed border-line-2 bg-white/70 p-3 text-center">
                  <User className="h-4 w-4 text-ink-3" />
                  <div className="mt-1 text-[12px] font-medium">User input</div>
                  <div className="text-[11px] text-ink-4">{s.pages[0]?.name}</div>
                </div>
                {s.agents.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-ink-4" />
                    <button onClick={() => openAgent(a.id)} className="w-52 rounded-xl border border-line bg-white p-3 text-left shadow-card hover:border-bp/50 hover:shadow-pop transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold truncate">{a.name}</span>
                        {live ? <Badge tone="ok"><Circle className="h-2 w-2 fill-current" /> live</Badge> : <Badge tone="warn">mock</Badge>}
                      </div>
                      <div className="mt-1 text-[11.5px] text-ink-3 line-clamp-2">{a.role}</div>
                      <div className="mt-2 flex items-center justify-between text-[10.5px] text-ink-4">
                        <span className="font-mono">{MODELS.find((m) => m.id === a.model)?.name || a.model}</span>
                        <span>{a.tools.length} tools</span>
                      </div>
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-ink-4" />
                  <div className="flex w-28 flex-col items-center justify-center rounded-xl border border-dashed border-line-2 bg-white/70 p-3 text-center">
                    <Check className="h-4 w-4 text-ok" />
                    <div className="mt-1 text-[12px] font-medium">Result</div>
                    <div className="text-[11px] text-ink-4">saved to DB</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-[14px] font-semibold"><LayoutGrid className="h-4 w-4 text-bp" /> Pages</h3>
              <Card className="divide-y divide-line">
                {s.pages.map((p, i) => (
                  <div key={p.route} className="flex items-center gap-3 px-3.5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <input
                        defaultValue={p.name}
                        onBlur={(e) => e.target.value !== p.name && onSpec({ ...s, pages: s.pages.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) }, `Renamed page to ${e.target.value}`)}
                        className="w-full text-[13px] font-medium outline-none bg-transparent"
                      />
                      <div className="truncate text-[11.5px] text-ink-4">{p.purpose}</div>
                    </div>
                    <FileTag path={p.route === "/" ? "app/page.tsx" : `app/${p.route.replace(/^\//, "")}/page.tsx`} />
                  </div>
                ))}
              </Card>
            </section>
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-[14px] font-semibold"><Database className="h-4 w-4 text-bp" /> Data</h3>
              <div className="space-y-2">
                {s.data.map((t) => (
                  <Card key={t.name} className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[12.5px] font-medium">{t.name}</span>
                      <FileTag path={live ? "db/schema.sql" : "architect/spec.yaml"} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.fields.map((f) => (
                        <span key={f.name} className="rounded-md bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-3">{f.name}<span className="text-ink-4">:{f.type}</span></span>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-[14px] font-semibold"><Plug className="h-4 w-4 text-bp" /> Integrations</h3>
            <div className="flex flex-wrap gap-2">
              {s.integrations.map((i) => {
                const on = project.integrations.includes(i);
                return (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 h-9 text-[13px] shadow-card">
                    <span className={cn("h-1.5 w-1.5 rounded-full", on ? "bg-ok" : "bg-warn")} />
                    {i}
                    <span className="text-[11px] text-ink-4">{on ? "connected" : "needs access"}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {tab === "prd" && (
        <div className="mx-auto max-w-3xl p-6">
          <div className="mb-3 flex items-center justify-between">
            <FileTag path="architect/prd.md" />
            <Button
              size="sm"
              variant={edit ? "dark" : "secondary"}
              icon={edit ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
              onClick={() => {
                if (edit) onPrd(prd);
                setEdit(!edit);
              }}
            >
              {edit ? "Save" : "Edit"}
            </Button>
          </div>
          <Card className="p-7">
            {edit ? <textarea value={prd} onChange={(e) => setPrd(e.target.value)} className="w-full min-h-[600px] font-mono text-[12.5px] leading-6 outline-none" /> : <Markdown src={project.prd} />}
          </Card>
        </div>
      )}
    </div>
  );
}
