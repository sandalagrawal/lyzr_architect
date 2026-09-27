"use client";
import { Check } from "lucide-react";
import { Badge, Button, Modal, cn, toast } from "./ui";

const PLANS = [
  { name: "Free", price: "$0", note: "forever", credits: "1,000 credits / mo", features: ["3 projects", "Preview deploys", "Community Marketplace", "Agent Library (workspace)"], cta: "Current plan", current: true },
  { name: "Pro", price: "$25", note: "per builder / mo", credits: "5,000 credits / mo", features: ["Unlimited projects", "Production deploys + custom domains", "GitHub two-way sync & PRs", "Bring your own model keys", "Private Marketplace publishing"], cta: "Upgrade to Pro", pop: true },
  { name: "Enterprise", price: "Custom", note: "annual", credits: "Pooled credits", features: ["SSO / SCIM & RBAC", "Audit logs & data residency", "VPC / on-prem deploys", "Forward Deployed Engineers", "99.9% SLA"], cta: "Talk to sales" },
];

export function PlansModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} width={860} title="Plans & credits" subtitle="One credit balance works across every model, agent run and build. Unused credits roll over for a month.">
      <div className="grid gap-3 md:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.name} className={cn("rounded-2xl border p-5", p.pop ? "border-bp ring-4 ring-bp/10" : "border-line")}>
            <div className="flex items-center justify-between"><span className="text-[15px] font-semibold">{p.name}</span>{p.pop && <Badge tone="bp">Most popular</Badge>}</div>
            <div className="mt-3 flex items-baseline gap-1"><span className="text-[28px] font-semibold tracking-tight">{p.price}</span><span className="text-[12px] text-ink-4">{p.note}</span></div>
            <div className="mt-1 text-[12.5px] font-medium text-bp-2">{p.credits}</div>
            <ul className="mt-4 space-y-2 text-[12.5px] text-ink-2">
              {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />{f}</li>)}
            </ul>
            <Button className="mt-5 w-full" variant={p.pop ? "primary" : "secondary"} disabled={p.current} onClick={() => { onClose(); toast(p.name === "Enterprise" ? "Our team will reach out within a day" : "Checkout — simulated in this demo", "info"); }}>{p.cta}</Button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
