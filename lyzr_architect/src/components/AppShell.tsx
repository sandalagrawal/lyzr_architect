"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Bot, Plug, Settings, Plus, LogOut, Gauge, Cloud, BookOpen, ChevronsUpDown, Store, BookMarked, Palette } from "lucide-react";
import { Github } from "@/components/icons";
import { Logo } from "./Logo";
import { HelpWidget } from "./HelpWidget";
import { PlansModal } from "./PlansModal";
import { Avatar, Button, cn } from "./ui";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/prompts", label: "Prompt Library", icon: BookMarked },
  { href: "/agents", label: "Agent Library", icon: Bot },
  { href: "/themes", label: "Themes", icon: Palette },
  { href: "/integrations", label: "Integrations & MCP", icon: Plug },
  { href: "/import", label: "Import project", icon: Github },
  { href: "/settings", label: "Models, keys & usage", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, ready, settings, signOut, cloud } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [plans, setPlans] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return <div className="min-h-screen" />;
  const pct = Math.round((settings.credits / settings.creditsTotal) * 100);

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-[248px] shrink-0 flex-col border-r border-line bg-paper-2/60 px-3 py-4 sticky top-0 h-screen">
        <div className="px-2">
          <Logo href="/home" />
        </div>
        <button className="mt-5 flex items-center justify-between rounded-lg border border-line bg-white px-2.5 py-2 text-left shadow-card hover:border-line-2">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-bp text-[11px] font-semibold text-white">{user.name[0]}</div>
            <div>
              <div className="text-[12.5px] font-medium leading-tight">{user.name.split(" ")[0]}&apos;s workspace</div>
              <div className="text-[11px] text-ink-4 leading-tight">Free plan</div>
            </div>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-ink-4" />
        </button>
        <Button variant="primary" className="mt-3 w-full" icon={<Plus className="h-4 w-4" />} onClick={() => router.push("/home#new")}>
          New project
        </Button>
        <nav className="mt-5 space-y-0.5">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 h-8 text-[13.5px] transition-colors",
                path === n.href ? "bg-white text-ink font-medium shadow-card" : "text-ink-3 hover:text-ink hover:bg-white/60"
              )}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
          <a href="https://docs.architect.new" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-lg px-2.5 h-8 text-[13.5px] text-ink-3 hover:text-ink hover:bg-white/60">
            <BookOpen className="h-4 w-4" /> Docs
          </a>
        </nav>
        <div className="mt-auto space-y-3">
          <HelpWidget />
          <div className="rounded-xl border border-line bg-white p-3 shadow-card">
            <div className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-1.5 font-medium"><Gauge className="h-3.5 w-3.5 text-bp" /> Credits</span>
              <span className="text-ink-3 tabular-nums">{Math.round(settings.credits)} / {settings.creditsTotal}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-paper-3 overflow-hidden">
              <div className="h-full rounded-full bg-bp" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-4">
              <Link href="/settings#usage" className="hover:text-ink">Resets in 12 days</Link>
              <button onClick={() => setPlans(true)} className="font-medium text-bp hover:underline">Upgrade</button>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setMenu(!menu)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/70">
              <Avatar name={user.name} src={user.avatar} />
              <div className="min-w-0 text-left">
                <div className="truncate text-[13px] font-medium">{user.name}</div>
                <div className="truncate text-[11.5px] text-ink-4 flex items-center gap-1">
                  {cloud && <Cloud className="h-3 w-3 text-ok" />} {user.email}
                </div>
              </div>
            </button>
            {menu && (
              <div className="absolute bottom-12 left-0 right-0 rounded-xl border border-line bg-white p-1 shadow-pop animate-in">
                <div className="px-2.5 py-2 text-[11.5px] text-ink-4">
                  {cloud ? "Synced to cloud (Supabase)" : user.provider === "demo" ? "Demo account · saved in this browser" : "Saved in this browser"}
                </div>
                <Link href="/settings" className="flex h-8 items-center gap-2 rounded-lg px-2.5 text-[13px] hover:bg-paper-2"><Settings className="h-3.5 w-3.5" /> Settings</Link>
                <button
                  onClick={async () => {
                    await signOut();
                    router.replace("/");
                  }}
                  className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-[13px] text-bad hover:bg-bad-soft"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
      <PlansModal open={plans} onClose={() => setPlans(false)} />
    </div>
  );
}
