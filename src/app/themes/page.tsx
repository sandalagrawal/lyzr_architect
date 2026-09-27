"use client";
import { AppShell } from "@/components/AppShell";
import { ThemeGrid } from "@/components/ThemeManager";

export default function ThemesPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-[26px] font-semibold tracking-tight">Themes</h1>
        <p className="mt-1 text-[14px] text-ink-3">Import your design system once. Every new app starts on-brand, and you can switch any app&apos;s theme from its preview.</p>
        <ThemeGrid />
      </div>
    </AppShell>
  );
}
