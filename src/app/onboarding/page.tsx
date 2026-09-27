"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquare, LayoutGrid, Code2, Check, ArrowRight } from "lucide-react";
import { Github } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { Button, cn, toast } from "@/components/ui";
import { useStore } from "@/lib/store";
import { resolveNext } from "@/lib/nav";
import type { Depth } from "@/lib/types";

const ROLES = ["Founder / business owner", "Product manager", "Software engineer", "Designer", "Ops / analyst", "Student"];

function Inner() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { user, ready, updateUser } = useStore();
  const [step, setStep] = useState(0);
  const [depth, setDepth] = useState<Depth>("outcome");
  const [role, setRole] = useState<string>("");
  const [gh, setGh] = useState(false);
  const [ghBusy, setGhBusy] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
    // onboarding is one-time: returning users go straight in
    if (ready && user?.onboarded) router.replace(resolveNext(next));
  }, [ready, user, router, next]);

  useEffect(() => {
    if (role === "Software engineer") setDepth("code");
    else if (role === "Product manager" || role === "Designer") setDepth("blueprint");
    else if (role) setDepth("outcome");
  }, [role]);

  function finish() {
    updateUser({ onboarded: true, depthPref: depth, role, ...(gh ? {} : {}) });
    try {
      if (gh) localStorage.setItem("a2.github", JSON.stringify({ login: (user?.name || "you").toLowerCase().replace(/\s+/g, ""), orgs: ["personal", "acme-labs"] }));
    } catch {}
    router.replace(resolveNext(next));
  }

  const depths = [
    { d: "outcome" as Depth, icon: MessageSquare, t: "Just describe it", b: "I'll chat and click around the preview. Keep the code out of my way.", tag: "Outcome" },
    { d: "blueprint" as Depth, icon: LayoutGrid, t: "Show me the structure", b: "I want to see and edit pages, agents and data — without writing code.", tag: "Blueprint" },
    { d: "code" as Depth, icon: Code2, t: "Give me the code", b: "Open the IDE, show me diffs, let me run the terminal and open PRs.", tag: "Code" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 h-16">
        <Logo href="/home" />
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-bp" : i < step ? "w-1.5 bg-bp/50" : "w-1.5 bg-line-2")} />
          ))}
        </div>
        <button onClick={finish} className="text-[13px] text-ink-3 hover:text-ink">Skip</button>
      </div>
      <div className="flex-1 flex items-start justify-center px-4 pt-[6vh] pb-10">
        <div className="w-full max-w-2xl animate-in" key={step}>
          {step === 0 && (
            <>
              <h1 className="text-[28px] font-semibold tracking-tight">Hi {user?.name?.split(" ")[0] || "there"} — what best describes you?</h1>
              <p className="mt-2 text-[14.5px] text-ink-3">We&apos;ll tailor defaults. Nothing is locked in.</p>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ROLES.map((r) => (
                  <button key={r} onClick={() => setRole(r)} className={cn("rounded-xl border px-4 py-3.5 text-left text-[13.5px] transition-all", role === r ? "border-bp bg-bp-soft/60 text-ink shadow-card" : "border-line bg-white hover:border-line-2")}>
                    {r}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <Button variant="dark" size="lg" disabled={!role} onClick={() => setStep(1)}>Continue <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h1 className="text-[28px] font-semibold tracking-tight">How do you like to build?</h1>
              <p className="mt-2 text-[14.5px] text-ink-3">This sets your default <b className="font-medium text-ink-2">depth</b>. You can flip between all three in any project, any time.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {depths.map((x) => (
                  <button
                    key={x.d}
                    onClick={() => setDepth(x.d)}
                    className={cn("relative rounded-2xl border p-5 text-left transition-all", depth === x.d ? "border-bp bg-white shadow-pop ring-4 ring-bp/10" : "border-line bg-white hover:border-line-2")}
                  >
                    {depth === x.d && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-bp text-white"><Check className="h-3 w-3" /></span>}
                    <x.icon className={cn("h-5 w-5", depth === x.d ? "text-bp" : "text-ink-3")} />
                    <div className="mt-6 text-[15px] font-semibold">{x.t}</div>
                    <div className="mt-1.5 text-[13px] text-ink-3 leading-relaxed">{x.b}</div>
                    <div className="mt-4 font-mono text-[11px] text-ink-4">default: {x.tag}</div>
                  </button>
                ))}
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button variant="dark" size="lg" onClick={() => setStep(2)}>Continue <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="text-[28px] font-semibold tracking-tight">Connect GitHub?</h1>
              <p className="mt-2 text-[14.5px] text-ink-3">Every project is a Git repo from day one. Connect now to sync it to your account — or skip and we&apos;ll host it for you until you&apos;re ready.</p>
              <div className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-card">
                <div className="flex items-center gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-white"><Github className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <div className="text-[14.5px] font-medium">{gh ? "GitHub connected" : "GitHub"}</div>
                    <div className="text-[13px] text-ink-3">{gh ? `Signed in as @${(user?.name || "you").toLowerCase().replace(/\s+/g, "")} · repo access: selected repos` : "Two-way sync, branches and pull requests"}</div>
                  </div>
                  {gh ? (
                    <span className="flex items-center gap-1 text-[13px] text-ok font-medium"><Check className="h-4 w-4" /> Connected</span>
                  ) : (
                    <Button
                      variant="dark"
                      loading={ghBusy}
                      onClick={async () => {
                        setGhBusy(true);
                        await new Promise((r) => setTimeout(r, 900));
                        setGh(true);
                        setGhBusy(false);
                        toast("GitHub connected (simulated OAuth)", "info");
                      }}
                    >
                      Connect
                    </Button>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-[12px] text-ink-3">
                  {["Auto-commit every checkpoint", "Open PRs from Architect", "Import existing repos"].map((t) => (
                    <div key={t} className="flex items-center gap-1.5 rounded-lg bg-paper-2 px-2.5 py-2"><Check className="h-3 w-3 text-ok" /> {t}</div>
                  ))}
                </div>
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" size="lg" onClick={finish}>{next === "new" ? "Continue to my idea" : "Go to dashboard"} <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Onboarding() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
