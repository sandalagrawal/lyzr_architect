"use client";
import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { Spinner } from "@/components/ui";

export default function AuthCallback() {
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      location.replace("/login");
      return;
    }
    let done = false;
    const go = (metaOnboarded = false) => {
      if (done) return;
      done = true;
      let next = "";
      try {
        next = localStorage.getItem("a2.next") || "";
        localStorage.removeItem("a2.next");
      } catch {}
      let onboarded = metaOnboarded;
      try {
        onboarded = onboarded || Boolean(JSON.parse(localStorage.getItem("a2.user") || "{}").onboarded);
      } catch {}
      // full reload so the store re-hydrates with the new session
      location.replace(onboarded ? (next === "new" ? "/login?next=new" : next === "import" ? "/import" : "/home") : `/onboarding${next ? `?next=${next}` : ""}`);
    };
    const code = new URLSearchParams(location.search).get("code");
    (async () => {
      if (code) await sb.auth.exchangeCodeForSession(code).catch(() => {});
      const { data } = await sb.auth.getSession();
      if (data.session) go(Boolean(data.session.user.user_metadata?.onboarded));
    })();
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => s && go(Boolean(s.user.user_metadata?.onboarded)));
    const t = setTimeout(() => !done && location.replace("/login"), 8000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);
  return (
    <div className="min-h-screen grid place-items-center text-ink-3 text-[14px]">
      <div className="flex items-center gap-2">
        <Spinner /> Signing you in…
      </div>
    </div>
  );
}
