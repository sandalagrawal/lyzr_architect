import { NextResponse } from "next/server";
import { callLyzr, lyzrConfigured } from "@/lib/server/lyzr";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ configured: lyzrConfigured() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { input, agent, sessionId, apiKey, agentId } = body as {
    input?: string;
    agent?: { name: string; role: string; instructions: string; tools?: string[] };
    sessionId?: string;
    apiKey?: string;
    agentId?: string;
  };
  if (!input || typeof input !== "string" || input.length > 6000) {
    return NextResponse.json({ error: "input is required (max 6000 chars)" }, { status: 400 });
  }
  if (!lyzrConfigured(apiKey, agentId)) {
    return NextResponse.json({ live: false, reason: "not_configured" });
  }
  const message = agent
    ? `You are acting as "${agent.name}" — ${agent.role}.\nInstructions: ${agent.instructions}\n${agent.tools?.length ? `You may describe how you would use these tools: ${agent.tools.join(", ")}.\n` : ""}Keep the answer under 180 words and use short markdown bullets where helpful.\n\nInput:\n${input}`
    : input;
  try {
    const r = await callLyzr({ message, sessionId, apiKey, agentId });
    return NextResponse.json({ live: true, ...r });
  } catch (e) {
    return NextResponse.json({ live: false, reason: "error", error: (e as Error).message }, { status: 502 });
  }
}
