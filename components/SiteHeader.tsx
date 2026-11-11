"use client";

// Componente cliente: usa usePathname() para destacar a página atual no menu.
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Buscar séries" },
  { href: "/schedule", label: "Programação" },
  { href: "/watchlist", label: "Minha lista" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-title">
          Guia de Séries de TV
        </Link>
        <nav aria-label="Navegação principal">
          <ul className="nav-list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav-link"
                  // aria-current informa a leitores de tela qual é a página atual.
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
