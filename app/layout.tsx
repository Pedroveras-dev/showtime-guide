import type { Metadata } from "next";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

import "./globals.css";

export const metadata: Metadata = {
  title: "Guia de Séries de TV",
  description:
    "Busque séries de TV, consulte temporadas e episódios, veja a programação do dia e mantenha sua lista pessoal.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

// Layout raiz: cabeçalho com navegação, conteúdo da página e rodapé com a
// atribuição da TVmaze, presentes em todas as páginas.
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>
        {/* Atalho para quem navega pelo teclado pular o menu. */}
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <main id="conteudo" className="container">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
