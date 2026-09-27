export function resolveNext(next: string | null) {
  if (next === "new") {
    let p = "";
    try {
      p = sessionStorage.getItem("a2.pendingPrompt") || "";
    } catch {}
    return p ? `/new?prompt=${encodeURIComponent(p)}` : "/home";
  }
  if (next === "import") return "/import";
  return "/home";
}
