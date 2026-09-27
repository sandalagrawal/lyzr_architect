import Link from "next/link";

export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0E1116" />
      <path d="M8 23 L16 8 L24 23" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M11.5 17.5 H20.5" stroke="#3452F5" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16" cy="8" r="1.8" fill="#3452F5" />
    </svg>
  );
}

export function Logo({ href = "/", size = 22 }: { href?: string; size?: number }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight text-ink">
      <LogoMark size={size} />
      <span className="text-[15px]">
        Architect <span className="text-ink-4 font-normal">2.0</span>
      </span>
    </Link>
  );
}
