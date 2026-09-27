import React from "react";

function inline(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={key + i++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={key + i++}>{t.slice(1, -1)}</code>);
    else out.push(<em key={key + i++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ src, className }: { src: string; className?: string }) {
  const lines = src.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = (k: number) => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={"l" + k} className={list.ordered ? "list-decimal ml-5" : undefined}>
        {list.items.map((it, j) => (
          <li key={j}>{inline(it, `li${k}-${j}-`)}</li>
        ))}
      </Tag>
    );
    list = null;
  };
  lines.forEach((raw, k) => {
    const line = raw.trimEnd();
    const ul = line.match(/^\s*[-*]\s+(.*)/);
    const ol = line.match(/^\s*\d+\.\s+(.*)/);
    if (ul || ol) {
      const ordered = Boolean(ol);
      if (list && list.ordered !== ordered) flush(k);
      if (!list) list = { ordered, items: [] };
      list.items.push((ul || ol)![1]);
      return;
    }
    flush(k);
    if (!line.trim()) return;
    if (line.startsWith("### ")) blocks.push(<h2 key={k}>{inline(line.slice(4), `h${k}`)}</h2>);
    else if (line.startsWith("## ")) blocks.push(<h2 key={k}>{inline(line.slice(3), `h${k}`)}</h2>);
    else if (line.startsWith("# ")) blocks.push(<h1 key={k}>{inline(line.slice(2), `h${k}`)}</h1>);
    else blocks.push(<p key={k}>{inline(line, `p${k}`)}</p>);
  });
  flush(lines.length);
  return <div className={"prose-doc " + (className || "")}>{blocks}</div>;
}
