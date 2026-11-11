import SearchForm from "@/components/SearchForm";
import SearchResults from "@/components/SearchResults";

type HomePageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

// Página inicial: busca de séries pelo nome. O termo fica na URL (/?q=...),
// então a busca pode ser recarregada, compartilhada e desfeita com "Voltar".
export default async function HomePage({ searchParams }: HomePageProps) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";

  return (
    <>
      <h1>Buscar séries</h1>
      <p className="lead">
        Pesquise uma série pelo nome para ver detalhes, temporadas e episódios.
      </p>
      {/* As props `key` mudam a cada novo termo e fazem o React recriar os
          componentes: o campo mostra o termo da URL (inclusive ao usar
          "Voltar") e o resultado começa de novo em "carregando". Irmãos
          precisam de keys diferentes, por isso os prefixos. */}
      <SearchForm key={`form-${query}`} defaultValue={query} />
      {query !== "" && <SearchResults key={`results-${query}`} query={query} />}
    </>
  );
}
