import Link from "next/link";

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand-mark">↗</span>
        <span>
          <span className="brand-name">TERRACASCADE</span>
          <span className="brand-sub"> / RADAR DATA EXPLORER</span>
        </span>
      </Link>
      <nav className="nav" aria-label="Primary navigation">
        <Link href="/explore" aria-current={active === "explore" ? "page" : undefined}>
          Explorer
        </Link>
        <Link
          href="/methodology"
          aria-current={active === "methodology" ? "page" : undefined}
        >
          Methodology
        </Link>
        <Link href="/about" aria-current={active === "about" ? "page" : undefined}>
          About
        </Link>
      </nav>
    </header>
  );
}
