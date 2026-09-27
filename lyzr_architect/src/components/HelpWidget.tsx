"use client";
import { useState } from "react";
import { HelpCircle, BookOpen, Megaphone, Keyboard, MessageCircle, CalendarClock, Bug, Send, Check } from "lucide-react";
import { Button, Kbd, Modal, cn, toast } from "./ui";

const NEWS = [
  ["One project, three depths", "Outcome, Blueprint and Code views of the same repo."],
  ["Code mode", "A full IDE with diffs, terminal, branches and pull requests."],
  ["Agent Library", "Publish versioned agents and reuse them as plugins via SDK, REST or MCP."],
  ["Mock-first building", "See and edit the UI before any backend credits are spent."],
  ["Deploy gates", "Tests, agent evals and a security scan run before every deploy."],
];

export function HelpWidget({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<null | "news" | "keys" | "chat" | "fde" | "bug">(null);
  const [msgs, setMsgs] = useState<{ me: boolean; t: string }[]>([{ me: false, t: "Hi 👋 I'm Architect support. Ask anything — a human from our team joins if I can't help." }]);
  const [draft, setDraft] = useState("");
  const [slot, setSlot] = useState<string | null>(null);

  const items = [
    { k: "docs", icon: BookOpen, label: "Docs & guides" },
    { k: "news", icon: Megaphone, label: "What's new in 2.0" },
    { k: "keys", icon: Keyboard, label: "Keyboard shortcuts" },
    { k: "chat", icon: MessageCircle, label: "Chat with support" },
    { k: "fde", icon: CalendarClock, label: "Book a Forward Deployed Engineer" },
    { k: "bug", icon: Bug, label: "Report a bug" },
  ] as const;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className={cn("flex items-center gap-2 rounded-lg text-ink-3 hover:bg-white/70 hover:text-ink", compact ? "h-9 w-9 justify-center" : "h-8 w-full px-2.5 text-[13px]")} title="Help & support">
        <HelpCircle className="h-4 w-4" /> {!compact && "Help & support"}
      </button>
      {open && (
        <div className={cn("absolute z-50 w-72 rounded-xl border border-line bg-white p-1 shadow-pop animate-in", compact ? "bottom-0 left-11" : "bottom-10 left-0")}>
          {items.map((i) => (
            <button
              key={i.k}
              onClick={() => {
                setOpen(false);
                if (i.k === "docs") window.open("https://docs.architect.new", "_blank");
                else setModal(i.k);
              }}
              className="flex h-8 w-full items-center gap-2 whitespace-nowrap rounded-lg px-2.5 text-left text-[13px] hover:bg-paper-2"
            >
              <i.icon className="h-3.5 w-3.5 text-ink-3" /> {i.label}
            </button>
          ))}
        </div>
      )}

      <Modal open={modal === "news"} onClose={() => setModal(null)} title="What's new in Architect 2.0" width={480}>
        <div className="space-y-3">
          {NEWS.map(([t, b]) => (
            <div key={t} className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-bp" /><div><div className="text-[13.5px] font-medium">{t}</div><div className="text-[12.5px] text-ink-3">{b}</div></div></div>
          ))}
        </div>
      </Modal>
      <Modal open={modal === "keys"} onClose={() => setModal(null)} title="Keyboard shortcuts" width={420}>
        <div className="space-y-2 text-[13px]">
          {[["Outcome / Blueprint / Code", "⌘1  ⌘2  ⌘3"], ["Save file (Code)", "⌘S"], ["Send message", "Enter"], ["New line", "Shift + Enter"], ["Run agent test", "⌘ Enter"], ["Close dialog", "Esc"]].map(([a, k]) => (
            <div key={a} className="flex items-center justify-between"><span className="text-ink-2">{a}</span><Kbd>{k}</Kbd></div>
          ))}
        </div>
      </Modal>
      <Modal open={modal === "chat"} onClose={() => setModal(null)} title="Support" subtitle="Typical reply: under 5 minutes" width={420}>
        <div className="h-64 space-y-2 overflow-y-auto rounded-lg bg-paper p-3">
          {msgs.map((m, i) => (
            <div key={i} className={cn("max-w-[85%] rounded-xl px-3 py-2 text-[13px]", m.me ? "ml-auto bg-ink text-white" : "bg-white border border-line")}>{m.t}</div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && draft && (setMsgs([...msgs, { me: true, t: draft }, { me: false, t: "Thanks — I've attached your project context. A teammate will follow up here and by email." }]), setDraft(""))} placeholder="Describe your issue…" className="h-9 flex-1 rounded-lg border border-line px-3 text-[13px] outline-none focus:border-bp" />
          <Button variant="dark" icon={<Send className="h-3.5 w-3.5" />} disabled={!draft} onClick={() => { setMsgs([...msgs, { me: true, t: draft }, { me: false, t: "Thanks — I've attached your project context. A teammate will follow up here and by email." }]); setDraft(""); }} />
        </div>
      </Modal>
      <Modal open={modal === "fde"} onClose={() => setModal(null)} title="Book a Forward Deployed Engineer" subtitle="30 minutes with a Lyzr engineer to co-build, review your agents or plan an enterprise rollout." width={480}
        footer={<Button variant="primary" disabled={!slot} onClick={() => { setModal(null); toast(`Booked for ${slot} — invite sent to your email`); setSlot(null); }}>Confirm booking</Button>}>
        <div className="grid grid-cols-3 gap-2">
          {["Mon 10:00", "Mon 15:30", "Tue 11:00", "Tue 17:00", "Wed 09:30", "Wed 14:00"].map((s) => (
            <button key={s} onClick={() => setSlot(s)} className={cn("rounded-lg border px-3 py-2 text-[13px]", slot === s ? "border-bp bg-bp-soft/50 text-bp-2" : "border-line hover:border-line-2")}>{slot === s && <Check className="mr-1 inline h-3 w-3" />}{s}</button>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-ink-4">Times in your timezone. Free on all plans for your first app.</p>
      </Modal>
      <Modal open={modal === "bug"} onClose={() => setModal(null)} title="Report a bug" width={440}
        footer={<Button variant="primary" onClick={() => { setModal(null); toast("Bug reported — screenshot & logs attached"); }}>Send report</Button>}>
        <textarea rows={4} placeholder="What happened? What did you expect?" className="w-full rounded-lg border border-line p-3 text-[13px] outline-none focus:border-bp" />
        <label className="mt-2 flex items-center gap-2 text-[12.5px] text-ink-3"><input type="checkbox" defaultChecked className="accent-[#3452F5]" /> Attach screenshot & recent logs</label>
      </Modal>
    </div>
  );
}
