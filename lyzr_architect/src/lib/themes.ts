"use client";
import { BUILTIN_THEMES, type ThemeDef } from "./catalog";

const K = "a2.themes";
export function loadThemes(): ThemeDef[] {
  try {
    const mine = JSON.parse(localStorage.getItem(K) || "[]") as ThemeDef[];
    return [...mine, ...BUILTIN_THEMES];
  } catch {
    return BUILTIN_THEMES;
  }
}
export function saveTheme(t: ThemeDef) {
  try {
    const mine = JSON.parse(localStorage.getItem(K) || "[]") as ThemeDef[];
    localStorage.setItem(K, JSON.stringify([t, ...mine.filter((x) => x.id !== t.id)]));
  } catch {}
}
export function deleteTheme(id: string) {
  try {
    const mine = JSON.parse(localStorage.getItem(K) || "[]") as ThemeDef[];
    localStorage.setItem(K, JSON.stringify(mine.filter((x) => x.id !== id)));
  } catch {}
}
