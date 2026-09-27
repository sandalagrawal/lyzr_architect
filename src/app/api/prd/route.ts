import { NextResponse } from "next/server";
import { callLyzr, lyzrConfigured } from "@/lib/server/lyzr";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { prompt, spec, draft, apiKey, agentId } = await req.json().catch(() => ({}));
  if (!prompt || !spec) return NextResponse.json({ error: "prompt and spec required" }, { status: 400 });
  if (!lyzrConfigured(apiKey, agentId)) return NextResponse.json({ live: false });
  const message = `You are a senior product manager. Improve this PRD draft for an agentic web app. Keep the exact same markdown section headings (# title, ## Problem, ## Users, ## Core user journey, ## Agents, ## Pages, ## Data, ## Success metrics, ## Out of scope (v1)). Make the Problem and Success metrics sections sharper and specific to the request. Keep it under 450 words. Return ONLY the markdown.\n\nRequest: ${prompt}\n\nDraft:\n${draft}`;
  try {
    const r = await callLyzr({ message, apiKey, agentId });
    const md = r.response.replace(/^```(?:markdown|md)?\s*/i, "").replace(/```\s*$/, "").trim();
    if (!md.startsWith("#")) return NextResponse.json({ live: false });
    return NextResponse.json({ live: true, prd: md, latencyMs: r.latencyMs });
  } catch (e) {
    return NextResponse.json({ live: false, error: (e as Error).message });
  }
}
