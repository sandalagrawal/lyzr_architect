"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, GitFork, Star, Upload, Eye } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Modal, Segmented, toast } from "@/components/ui";
import { MARKET_APPS } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { sampleProject } from "@/lib/sample";
import { presetFor } from "@/lib/generate";

export default function Marketplace() {
  const router = useRouter();
  const { user, saveProject, projects } = useStore();
  const [tab, setTab] = useState<"trending" | "lyzr" | "community">("trending");
  const [peek, setPeek] = useState<(typeof MARKET_APPS)[number] | null>(null);
  const [pub, setPub] = useState(false);
  const list = MARKET_APPS.filter((a) => (tab === "lyzr" ? a.by === "Lyzr" : tab === "community" ? a.by !== "Lyzr" : true));

  function remix(a: (typeof MARKET_APPS)[number]) {
    const login = (user?.name || "you").toLowerCase().replace(/\s+/g, "");
    const key = ["sales", "education", "support", "research"].includes(a.preset) ? a.preset : "sales";
    const p = sampleProject(key, login);
    p.name = `${a.name} (remix)`;
    p.spec = { ...p.spec, appName: a.name };
    p.theme = { ...p.theme, accent: a.color };
    p.source = { type: "template", ref: `marketplace/${a.id}` };
    p.github = undefined;
    p.deployments = [];
    saveProject(p);
    toast(`Remixed ${a.name} — it's your copy now`);
    router.push(`/project/${p.id}`);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight">Marketplace</h1>
            <p className="mt-1 text-[14px] text-ink-3">Working agentic apps built by Lyzr and the community. Try one live, or remix it into your own project — code, agents and all.</p>
          </div>
          <Button variant="dark" icon={<Upload className="h-4 w-4" />} onClick={() => setPub(true)}>Publish your app</Button>
        </div>
        <div className="mt-6"><Segmented value={tab} onChange={setTab} options={[{ value: "trending", label: "Trending" }, { value: "lyzr", label: "By Lyzr" }, { value: "community", label: "Community" }]} /></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => {
            const s = presetFor(a.preset).sample;
            return (
              <div key={a.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-card hover:shadow-pop transition-all">
                <div className="h-32 border-b border-line bg-paper-2 p-4">
                  <div className="h-full rounded-t-lg border border-line bg-white p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold"><span className="h-2.5 w-2.5 rounded" style={{ background: a.color }} /> {a.name}</div>
                    <div className="mt-2 grid grid-cols-4 gap-1">
                      {s.stats.map((st) => (
                        <div key={st.label} className="rounded bg-paper-2 px-1 py-1"><div className="truncate text-[7px] text-ink-4">{st.label}</div><div className="text-[10px] font-semibold" style={{ color: a.color }}>{st.value}</div></div>
                      ))}
                    </div>
                    <div className="mt-1.5 h-5 rounded" style={{ background: a.color, opacity: 0.12 }} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[14.5px] font-semibold">{a.name}{a.verified && <BadgeCheck className="h-4 w-4 text-bp" />}</div>
                    <span className="flex items-center gap-0.5 text-[12px] text-ink-3"><Star className="h-3.5 w-3.5 fill-warn text-warn" /> {a.rating}</span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-3">{a.desc}</p>
                  <div className="mt-2 flex items-center gap-2 text-[11.5px] text-ink-4"><span>{a.by}</span>·<span className="flex items-center gap-0.5"><GitFork className="h-3 w-3" /> {a.remixes} remixes</span></div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="primary" icon={<GitFork className="h-3.5 w-3.5" />} onClick={() => remix(a)}>Remix</Button>
                    <Button size="sm" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => setPeek(a)}>What&apos;s inside</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Modal open={Boolean(peek)} onClose={() => setPeek(null)} width={520} title={peek?.name} subtitle={peek ? `${peek.by} · ${peek.remixes} remixes` : ""} footer={peek && <Button variant="primary" onClick={() => remix(peek)}>Remix into my workspace</Button>}>
        {peek && (() => {
          const pr = presetFor(peek.preset);
          return (
            <div className="space-y-3 text-[13px]">
              <p className="text-ink-2">{pr.tagline}.</p>
              <div><div className="mb-1 text-[11.5px] font-semibold uppercase tracking-wider text-ink-4">Agents</div>{pr.capabilities.map((c) => <div key={c.id} className="flex justify-between border-b border-line py-1.5"><span className="font-medium">{c.agent.name}</span><span className="text-ink-3">{c.agent.role}</span></div>)}</div>
              <div className="flex flex-wrap gap-1">{pr.integrations.map((i) => <Badge key={i}>{i}</Badge>)}</div>
            </div>
          );
        })()}
      </Modal>
      <Modal open={pub} onClose={() => setPub(false)} width={460} title="Publish an app to the Marketplace" subtitle="Others get a copy to remix. Your data, secrets and users are never included.">
        {projects.length ? (
          <div className="space-y-2">
            {projects.slice(0, 5).map((p) => (
              <button key={p.id} onClick={() => { setPub(false); toast(`${p.name} submitted for review — usually live within a day`); }} className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left text-[13px] hover:border-bp/40">
                {p.name}<span className="text-[11.5px] text-ink-4">{p.spec.agents.length} agents</span>
              </button>
            ))}
          </div>
        ) : <p className="text-[13px] text-ink-3">Build an app first.</p>}
      </Modal>
    </AppShell>
  );
}
