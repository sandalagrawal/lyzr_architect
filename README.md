# Architect 2.0: build agentic apps at the depth you want

A product concept and working prototype for the next version of [Architect by Lyzr](https://architect.new). I built it as the Technical PM assignment.

> **Live demo:** _add Vercel URL_ · **Fastest way to explore:** sign in → **Explore the demo workspace** → **Open example: GradeMate**

---

## The one idea

Today's Architect serves non-technical builders. The brief asks for 2.0 to serve developers as well. The obvious answer is to ship two products: a "no-code mode" and a "pro mode". I think that's the wrong split.

**The split isn't technical vs non-technical. It's how much control someone wants at a given moment.** A founder sometimes wants to look at the code. An engineer often just wants to say "make it nicer". So 2.0 is **one project with three depths**, and a switch in the top bar (`⌘1 / ⌘2 / ⌘3`) moves between them:

| Depth | Who lives here | What they see |
|---|---|---|
| **Outcome** | Founders, ops, business users | Chat plus a live, clickable preview. Changes are explained in plain English. |
| **Blueprint** | PMs, designers, tech leads | Pages, agents, data and integrations as editable cards, plus the PRD |
| **Code** | Developers | A full IDE: file tree, editor, diffs, terminal, tests, branches and PRs |

**Why the three views never drift apart:** every view reads and writes **the same Git repo**. A Blueprint card *is* a file (`agents/<id>/agent.yaml`, `architect/spec.yaml`). A preview edit *is* a commit. "History → Restore" in Outcome and `git log` in Code show the same data at different depths. This builds on the direction Architect already started with GitAgent.

```
Discovery → PRD/Specs ─► architect/prd.md, spec.yaml     (Blueprint)
Preview edits ─────────► app/**                           (Outcome)
Agent studio ──────────► agents/<id>/agent.yaml           (Agents)  ──► publish ► Agent Library
IDE ───────────────────► any file                         (Code)
                       every change = a commit ─► GitHub sync ─► scan ─► preview ─► production
```

## The end-to-end flow

1. **Auth.** Google, GitHub or email (password or magic link) through Supabase. A saved prompt survives sign-in, so you never lose your idea.
2. **Onboarding.** Three quick steps: your role, how you like to build (this sets the *default* depth only), and optionally connecting GitHub.
3. **Home.** One composer with three ways to start: **Describe**, **Import** or **Template**. It also has a builder-model picker and a **Plan first** toggle (on for newcomers; developers can skip straight to building).
4. **Discovery.** An AI consultant asks five questions, one at a time, as clickable choices. It explains *why* it's asking, and you can skip with smart defaults.
5. **PRD.** An editable doc, with the "what I heard" answers on the side and a box for "ask for a change". If a Lyzr key is configured, a live Lyzr agent refines the PRD.
6. **Specs.** Agents (model per agent), pages, data and integrations as cards you approve. **A credit estimate is shown before anything runs.**
7. **UI preview.** The UI is built live in front of you: skeletons fill in section by section while the chat streams each file it writes. Agents are **mocked** at this stage, so you perfect the experience before spending on backend work.
   - **Click-to-edit.** Click any element in the preview to change its text or colour, or hand it to the AI with the element as context.
   - Device toggles for desktop, tablet and mobile, and a page switcher.
8. **Wire it up.** The agents, database (with RLS), API route and tests get generated. You see the swap from mocks to live agents happen.
9. **Deploy.** Pre-flight checks run first (tests, agent evals, security scan, missing secrets with inline fixes). Then streaming build logs, and then a URL. The deploy history supports promote and **one-click rollback**, and there's a custom-domain step.

## Agent-native features (what makes this *Architect* and not another vibe-coder)

- **Agent studio.** Configure each agent (instructions, per-agent model with cost hints, tools, MCP, knowledge, guardrails), then:
  - **Test & trace:** a real call to Lyzr's Agent API when a key is set, with a step-by-step trace (guardrails → plan → tools → LLM → guardrails) plus latency and cost.
  - **Evals:** a regression suite that runs before every deploy.
  - **Any framework:** the same agent can run as Lyzr, GitAgent, LangGraph, CrewAI, OpenAI Agents SDK or Mastra. The code view updates live.
- **Agent Library.** Publish any agent with a semantic version. Other apps pull it in **as a plugin** through the SDK, REST or MCP, and apps pinned to an older version never break.
- **Security & sandbox.** Every project runs in an isolated sandbox with an egress allowlist. A scan catches leaked secrets, missing RLS, unprotected routes, prompt injection and PII in logs, and offers one-click AI fixes. Critical issues are flagged before deploy.

## For developers specifically

- An IDE with syntax highlighting, tabs, `⌘S`, search, a **diff view** against Architect's version, a **source control** panel (commit, commit & push, branches) and **pull requests** with an AI-written description and checks.
- A terminal that answers `git status | log | branch | checkout -b | commit`, `npm test | build | run dev`, `architect agents | deploy`.
- **Split with preview**, so you can see code and app side by side.
- **Import** from GitHub, a ZIP or a Git URL. Architect detects the stack, the agents (in *their* framework), the DB and missing env vars, and changes nothing except adding `architect/spec.yaml`.
- Chat has three modes: **Build** (makes changes), **Plan** (discusses only, nothing changes) and **Ask** (read-only Q&A about the code).
- Bring your own keys, or use one Architect balance for every model.

## Parity with today's Architect

I checked parity against Architect's public docs index and changelog. Every current capability has a place in 2.0, usually at more than one depth:

| Architect today | Where it lives in 2.0 |
|---|---|
| AI Consultant (role → bottleneck → tools → tailored ideas) | Home → **Get ideas** (ideas with hours saved/week → one-click build) |
| Direct prompting, Planning & brainstorming, Plan Mode | Home composer with **Plan first** toggle → Discovery → PRD → Specs; chat **Plan** mode |
| Agents via Lyzr Studio | **Agents** tab: configure, test & trace, evals, any framework, publish |
| Live app generation, testing agent | Live build with mocked agents → **Wire it up**; testing-agent step in every build |
| Custom theme (Figma / PDF / GitHub / ZIP / CSS) | **Themes** page + **Theme** button in the preview: import → token editor → live preview → apply |
| Database & authentication | Auto-provisioned on wire-up; **Database** tab (rows, schema, access rules) |
| Deployment & publishing, re-deploy, GitHub-free deploys, URL renaming | **Deploy** flow with pre-flight checks; **Deploys** tab (rollback, promote, rename URL, custom domain) |
| GitHub integration, branch switching, repo imports | GitHub modal (two-way sync), IDE source control & PRs, **Import** (GitHub / ZIP / URL) |
| Artifacts (spec PDF, slides, research docs) | **Artifacts** tab; ask the chat ("make a pitch deck") → view → download HTML/Markdown |
| Environment variables | **Apps → Secrets** (vault, per environment); missing ones are flagged at deploy |
| GitAgent | A framework option for any agent (SOUL/RULES/DUTIES file view) |
| Prompt Library | **Prompt Library** page (by business function) + library button inside chat |
| Sharing & collaboration | **Share**: roles (Viewer / Editor / Developer / Admin) + preview link |
| Marketplace (community apps) | **Marketplace**: try, inspect, **Remix**, publish |
| 30+ integrations, custom tools, MCP | **Integrations & MCP** (30 apps), OpenAPI custom tools, MCP servers |
| Usage, plans & credits, per-agent credits | Credits meter, usage breakdown, **Plans** modal, credits per agent, cost estimate before each action |
| Help & support | **Help & support**: docs, what's new, shortcuts, support chat, book a Forward Deployed Engineer, bug report |
| Enterprise: evals, audit logging, RBAC | Evals gate deploys; **Security → Audit log**; role-based sharing |

## What's real vs simulated

| Real | Simulated (designed as full flows) |
|---|---|
| Auth: Supabase email/password, magic link, Google/GitHub OAuth (when enabled in Supabase) | Code generation and the sandbox runtime |
| Database: projects saved per user in Supabase Postgres with row-level security | GitHub OAuth/push, deploy infra, custom domains |
| Lyzr Agent API: agent test console, the generated app's "Run" button, PRD refinement, Chat "Ask" mode | Security scan results, evals, integrations OAuth |
| Live preview editing, theme import from CSS (parsed for real), checkpoints/restore, IDE editing, diffs, branches, commits | |
| Artifacts: generated from the project and downloadable as real HTML/Markdown files | |

Without env vars the app runs in **demo mode**: auth is simulated and data lives in `localStorage`, so every flow still works.

## Run it

```bash
npm install
cp .env.example .env.local   # optional — see below
npm run dev
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Real auth and cloud-saved projects |
| `LYZR_API_KEY`, `LYZR_AGENT_ID` | Real agent runs (server-side; the key never reaches the browser) |

Supabase table:

```sql
create table public.projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text, data jsonb not null, updated_at timestamptz default now()
);
alter table public.projects enable row level security;
create policy "own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind, Supabase, Lyzr Agent API. Deployed on Vercel.

## What I'd do next (as PM)

1. **Instrument the depth switch.** How often do users change depth, and in which direction? That tells us whether "one product, three depths" holds up or whether some flows need their own home.
2. **Measure time to first live agent.** My hypothesis is that mock-first UI raises completion rates and lowers wasted credits. I'd A/B test it against building the backend first.
3. **Real two-way Git sync.** A GitHub App with webhooks, with conflicts resolved in Blueprint for non-developers and in Code for developers.
4. **Agent Library economics:** ratings, verified publishers, usage-based revenue share.

---

_Concept by Sandal Agrawal for Lyzr AI. Not affiliated with or endorsed by Lyzr; "Architect" is used only to reference the product being redesigned._
