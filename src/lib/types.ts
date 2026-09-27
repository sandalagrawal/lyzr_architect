export type Depth = "outcome" | "blueprint" | "code";
export type Stage = "planning" | "ui" | "wired" | "deployed";

export interface User {
  id: string;
  name: string;
  email: string;
  provider: "google" | "github" | "email" | "demo";
  avatar?: string;
  depthPref?: Depth;
  role?: string;
  onboarded?: boolean;
}

export interface AgentSpec {
  id: string;
  name: string;
  role: string;
  model: string;
  tools: string[];
  instructions: string;
  knowledge?: string[];
  framework?: string;
  live?: boolean;
  libraryId?: string;
}

export interface PageSpec { name: string; route: string; purpose: string }
export interface TableSpec { name: string; fields: { name: string; type: string }[] }

export interface Spec {
  appName: string;
  tagline: string;
  audience: string;
  domain: string;
  pages: PageSpec[];
  agents: AgentSpec[];
  data: TableSpec[];
  integrations: string[];
  auth: boolean;
}

export interface Checkpoint {
  id: string;
  sha: string;
  label: string;
  summary: string;
  at: number;
  files: string[];
  author: "architect" | "you";
  branch?: string;
  snap?: { theme: Project["theme"]; content: Record<string, string>; stage: Stage; spec: Spec; files: Record<string, string> };
}

export interface Deployment {
  id: string;
  env: "preview" | "production";
  sha: string;
  url: string;
  at: number;
  status: "ready" | "building" | "failed" | "rolled-back";
}

export interface Step { label: string; file?: string; kind?: "read" | "write" | "run" | "think" }
export interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
  steps?: Step[];
  checkpoint?: string;
  at: number;
}

export interface Project {
  id: string;
  name: string;
  prompt: string;
  createdAt: number;
  updatedAt: number;
  stage: Stage;
  spec: Spec;
  prd: string;
  answers: Record<string, string | string[]>;
  checkpoints: Checkpoint[];
  deployments: Deployment[];
  chat: Msg[];
  github?: { repo: string; branch: string; autoCommit: boolean; org: string };
  theme: { accent: string; radius: number; dark: boolean; font: "sans" | "serif" | "mono"; bg?: string; text?: string; name?: string };
  content: Record<string, string>;
  files: Record<string, string>;
  env: Record<string, string>;
  source?: { type: "prompt" | "github" | "zip" | "template"; ref?: string };
  integrations: string[];
  security?: { lastScan: number; fixed: string[] };
  branch?: string;
  branches?: string[];
  prs?: { id: number; title: string; head: string; base: string; status: "open" | "merged"; at: number }[];
  publishedAgents?: Record<string, string>;
  artifacts?: Artifact[];
  subdomain?: string;
}

export interface Artifact {
  id: string;
  kind: "spec" | "deck" | "research" | "guide";
  title: string;
  at: number;
  body: string; // markdown; for decks, slides separated by "\n---\n"
}

export interface Settings {
  builderModel: string;
  defaultAgentModel: string;
  keyMode: "architect" | "byok";
  byok: Record<string, string>;
  credits: number;
  creditsTotal: number;
}
