import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import AddToWatchlistButton from "@/components/AddToWatchlistButton";
import SeasonList from "@/components/SeasonList";
import StatusMessage from "@/components/StatusMessage";
import { formatDate, formatShowStatus } from "@/lib/format";
import { requestApiFromServer } from "@/lib/server-api";
import type { ShowDetail, WatchlistItem } from "@/lib/types";

type ShowPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Busca a série no backend (GET /api/shows/[id]).
 * 400 (id inválido) e 404 (série inexistente) mostram a página "não encontrada".
 * O Next.js reaproveita o resultado entre generateMetadata e a página.
 */
async function loadShow(id: string) {
  const result = await requestApiFromServer<ShowDetail>(`/api/shows/${encodeURIComponent(id)}`);
  if (!result.ok && (result.status === 400 || result.status === 404)) {
    notFound();
  }
  return result;
}

export async function generateMetadata({ params }: ShowPageProps): Promise<Metadata> {
  const result = await loadShow((await params).id);
  return { title: result.ok ? `${result.data.name} | Guia de Séries de TV` : "Guia de Séries de TV" };
}

// Página de detalhe (rota dinâmica /shows/[id], com o id da TVmaze).
export default async function ShowPage({ params }: ShowPageProps) {
  const { id } = await params;

  // As duas requisições ao backend são feitas em paralelo.
  const [showResult, watchlistResult] = await Promise.all([
    loadShow(id),
    requestApiFromServer<WatchlistItem[]>("/api/watchlist"),
  ]);

  if (!showResult.ok) {
    return (
      <>
        <h1>Não foi possível carregar a série</h1>
        <StatusMessage kind="error">{showResult.error}</StatusMessage>
        <p>
          <Link href={`/shows/${id}`}>Tentar novamente</Link> ou{" "}
          <Link href="/">voltar para a busca</Link>.
        </p>
      </>
    );
  }

  const show = showResult.data;
  // Se a lista não puder ser consultada, o botão aparece normalmente e o
  // backend responde 409 caso a série já esteja na lista.
  const isInWatchlist =
    watchlistResult.ok && watchlistResult.data.some((item) => item.show_id === show.id);

  const premiered = formatDate(show.premiered);
  const ended = formatDate(show.ended);
  const status = formatShowStatus(show.status);

  return (
    <article className="show-detail">
      <div className="show-header">
        {show.image_url ? (
          <Image
            className="show-header__image"
            src={show.image_url}
            alt={`Pôster da série ${show.name}`}
            width={210}
            height={295}
            priority
          />
        ) : (
          <div className="show-header__image card__image--empty" aria-hidden="true">
            Sem imagem
          </div>
        )}

        <div className="show-header__info">
          <h1>{show.name}</h1>
          {show.genres.length > 0 && <p className="lead">{show.genres.join(", ")}</p>}

          <dl className="facts">
            {premiered && (
              <>
                <dt>Estreia</dt>
                <dd>{premiered}</dd>
              </>
            )}
            {ended && (
              <>
                <dt>Encerramento</dt>
                <dd>{ended}</dd>
              </>
            )}
            {status && (
              <>
                <dt>Situação</dt>
                <dd>{status}</dd>
              </>
            )}
            {show.network && (
              <>
                <dt>Emissora</dt>
                <dd>{show.network}</dd>
              </>
            )}
            {show.language && (
              <>
                <dt>Idioma</dt>
                <dd>{show.language}</dd>
              </>
            )}
            {show.rating !== null && (
              <>
                <dt>Nota</dt>
                <dd>{show.rating.toFixed(1)} / 10</dd>
              </>
            )}
          </dl>

          <AddToWatchlistButton showId={show.id} initiallyInList={isInWatchlist} />
        </div>
      </div>

      <section aria-labelledby="summary-title">
        <h2 id="summary-title">Sinopse</h2>
        {show.summary ? (
          <p className="summary">{show.summary}</p>
        ) : (
          <p className="lead">Sinopse não disponível.</p>
        )}
        {show.tvmaze_url && (
          <p>
            <a href={show.tvmaze_url}>Ver esta série na TVmaze</a>
          </p>
        )}
      </section>

      <SeasonList seasons={show.seasons} />
    </article>
  );
}
