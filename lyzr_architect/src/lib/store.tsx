"use client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Project, Settings, User } from "./types";
import { getSupabase, supabaseEnabled } from "./supabase";

const LS_USER = "a2.user";
const LS_PROJECTS = "a2.projects";
const LS_SETTINGS = "a2.settings";

const defaultSettings: Settings = {
  builderModel: "auto",
  defaultAgentModel: "auto",
  keyMode: "architect",
  byok: {},
  credits: 842,
  creditsTotal: 1000,
};

interface StoreCtx {
  ready: boolean;
  user: User | null;
  projects: Project[];
  settings: Settings;
  cloud: boolean;
  setUser: (u: User | null) => void;
  updateUser: (patch: Partial<User>) => void;
  signOut: () => Promise<void>;
  saveProject: (p: Project) => void;
  updateProject: (id: string, fn: (p: Project) => Project) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  setSettings: (fn: (s: Settings) => Settings) => void;
  spendCredits: (n: number) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

function read<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUserState] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [cloud, setCloud] = useState(false);
  const projectsRef = useRef<Project[]>([]);
  projectsRef.current = projects;

  // hydrate
  useEffect(() => {
    const localUser = read<User | null>(LS_USER, null);
    setProjects(read<Project[]>(LS_PROJECTS, []));
    setSettingsState(read<Settings>(LS_SETTINGS, defaultSettings));
    const sb = getSupabase();
    if (!sb) {
      setUserState(localUser);
      setReady(true);
      return;
    }
    sb.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      if (s?.user) {
        const meta = s.user.user_metadata || {};
        const provider = (s.user.app_metadata?.provider as User["provider"]) || "email";
        const u: User = {
          ...(localUser && localUser.id === s.user.id ? localUser : {}),
          id: s.user.id,
          email: s.user.email || "",
          name: meta.full_name || meta.name || meta.user_name || (s.user.email || "Builder").split("@")[0],
          avatar: meta.avatar_url,
          provider,
        };
        setUserState(u);
        write(LS_USER, u);
        setCloud(true);
        const { data: rows } = await sb.from("projects").select("data").order("updated_at", { ascending: false });
        if (rows && rows.length) {
          const remote = rows.map((r: { data: Project }) => r.data);
          setProjects(remote);
          write(LS_PROJECTS, remote);
        }
      } else {
        // demo users still allowed alongside cloud auth
        setUserState(localUser && localUser.provider === "demo" ? localUser : null);
      }
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (!session) setCloud(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) write(LS_USER, u);
    else localStorage.removeItem(LS_USER);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUserState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      write(LS_USER, next);
      return next;
    });
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setCloud(false);
    setUser(null);
  }, [setUser]);

  const persist = useCallback(
    (list: Project[], changed?: Project, removedId?: string) => {
      write(LS_PROJECTS, list);
      const sb = getSupabase();
      if (!sb || !cloud || !user) return;
      if (changed) {
        sb.from("projects")
          .upsert({ id: changed.id, user_id: user.id, name: changed.name, data: changed, updated_at: new Date().toISOString() })
          .then(({ error }) => error && console.warn("[a2] cloud save failed", error.message));
      }
      if (removedId) sb.from("projects").delete().eq("id", removedId).then(() => {});
    },
    [cloud, user]
  );

  const saveProject = useCallback(
    (p: Project) => {
      const list = [p, ...projectsRef.current.filter((x) => x.id !== p.id)];
      setProjects(list);
      persist(list, p);
    },
    [persist]
  );

  const updateProject = useCallback(
    (id: string, fn: (p: Project) => Project) => {
      const cur = projectsRef.current.find((x) => x.id === id);
      if (!cur) return;
      const next = { ...fn(cur), updatedAt: Date.now() };
      const list = projectsRef.current.map((x) => (x.id === id ? next : x));
      projectsRef.current = list;
      setProjects(list);
      persist(list, next);
    },
    [persist]
  );

  const deleteProject = useCallback(
    (id: string) => {
      const list = projectsRef.current.filter((x) => x.id !== id);
      setProjects(list);
      persist(list, undefined, id);
    },
    [persist]
  );

  const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);

  const setSettings = useCallback((fn: (s: Settings) => Settings) => {
    setSettingsState((prev) => {
      const n = fn(prev);
      write(LS_SETTINGS, n);
      return n;
    });
  }, []);

  const spendCredits = useCallback(
    (n: number) => setSettings((s) => ({ ...s, credits: Math.max(0, +(s.credits - n).toFixed(1)) })),
    [setSettings]
  );

  return (
    <Ctx.Provider
      value={{ ready, user, projects, settings, cloud: cloud && supabaseEnabled, setUser, updateUser, signOut, saveProject, updateProject, deleteProject, getProject, setSettings, spendCredits }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
