const ENDPOINT = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";

export interface LyzrCall {
  message: string;
  sessionId?: string;
  userId?: string;
  apiKey?: string;
  agentId?: string;
}

export function lyzrConfigured(apiKey?: string, agentId?: string) {
  return Boolean((apiKey || process.env.LYZR_API_KEY) && (agentId || process.env.LYZR_AGENT_ID));
}

export async function callLyzr({ message, sessionId, userId, apiKey, agentId }: LyzrCall) {
  const key = apiKey || process.env.LYZR_API_KEY;
  const agent = agentId || process.env.LYZR_AGENT_ID;
  if (!key || !agent) throw new Error("Lyzr is not configured");
  const t0 = Date.now();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({
      user_id: userId || "architect-2-demo",
      agent_id: agent,
      session_id: sessionId || `${agent}-${Date.now()}`,
      message,
    }),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Lyzr ${res.status}: ${text.slice(0, 200)}`);
  let response = text;
  try {
    const j = JSON.parse(text);
    response = typeof j.response === "string" ? j.response : JSON.stringify(j.response ?? j);
  } catch {}
  return { response, latencyMs: Date.now() - t0 };
}
