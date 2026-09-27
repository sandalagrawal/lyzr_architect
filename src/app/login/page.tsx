"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import { Github } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { Button, Input, Label, toast } from "@/components/ui";
import { useStore } from "@/lib/store";
import { enabledProviders, getSupabase, supabaseEnabled } from "@/lib/supabase";
import type { User } from "@/lib/types";
import { resolveNext } from "@/lib/nav";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const { user, ready, setUser } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace(afterAuthPath(user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  function afterAuthPath(u: User) {
    if (!u.onboarded) return `/onboarding${next ? `?next=${next}` : ""}`;
    return resolveNext(next);
  }

  async function oauth(provider: "google" | "github") {
    setBusy(provider);
    const sb = getSupabase();
    const realOAuth = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS || "").split(",").map((x) => x.trim()).includes(provider) || Boolean((await enabledProviders())[provider]);
    if (sb && realOAuth) {
      try {
        localStorage.setItem("a2.next", next || "");
      } catch {}
      const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/auth/callback` } });
      if (error) {
        toast(error.message, "warn");
        setBusy(null);
      }
      return;
    }
    await new Promise((r) => setTimeout(r, 700));
    demoLogin(provider);
    if (sb) toast(`${provider === "google" ? "Google" : "GitHub"} sign-in is simulated here — email sign-in is real`, "info");
  }

  function demoLogin(provider: User["provider"], mail?: string) {
    const name = mail ? mail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Sandal Agrawal";
    const u: User = { id: "demo_" + (mail || provider), name, email: mail || "demo@architect.new", provider: provider === "email" ? "email" : "demo" };
    setUser(u);
    toast(supabaseEnabled ? "Signed in to demo workspace" : "Demo mode — sign-in is simulated", "info");
  }

  async function emailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return toast("Enter a valid email", "warn");
    setBusy("email");
    const sb = getSupabase();
    if (sb) {
      if (password) {
        const res =
          mode === "signup"
            ? await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } })
            : await sb.auth.signInWithPassword({ email, password });
        setBusy(null);
        if (res.error) return toast(res.error.message, "warn");
        if (mode === "signup" && !res.data.session) {
          setSent(true);
          return;
        }
        location.href = "/auth/callback";
        return;
      }
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
      setBusy(null);
      if (error) return toast(error.message, "warn");
      setSent(true);
      return;
    }
    await new Promise((r) => setTimeout(r, 600));
    demoLogin("email", email);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 sm:px-12 py-8">
        <Logo />
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[360px] mx-auto animate-in">
            {sent ? (
              <div className="text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-bp-soft text-bp"><Mail className="h-5 w-5" /></div>
                <h1 className="mt-5 text-[22px] font-semibold tracking-tight">Check your inbox</h1>
                <p className="mt-2 text-[14px] text-ink-3">We sent a sign-in link to <b className="text-ink">{email}</b>. It expires in 1 hour.</p>
                <Button variant="ghost" className="mt-6" onClick={() => setSent(false)}>Use a different email</Button>
              </div>
            ) : (
              <>
                <h1 className="text-[26px] font-semibold tracking-tight">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
                <p className="mt-1.5 text-[14px] text-ink-3">
                  {next === "new" ? "Sign in to turn your idea into an app — we saved your prompt." : "Build, test and ship agentic apps."}
                </p>
                <div className="mt-7 space-y-2.5">
                  <Button size="lg" className="w-full" icon={<GoogleIcon />} loading={busy === "google"} onClick={() => oauth("google")}>
                    Continue with Google
                  </Button>
                  <Button size="lg" className="w-full" icon={<Github className="h-4 w-4" />} loading={busy === "github"} onClick={() => oauth("github")}>
                    Continue with GitHub
                  </Button>
                </div>
                <div className="my-6 flex items-center gap-3 text-[11.5px] text-ink-4">
                  <div className="h-px flex-1 bg-line" /> or with email <div className="h-px flex-1 bg-line" />
                </div>
                <form onSubmit={emailAuth} className="space-y-3">
                  <div>
                    <Label>Work email</Label>
                    <Input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label hint="Leave empty for a magic link">Password</Label>
                    <Input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" variant="dark" size="lg" className="w-full" loading={busy === "email"}>
                    {password ? (mode === "signin" ? "Sign in" : "Create account") : "Email me a sign-in link"} <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
                <p className="mt-5 text-center text-[13px] text-ink-3">
                  {mode === "signin" ? "New to Architect? " : "Already have an account? "}
                  <button className="font-medium text-bp hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
                    {mode === "signin" ? "Create an account" : "Sign in"}
                  </button>
                </p>
                <div className="mt-8 rounded-xl border border-dashed border-line-2 p-3 text-[12.5px] text-ink-3 flex items-center justify-between gap-3">
                  <span>Just looking around?</span>
                  <button className="font-medium text-ink hover:text-bp" onClick={() => demoLogin("demo")}>Explore the demo workspace →</button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11.5px] text-ink-4">
          <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> {supabaseEnabled ? "Secured by Supabase Auth" : "Demo mode · auth simulated"}</span>
          <span>SOC 2 · SSO on Enterprise</span>
        </div>
      </div>

      <div className="hidden lg:flex relative bg-ink text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[.35] grid-paper" />
        <div className="relative m-auto max-w-md px-10">
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5 backdrop-blur">
            <div className="text-[11px] uppercase tracking-[0.14em] text-white/50">Build log · GradeMate</div>
            <div className="mt-4 space-y-2.5 font-mono text-[12.5px]">
              {[
                ["✓", "PRD approved · 3 agents, 4 pages", "text-[#7CE0A5]"],
                ["✓", "UI preview built with mocked agents", "text-[#7CE0A5]"],
                ["✓", "Repo created · sandal/grademate", "text-[#7CE0A5]"],
                ["✓", "Evaluator agent live on Lyzr · 1.8s", "text-[#7CE0A5]"],
                ["●", "Security scan · 0 critical issues", "text-[#9DAEFF]"],
              ].map(([i, t, c]) => (
                <div key={t} className="flex gap-2.5">
                  <span className={c}>{i}</span>
                  <span className="text-white/80">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-8 text-[20px] leading-snug font-medium tracking-tight">
            “I described it on Monday. On Tuesday my engineer opened the same project in Code mode and shipped it.”
          </p>
          <p className="mt-3 text-[13px] text-white/50">The Architect 2.0 promise</p>
          <div className="mt-8 flex items-center gap-2 text-[12px] text-white/50">
            <ShieldCheck className="h-4 w-4" /> Your code lives in your GitHub. Your data never trains models.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
