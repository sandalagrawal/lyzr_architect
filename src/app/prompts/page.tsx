"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Copy, Pencil } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button, Input, Modal, cn, toast } from "@/components/ui";
import { PROMPT_LIBRARY } from "@/lib/catalog";

export default function PromptLibrary() {
  const router = useRouter();
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<{ title: string; prompt: string; tools: string[] } | null>(null);
  const [draft, setDraft] = useState("");
  const cats = ["All", ...PROMPT_LIBRARY.map((c) => c.cat)];
  const groups = PROMPT_LIBRARY.filter((c) => cat === "All" || c.cat === cat)
    .map((c) => ({ ...c, items: c.items.filter((i) => (i.title + i.prompt).toLowerCase().includes(q.toLowerCase())) }))
    .filter((c) => c.items.length);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-[26px] font-semibold tracking-tight">Prompt Library</h1>
        <p className="mt-1 text-[14px] text-ink-3">Production-tested prompts that reliably produce good agentic apps. Each one spells out the user journey, the agents and the expected output — edit it for your context, then build.</p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("rounded-full px-3 py-1 text-[12.5px]", cat === c ? "bg-ink text-white" : "bg-paper-3 text-ink-3 hover:text-ink")}>{c}</button>
          ))}
          <div className="relative ml-auto w-60"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-4" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search prompts" className="pl-8" /></div>
        </div>
        <div className="mt-6 space-y-8">
          {groups.map((g) => (
            <section key={g.cat}>
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-4">{g.cat}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((i) => (
                  <button key={i.title} onClick={() => { setOpen(i); setDraft(i.prompt); }} className="flex flex-col rounded-2xl border border-line bg-white p-4 text-left shadow-card hover:border-bp/40 hover:shadow-pop transition-all">
                    <div className="text-[14px] font-semibold">{i.title}</div>
                    <p className="mt-1.5 line-clamp-3 text-[12.5px] text-ink-3">{i.prompt}</p>
                    <div className="mt-auto pt-3 flex flex-wrap gap-1">
                      {i.tools.map((t) => <span key={t} className="rounded-md bg-paper-2 px-1.5 py-0.5 text-[11px] text-ink-3">{t}</span>)}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <Modal open={Boolean(open)} onClose={() => setOpen(null)} width={620} title={open?.title} subtitle="Tweak it for your team, tools and success criteria — then build."
        footer={<><Button icon={<Copy className="h-3.5 w-3.5" />} onClick={() => { navigator.clipboard?.writeText(draft); toast("Copied"); }}>Copy</Button><Button variant="primary" onClick={() => router.push(`/new?prompt=${encodeURIComponent(draft)}`)}>Use this prompt <ArrowRight className="h-4 w-4" /></Button></>}>
        <div className="mb-1.5 flex items-center gap-1.5 text-[12px] text-ink-4"><Pencil className="h-3 w-3" /> Editable</div>
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={8} className="w-full rounded-xl border border-line p-3 text-[13.5px] leading-relaxed outline-none focus:border-bp" />
      </Modal>
    </AppShell>
  );
}
