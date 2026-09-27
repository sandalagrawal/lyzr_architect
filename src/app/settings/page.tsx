"use client";
import { useEffect, useState } from "react";
import { KeyRound, Zap, Gauge, User, Check, Eye, EyeOff, Cloud, CircleDot } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PlansModal } from "@/components/PlansModal";
import { Badge, Button, Card, Input, Label, Segmented, cn, toast } from "@/components/ui";
import { useStore } from "@/lib/store";
import { MODELS } from "@/lib/presets";
import { lyzrStatus } from "@/lib/client";
import { supabaseEnabled } from "@/lib/supabase";
import type { Depth } from "@/lib/types";

export default function SettingsPage() {
  const { settings, setSettings, user, updateUser, projects, cloud } = useStore();
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [lyzrKey, setLyzrKey] = useState(settings.byok.lyzr_key || "");
  const [lyzrAgent, setLyzrAgent] = useState(settings.byok.lyzr_agent || "");
  const [serverLyzr, setServerLyzr] = useState<boolean | null>(null);
  const [plans, setPlans] = useState(false);
  useEffect(() => {
    lyzrStatus().then(setServerLyzr);
  }, []);

  const usage = [
    { label: "Building UI", v: 64 },
    { label: "Agent runs", v: 41 },
    { label: "Wiring & tests", v: 36 },
    { label: "Chat edits", v: 17 },
  ];
  const max = Math.max(...usage.map((u) => u.v));

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Models, keys & usage</h1>
          <p className="mt-1 text-[14px] text-ink-3">One balance for every model by default. Bring your own keys when you want control.</p>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-[14px] font-semibold"><User className="h-4 w-4 text-bp" /> You</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><Label>Name</Label><Input value={user?.name || ""} onChange={(e) => updateUser({ name: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={user?.email || ""} readOnly className="bg-paper-2" /></div>
          </div>
          <div className="mt-4">
            <Label hint="You can switch any time inside a project">Default depth</Label>
            <Segmented value={(user?.depthPref || "outcome") as Depth} onChange={(d) => { updateUser({ depthPref: d }); toast("Default depth updated"); }} options={[{ value: "outcome", label: "Outcome" }, { value: "blueprint", label: "Blueprint" }, { value: "code", label: "Code" }]} />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-paper-2 px-3 py-2 text-[12.5px] text-ink-3">
            <Cloud className={cn("h-3.5 w-3.5", cloud ? "text-ok" : "text-ink-4")} />
            {cloud ? `Signed in with ${user?.provider} · ${projects.length} projects synced to the cloud database` : supabaseEnabled ? "Demo account — sign in with email or Google to sync projects to the cloud" : "Demo mode — projects are saved in this browser"}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-[14px] font-semibold"><Zap className="h-4 w-4 text-bp" /> Models</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label hint="Writes your code">Builder model</Label>
              <select value={settings.builderModel} onChange={(e) => setSettings((s) => ({ ...s, builderModel: e.target.value }))} className="h-9 w-full rounded-lg border border-line bg-white px-2 text-[13px]">
                {MODELS.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.note}</option>)}
              </select>
            </div>
            <div>
              <Label hint="For new agents">Default agent model</Label>
              <select value={settings.defaultAgentModel} onChange={(e) => setSettings((s) => ({ ...s, defaultAgentModel: e.target.value }))} className="h-9 w-full rounded-lg border border-line bg-white px-2 text-[13px]">
                {MODELS.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.note}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-semibold"><KeyRound className="h-4 w-4 text-bp" /> API keys</div>
            <Segmented size="sm" value={settings.keyMode} onChange={(v) => setSettings((s) => ({ ...s, keyMode: v }))} options={[{ value: "architect", label: "Architect key (1 balance)" }, { value: "byok", label: "Bring your own" }]} />
          </div>
          {settings.keyMode === "architect" ? (
            <div className="mt-4 rounded-xl bg-bp-soft/50 p-4 text-[13px] text-ink-2">
              <div className="font-medium">No keys needed.</div>
              <div className="mt-1 text-ink-3">Every model — GPT, Claude, Gemini, Llama — is billed from your credits. Simplest for non-technical teams.</div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {["openai", "anthropic", "google"].map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-24 text-[13px] capitalize">{k}</span>
                  <Input type={show[k] ? "text" : "password"} placeholder={`${k} API key`} value={settings.byok[k] || ""} onChange={(e) => setSettings((s) => ({ ...s, byok: { ...s.byok, [k]: e.target.value } }))} />
                  <button onClick={() => setShow({ ...show, [k]: !show[k] })} className="text-ink-4">{show[k] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 border-t border-line pt-4">
            <div className="flex items-center justify-between">
              <div className="text-[13.5px] font-semibold">Lyzr agent runtime</div>
              <Badge tone={serverLyzr ? "ok" : lyzrKey && lyzrAgent ? "bp" : "neutral"}><CircleDot className="h-3 w-3" /> {serverLyzr ? "connected (server)" : lyzrKey && lyzrAgent ? "using your key" : "simulated"}</Badge>
            </div>
            <p className="mt-1 text-[12.5px] text-ink-3">Agent test runs, the app preview and the PRD refiner call Lyzr&apos;s Agent API. Paste a Studio API key and an agent ID to run for real from this browser.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input type="password" placeholder="Lyzr API key" value={lyzrKey} onChange={(e) => setLyzrKey(e.target.value)} />
              <Input placeholder="Agent ID" value={lyzrAgent} onChange={(e) => setLyzrAgent(e.target.value)} />
              <Button variant="dark" icon={<Check className="h-3.5 w-3.5" />} onClick={() => { setSettings((s) => ({ ...s, byok: { ...s.byok, lyzr_key: lyzrKey.trim(), lyzr_agent: lyzrAgent.trim() } })); toast("Lyzr credentials saved in this browser"); }}>Save</Button>
            </div>
          </div>
        </Card>

        <Card className="p-5" id="usage">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-semibold"><Gauge className="h-4 w-4 text-bp" /> Usage this cycle</div>
            <Button size="sm" onClick={() => setPlans(true)}>See plans</Button>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[30px] font-semibold tabular-nums tracking-tight">{Math.round(settings.creditsTotal - settings.credits)}</span>
            <span className="text-[13px] text-ink-3">of {settings.creditsTotal} credits used · resets in 12 days</span>
          </div>
          <div className="mt-4 space-y-2.5">
            {usage.map((u) => (
              <div key={u.label} className="grid grid-cols-[120px_1fr_40px] items-center gap-3 text-[12.5px]">
                <span className="text-ink-3">{u.label}</span>
                <div className="h-2 rounded-full bg-paper-3"><div className="h-2 rounded-full bg-bp" style={{ width: `${(u.v / max) * 100}%` }} /></div>
                <span className="text-right tabular-nums">{u.v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-[12px] text-ink-4">Every action shows its estimated cost before it runs — no surprises.</div>
        </Card>
      </div>
      <PlansModal open={plans} onClose={() => setPlans(false)} />
    </AppShell>
  );
}
