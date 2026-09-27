"use client";
import { useEffect, useState } from "react";
import { Check, Search, Server, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input, Modal, cn, toast } from "@/components/ui";
import { CATALOG } from "@/lib/integrations";
import { sleep } from "@/lib/client";

export default function IntegrationsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [connected, setConnected] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [mcp, setMcp] = useState(false);
  const [mcpUrl, setMcpUrl] = useState("");
  const [servers, setServers] = useState<string[]>(["github (official)", "postgres (read-only)"]);

  useEffect(() => {
    try {
      setConnected(JSON.parse(localStorage.getItem("a2.connected") || "[]"));
    } catch {}
  }, []);
  const save = (l: string[]) => {
    setConnected(l);
    try {
      localStorage.setItem("a2.connected", JSON.stringify(l));
    } catch {}
  };

  const cats = ["All", ...Array.from(new Set(CATALOG.map((c) => c.cat)))];
  const list = CATALOG.filter((c) => (cat === "All" || c.cat === cat) && c.name.toLowerCase().includes(q.toLowerCase()));
  const app = CATALOG.find((c) => c.name === open);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-[26px] font-semibold tracking-tight">Integrations & MCP</h1>
        <p className="mt-1 text-[14px] text-ink-3">Connect once at the workspace level. Each app asks only for the access its agents need.</p>

        <Card className="mt-6 flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-white"><Server className="h-5 w-5" /></div>
            <div>
              <div className="text-[14px] font-semibold">MCP servers</div>
              <div className="text-[12.5px] text-ink-3">{servers.length} connected · {servers.join(", ")}</div>
            </div>
          </div>
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setMcp(true)}>Add MCP server</Button>
        </Card>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("rounded-full px-3 py-1 text-[12.5px]", cat === c ? "bg-ink text-white" : "bg-paper-3 text-ink-3 hover:text-ink")}>{c}</button>
          ))}
          <div className="relative ml-auto w-60"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-4" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 40+ apps" className="pl-8" /></div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const on = connected.includes(c.name);
            return (
              <Card key={c.name} className="flex items-center gap-3 p-3.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl text-[14px] font-bold text-white" style={{ background: c.color }}>{c.name[0]}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium">{c.name}</div>
                  <div className="text-[11.5px] text-ink-4">{c.cat}</div>
                </div>
                {on ? (
                  <button onClick={() => { save(connected.filter((x) => x !== c.name)); toast(`${c.name} disconnected`); }} className="group"><Badge tone="ok"><Check className="h-3 w-3" /> <span className="group-hover:hidden">Connected</span><span className="hidden group-hover:inline">Disconnect</span></Badge></button>
                ) : (
                  <Button size="sm" onClick={() => setOpen(c.name)}>Connect</Button>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} width={420} title={`Connect ${open}`} subtitle="OAuth — you'll approve on the provider's site."
        footer={<><Button variant="ghost" onClick={() => setOpen(null)}>Cancel</Button><Button variant="primary" onClick={async () => { const n = open!; setOpen(null); await sleep(400); save([...connected, n]); toast(`${n} connected (simulated OAuth)`); }}>Continue to {open}</Button></>}>
        <div className="space-y-2">
          {(app?.scopes || ["Read data", "Write data"]).map((s) => (
            <div key={s} className="flex items-center gap-2 rounded-lg bg-paper-2 px-3 py-2 text-[13px]"><Check className="h-3.5 w-3.5 text-ok" /> {s}</div>
          ))}
        </div>
      </Modal>
      <Modal open={mcp} onClose={() => setMcp(false)} width={460} title="Add an MCP server" subtitle="Tools it exposes become available to every agent you allow."
        footer={<><Button variant="ghost" onClick={() => setMcp(false)}>Cancel</Button><Button variant="primary" disabled={!mcpUrl} onClick={async () => { const n = mcpUrl.replace(/https?:\/\//, "").split("/")[0]; setMcp(false); setMcpUrl(""); await sleep(500); setServers([...servers, n]); toast(`${n} connected · tools discovered`); }}>Connect</Button></>}>
        <div className="space-y-3">
          <Input value={mcpUrl} onChange={(e) => setMcpUrl(e.target.value)} placeholder="https://mcp.example.com/sse" />
          <div className="grid grid-cols-2 gap-2 text-[12.5px]">
            {["Linear", "Sentry", "Stripe", "Figma"].map((s) => (
              <button key={s} onClick={() => setMcpUrl(`https://mcp.${s.toLowerCase()}.com/sse`)} className="rounded-lg border border-line px-3 py-2 text-left hover:border-bp/40">{s} <span className="text-ink-4">official</span></button>
            ))}
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
