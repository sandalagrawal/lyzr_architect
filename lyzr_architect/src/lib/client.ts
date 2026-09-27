"use client";
import type { AgentSpec, Settings } from "./types";

export interface AgentRunResult {
  live: boolean;
  response?: string;
  latencyMs?: number;
  reason?: string;
  error?: string;
}

export async function runAgent(agent: Pick<AgentSpec, "name" | "role" | "instructions" | "tools">, input: string, settings?: Settings, sessionId?: string): Promise<AgentRunResult> {
  try {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input,
        agent,
        sessionId,
        apiKey: settings?.byok?.lyzr_key || undefined,
        agentId: settings?.byok?.lyzr_agent || undefined,
      }),
    });
    return (await res.json()) as AgentRunResult;
  } catch (e) {
    return { live: false, reason: "network", error: (e as Error).message };
  }
}

export async function lyzrStatus(): Promise<boolean> {
  try {
    const r = await fetch("/api/agent");
    const j = await r.json();
    return Boolean(j.configured);
  } catch {
    return false;
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function mockAgentReply(agent: Pick<AgentSpec, "name" | "role">, input: string) {
  const short = input.length > 60 ? input.slice(0, 60) + "…" : input;
  return `**${agent.name}** processed “${short}”.\n\n- Understood the goal and gathered context\n- Produced a draft result with 3 key points\n- Confidence: 0.82 — ready for review\n\n_Simulated run — add a Lyzr API key in Settings → Models & keys to run this agent for real._`;
}
