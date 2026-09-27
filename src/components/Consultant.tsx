"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Sparkles, Bot, Pencil } from "lucide-react";
import { Button, Input, Label, Spinner, cn } from "./ui";
import { tailoredIdeas, type Idea } from "@/lib/catalog";

const ROLES = ["Sales & Marketing", "Customer Support", "HR & Recruiting", "Teacher / Coach", "Founder", "Operations"];
const PAINS = ["Lead outreach", "Answering the same questions", "Screening resumes", "Grading & feedback", "Weekly reporting"];
const TOOLS = ["Gmail", "Slack", "HubSpot", "Google Sheets", "Notion", "Freshdesk"];

/** The AI Consultant — for people who don't have an app idea yet. */
export function Consultant({ onPick }: { onPick: (prompt: string) => void }) {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [pain, setPain] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [ideas, setIdeas] = useState<Idea[] | null>(null);

  async function go() {
    setBusy(true);
    setIdeas(null);
    await new Promise((r) => setTimeout(r, 1100));
    setIdeas(tailoredIdeas(role, pain, tools.join(", ")));
    setBusy(false);
  }

  const Chips = ({ items, value, onPick: pick, multi }: { items: string[]; value: string | string[]; onPick: (v: string) => void; multi?: boolean }) => (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {items.map((i) => {
        const on = multi ? (value as string[]).includes(i) : value === i;
        return (
          <button key={i} onClick={() => pick(i)} className={cn("rounded-full border px-2.5 py-0.5 text-[12px]", on ? "border-bp bg-bp-soft text-bp-2" : "border-line bg-white text-ink-3 hover:text-ink")}>
            {i}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr] animate-in">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-pop">
        <div className="flex items-center gap-2 text-[14px] font-semibold"><Sparkles className="h-4 w-4 text-bp" /> AI Consultant</div>
        <p className="mt-1 text-[12.5px] text-ink-3">No idea yet? Tell me about your work — I&apos;ll suggest apps worth building.</p>
        <div className="mt-4 space-y-4">
          <div>
            <Label>What do you do?</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Sales & Marketing" />
            <Chips items={ROLES} value={role} onPick={setRole} />
          </div>
          <div>
            <Label>What eats most of your week?</Label>
            <Input value={pain} onChange={(e) => setPain(e.target.value)} placeholder="e.g. Lead outreach" />
            <Chips items={PAINS} value={pain} onPick={setPain} />
          </div>
          <div>
            <Label hint="optional">Tools you already use</Label>
            <Chips items={TOOLS} value={tools} multi onPick={(t) => setTools(tools.includes(t) ? tools.filter((x) => x !== t) : [...tools, t])} />
          </div>
          <Button variant="dark" className="w-full" disabled={!role.trim() || busy} onClick={go}>
            {busy ? <><Spinner className="h-3.5 w-3.5" /> Thinking about your week…</> : <>Suggest apps <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {!ideas && !busy && (
          <div className="grid h-full min-h-[260px] place-items-center rounded-2xl border border-dashed border-line-2 p-6 text-center text-[13px] text-ink-4">
            Tailored app ideas appear here — each with the hours it could save you every week.
          </div>
        )}
        {busy && [0, 1, 2].map((i) => <div key={i} className="h-[112px] animate-pulse rounded-2xl bg-paper-3" />)}
        {ideas?.map((i, k) => (
          <div key={i.title} className="rounded-2xl border border-line bg-white p-4 shadow-card animate-in" style={{ animationDelay: `${k * 80}ms` }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[14.5px] font-semibold">{i.title}</div>
                <div className="mt-0.5 text-[12.5px] text-ink-3">{i.pitch}</div>
              </div>
              <div className="shrink-0 rounded-lg bg-ok-soft px-2 py-1 text-center text-ok">
                <div className="flex items-center gap-1 text-[15px] font-semibold tabular-nums"><Clock className="h-3.5 w-3.5" />{i.hours}h</div>
                <div className="text-[10px]">saved / week</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                {i.agents.map((a) => (
                  <span key={a} className="flex items-center gap-1 rounded-md bg-paper-2 px-1.5 py-0.5 text-[11px] text-ink-3"><Bot className="h-3 w-3" />{a}</span>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" icon={<Pencil className="h-3 w-3" />} onClick={() => onPick(i.prompt)}>Edit</Button>
                <Button size="sm" variant="primary" onClick={() => router.push(`/new?prompt=${encodeURIComponent(i.prompt)}`)}>Build this</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
