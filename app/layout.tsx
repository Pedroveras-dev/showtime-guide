import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guia de Séries de TV",
  description:
    "Busque séries de TV, consulte temporadas e episódios, veja a programação do dia e mantenha sua lista pessoal.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

// Layout raiz: envolve todas as páginas do App Router.
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
