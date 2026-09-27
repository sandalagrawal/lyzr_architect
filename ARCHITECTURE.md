# Architect 2.0 — Architecture

> Companion to the live prototype (https://lyzr-architect-snowy.vercel.app) and the diagram `architecture.png`.
> This document describes the **production architecture** I'd build. The prototype implements the product surface (all flows), real auth + database (Supabase), and real agent calls (Lyzr Agent API); the build engine, sandboxes and deploys are simulated in the UI.

---

## 1. The one architectural decision everything follows from

**The project's Git repo is the single source of truth.** Every surface of the product is a *view* over that repo:

| Surface | What it reads/writes |
|---|---|
| Outcome (chat + preview) | Builder agent writes files → preview hot-reloads from the sandbox |
| Blueprint (cards) | `architect/spec.yaml`, `architect/prd.md` |
| Agents | `agents/<id>/agent.yaml`, `instructions.md`, `skills/`, `knowledge/` (GitAgent-compatible) |
| Code (IDE) | Any file, directly |
| History / Restore | `git log` / `git revert` — a checkpoint *is* a commit |

Consequences: the three depths can never drift out of sync, GitHub two-way sync is "just Git", importing a repo only requires adding `architect/spec.yaml`, and publishing an agent to the Library is tagging a folder with a version.

---

## 2. System overview

```
Browser (Next.js app: Outcome / Blueprint / Code / Agents / Deploy)
   │  HTTPS + WebSocket (chat stream, build events, terminal, LSP)
   ▼
Edge / API Gateway ── auth (Supabase Auth / SSO), rate limits, tenant routing
   │
   ├── Control Plane API (stateless, horizontally scaled)
   │     projects · members/RBAC · credits/billing · Agent Library · marketplace · audit log
   │
   ├── Orchestrator (Temporal durable workflows)
   │     build task · wire-up · test/eval run · deploy · import · security scan
   │        │
   │        ├── Builder Agent Harness ──► LLM Gateway (model proxy) ──► OpenAI / Anthropic / Google / OSS / Lyzr
   │        │        │ tool calls
   │        │        ▼
   │        └── Sandbox Fleet (Firecracker microVM per project)
   │                 repo checkout · dev server · terminal · test runner · headless browser
   │                 all egress ──► Egress Proxy (allowlist, secret injection, logging)
   │
   ├── Git Service ── internal bare repos ⇄ GitHub App (webhooks, installation tokens, PRs, checks)
   ├── Agent Runtime ── Lyzr Agent Studio (default) or LangGraph / CrewAI / OpenAI Agents SDK workers
   └── Deploy Pipeline ── isolated builder → artifact registry → edge/serverless hosting (preview + prod)

Data: Postgres (RLS) · Redis (sessions, pub/sub) · Object storage (snapshots, artifacts, uploads)
      Vector store (knowledge bases) · Secrets vault (KMS-encrypted) · ClickHouse/OTel (traces, usage)
```

---

## 3. Sandboxing

**Choice:** one **Firecracker microVM per project** (via E2B, or self-run on Fly Machines / AWS bare-metal), not shared containers.

- **Why microVMs:** the builder agent runs arbitrary code (npm install, user code, agent-generated scripts). Containers share a kernel; microVMs give VM-grade isolation with ~150 ms boot.
- **Lifecycle:** warm pool of pre-booted images per template (Next.js, Python/FastAPI) → claim on project open → **snapshot + hibernate after 10 min idle** → restore from snapshot in <1 s on return. Long-running work (builds, evals) keeps it awake.
- **Limits:** 2 vCPU / 4 GB default, disk quota, max process count, wall-clock caps per task; upgraded on paid plans.
- **Network:** no direct internet. All egress goes through the **Egress Proxy** with a per-project allowlist (package registries, the project's declared integrations, Lyzr/LLM endpoints). Every request is logged for the audit trail.
- **Secrets:** never written to disk inside the sandbox. The egress proxy injects credentials at request time (e.g. adds the Gmail OAuth token to calls to `gmail.googleapis.com`), so a compromised agent can't exfiltrate raw keys.
- **Preview URLs:** `<project>-<hash>.sandbox.architect.new` routed by the edge to the sandbox's dev-server port, protected by a signed short-lived token (shareable preview links mint read-only tokens).
- **Terminal / IDE:** WebSocket PTY into the sandbox; LSP (TypeScript, Python) runs in the sandbox for real diagnostics in the Code view.

---

## 4. The agent harness (the builder)

The builder is itself an agent running in a **plan → act → verify** loop, orchestrated as a Temporal workflow so it survives restarts and can be stopped mid-run.

1. **Context assembly:** `spec.yaml` + PRD + a repo map (tree-sitter symbol index) + the files relevant to the request (embedding search) + the selected preview element (when the user clicked one) + recent errors from the dev server.
2. **Plan:** produce a step list and a **credit estimate** shown to the user *before* running (Plan mode stops here).
3. **Act:** tool calls against the sandbox: `read_file`, `write_file` (diff-based edits), `run` (shell), `search`, `install`, `browser` (Playwright), `git`.
4. **Verify:** type-check, lint, unit tests, and the **testing agent** — a headless browser that clicks through the main user journeys and screenshots them. Failures loop back into Act (bounded retries).
5. **Commit:** every successful step becomes a Git commit with a human-readable summary → shown as a checkpoint in chat and History.

**Modes map to permissions:** *Ask* = read-only tools; *Plan* = read + estimate; *Build* = full toolset. **Guardrails:** max steps and max credits per task, protected paths (e.g. `.env`, migrations need confirmation), destructive-command denylist, human approval for schema drops.

**Mock-first building** is a harness strategy, not a UI trick: the first build generates the UI against typed mock agent responses (`mocks/agents.ts`); *Wire it up* is a separate workflow that creates the real agents, DB schema, API route and tests, then swaps the mocks out and re-runs verification. This makes the expensive/backend part happen only after the user has approved the experience.

**Harness quality** is measured with an eval suite of reference prompts (build success rate, tests passing, testing-agent journey success, cost per build) that runs on every harness or model change.

---

## 5. The proxy layer

Two proxies, deliberately separate:

**a) LLM Gateway (model proxy)** — every model call from the builder, from user agents, and from the app's runtime goes through it.
- Unified request/response schema across providers (OpenAI, Anthropic, Google, Llama/vLLM, Lyzr).
- **Metering:** tokens → credits per user/project/agent (powers the credits meter and per-agent cost).
- **BYOK:** if the workspace supplied its own key, route with that key and don't charge credits.
- Fallbacks and retries across providers, prompt caching, per-tenant rate limits and budgets.
- **Safety:** PII redaction and prompt-injection classification on inputs; output schema validation.
- Emits OpenTelemetry spans → powers the **Test & trace** view and the audit log.

**b) Egress Proxy (sandbox network)** — described in §3: allowlisting, secret injection, logging.

---

## 6. Model-agnosticism

- Every agent declares its model in `agent.yaml` (`model: auto | gpt-5 | claude-sonnet | gemini-pro | llama-70b`). Code never imports a provider SDK directly — it calls the gateway.
- **`auto` routing:** a small router picks a model per step using task type (code edit vs. long-context read vs. cheap classification), cost ceiling, and **eval results** — we keep a capability/quality matrix per task type, refreshed by the eval suite, so routing is evidence-based, not hard-coded.
- **Framework-agnostic agents:** the agent definition (instructions, tools, knowledge, guardrails) is framework-neutral; adapters render it as a Lyzr agent (default, managed memory/RAG/guardrails), GitAgent files, LangGraph, CrewAI, OpenAI Agents SDK or Mastra. The app calls agents through one SDK (`agents.use("<id>@<version>")`), so switching framework or model doesn't change call sites.
- The builder model is chosen independently from app-agent models.

---

## 7. GitHub integration

- **GitHub App, not personal OAuth tokens:** fine-grained per-repo permissions, short-lived installation tokens, org-admin friendly.
- **Internal Git first:** every project has an internal bare repo from minute one (so non-technical users never need GitHub). Connecting GitHub adds a remote and mirrors history.
- **Two-way sync:** Architect → GitHub: push on every checkpoint (or on `architect/*` branches + PRs in team mode). GitHub → Architect: `push` webhooks trigger a fetch into the sandbox; if the user has uncommitted work, we rebase or surface a conflict (in Blueprint for non-developers, as a merge view in Code for developers).
- **Pull requests:** created via the API with an AI-written description; our pipeline posts **Check Runs** (build, tests, agent evals, security scan) and a preview-deployment link.
- **Import:** clone → detect stack/agents/DB/env vars → write only `architect/spec.yaml` → open in the chosen depth.

---

## 8. Deployment

- **Isolated builder** (separate from dev sandboxes) produces an immutable artifact per commit.
- **Frontend + API routes** → edge/serverless hosting (Vercel-style: static assets on CDN, functions per route). **Agents** → Lyzr Agent Runtime (or containerised workers for non-Lyzr frameworks) versioned alongside the commit.
- **Environments:** every branch/PR gets a preview; production is promoted explicitly. Promotion and **rollback are alias swaps** (instant, no rebuild).
- **Pre-flight gates:** tests, agent evals, security scan (secrets, RLS, rate limits, prompt injection, PII) and missing-secret checks run before deploy; criticals block production.
- **Secrets:** per-environment, stored in a KMS-backed vault, injected at runtime.
- **Custom domains:** CNAME + automatic TLS (ACME). **Database migrations** run as a gated step with automatic backup snapshot.

---

## 9. Scaling

- **Stateless services** (API, gateway, proxies) scale horizontally behind the edge; **Temporal** holds workflow state so builds/deploys are durable and resumable.
- **Sandbox fleet** is the main cost driver → warm pools sized by time-of-day demand, aggressive hibernation with snapshots, bin-packing on large hosts, per-plan quotas.
- **LLM cost** is controlled by routing to the cheapest adequate model, prompt caching, repo-map context (not whole-repo stuffing), and hard per-task budgets.
- **Multi-tenant data:** Postgres with row-level security (tenant_id on every row), read replicas for dashboards, ClickHouse for traces/usage analytics, object storage for snapshots and artifacts.
- **Multi-region:** control plane in two regions; sandboxes and deploys placed near the user or pinned to a region for data residency (Enterprise).
- **Observability:** OpenTelemetry across harness, gateway and runtime → one trace from "user message" to "commit" to "deploy".

---

## 10. Tech choices at a glance

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js + TypeScript + Tailwind | Same stack we generate; fast iteration |
| Auth | Supabase Auth (email, Google, GitHub) → SSO/SCIM for Enterprise | Works today in the prototype |
| Core DB | Postgres with RLS (Supabase) | Tenant isolation at the data layer |
| Workflows | Temporal | Durable, cancellable long-running builds/deploys |
| Sandboxes | Firecracker microVMs (E2B / Fly Machines) | VM isolation, fast snapshot/restore |
| Model access | LLM Gateway (LiteLLM-style, or Lyzr gateway) | Provider-agnostic, metering, BYOK, safety |
| Agents | Lyzr Agent Studio + framework adapters | Managed memory/RAG/guardrails, no lock-in |
| Git | Internal bare repos + GitHub App | Non-technical users need no GitHub; devs get full sync |
| Deploy | Edge/serverless hosting + Lyzr runtime | Instant previews, alias-swap rollback |
| Secrets | KMS-backed vault, proxy injection | Keys never enter sandboxes or code |
| Observability | OpenTelemetry → ClickHouse | Per-agent traces, costs, audit log |

---

## 11. What the prototype implements today

| Real | Simulated (UI flows designed end to end) |
|---|---|
| Supabase Auth (email/password, magic link, Google), per-user projects in Postgres with RLS, profile/onboarding in user metadata | Code generation, sandboxes, terminal, deploys |
| Lyzr Agent API calls (agent test console, app "Run", PRD refinement, Ask mode) when a key is configured | GitHub App sync, PR checks, integrations OAuth |
| Preview click-to-edit, theming (CSS token import), checkpoints/restore, IDE edits + diffs, artifact downloads | Security scan results, evals, usage metering |
