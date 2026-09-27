"use client";
import { useEffect, useState } from "react";
import { FileText, Presentation, Search, BookOpen, Download, ChevronLeft, ChevronRight, Plus, Share2 } from "lucide-react";
import type { Artifact, Project } from "@/lib/types";
import { Button, Empty, cn, toast } from "@/components/ui";
import { Markdown } from "@/lib/md";
import { timeAgo, slug } from "@/lib/generate";
import { artifactToHtml, download } from "@/lib/artifacts";

const ICON = { spec: FileText, deck: Presentation, research: Search, guide: BookOpen };
const LABEL = { spec: "Feature spec", deck: "Slide deck", research: "Research", guide: "User guide" };

export function ArtifactsPanel({ project, onCreate }: { project: Project; onCreate: (kind: Artifact["kind"]) => void }) {
  const list = project.artifacts || [];
  const [sel, setSel] = useState<string | null>(list[0]?.id || null);
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (list.length && !list.find((a) => a.id === sel)) setSel(list[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);
  const a = list.find((x) => x.id === sel);
  const slides = a?.kind === "deck" ? a.body.split("\n---\n") : [];

  return (
    <div className="flex h-full bg-paper">
      <div className="flex w-64 shrink-0 flex-col border-r border-line bg-white">
        <div className="flex h-11 items-center border-b border-line px-3 text-[13px] font-semibold">Artifacts</div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {list.map((x) => {
            const I = ICON[x.kind];
            return (
              <button key={x.id} onClick={() => { setSel(x.id); setSlide(0); }} className={cn("flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left", x.id === sel ? "bg-bp-soft/70" : "hover:bg-paper-2")}>
                <I className="mt-0.5 h-4 w-4 shrink-0 text-bp" />
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-medium">{x.title.split(" — ")[1] || x.title}</div>
                  <div className="text-[11px] text-ink-4">{LABEL[x.kind]} · {timeAgo(x.at)}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="border-t border-line p-2">
          <div className="px-1 pb-1.5 text-[11px] text-ink-4">Generate with full context of this app</div>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(LABEL) as Artifact["kind"][]).map((k) => {
              const I = ICON[k];
              return (
                <button key={k} onClick={() => onCreate(k)} className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1.5 text-[11.5px] text-ink-2 hover:border-bp/40">
                  <I className="h-3.5 w-3.5 text-ink-3" /> {LABEL[k]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {!a ? (
          <div className="grid flex-1 place-items-center">
            <Empty icon={<FileText className="h-5 w-5" />} title="No artifacts yet" body="Ask the chat for a feature spec, a pitch deck, a research brief or a user guide — or pick one on the left. Architect already knows everything about this app." action={<Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => onCreate("spec")}>Create a feature spec</Button>} />
          </div>
        ) : (
          <>
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-line bg-white px-4">
              <span className="truncate text-[13.5px] font-semibold">{a.title}</span>
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" icon={<Share2 className="h-3.5 w-3.5" />} onClick={() => toast("Share link copied — anyone in your workspace can view", "info")}>Share</Button>
                <Button size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => download(`${slug(a.title)}.md`, a.body.replace(/\n---\n/g, "\n\n---\n\n"), "text/markdown")}>.md</Button>
                <Button size="sm" variant="dark" icon={<Download className="h-3.5 w-3.5" />} onClick={() => download(`${slug(a.title)}.html`, artifactToHtml(a), "text/html")}>{a.kind === "deck" ? "Slides (.html)" : "Document (.html)"}</Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scroll-thin p-6">
              {a.kind === "deck" ? (
                <div className="mx-auto max-w-3xl">
                  <div className="aspect-video rounded-2xl border border-line bg-white p-10 shadow-pop flex flex-col justify-center">
                    <Markdown src={slides[slide]} className="[&_h1]:!text-[34px] [&_h2]:!text-[26px] [&_li]:!text-[17px] [&_p]:!text-[17px]" />
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <Button size="sm" icon={<ChevronLeft className="h-4 w-4" />} disabled={slide === 0} onClick={() => setSlide(slide - 1)} />
                    <span className="text-[12.5px] tabular-nums text-ink-3">{slide + 1} / {slides.length}</span>
                    <Button size="sm" icon={<ChevronRight className="h-4 w-4" />} disabled={slide === slides.length - 1} onClick={() => setSlide(slide + 1)} />
                  </div>
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {slides.map((s, i) => (
                      <button key={i} onClick={() => setSlide(i)} className={cn("h-16 w-28 shrink-0 overflow-hidden rounded-lg border bg-white p-2 text-left text-[8px] leading-tight", i === slide ? "border-bp ring-2 ring-bp/20" : "border-line")}>
                        {s.split("\n")[0].replace(/^#+ /, "")}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-white p-8 shadow-card">
                  <Markdown src={a.body} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
