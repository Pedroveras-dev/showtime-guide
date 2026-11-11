import { formatDate, formatMinutes } from "@/lib/format";
import type { Season } from "@/lib/types";

type SeasonListProps = {
  seasons: Season[];
};

/**
 * Temporadas da série com os totais calculados pelo backend
 * (quantidade de episódios e duração total). A lista de episódios de cada
 * temporada fica dentro de <details>, que abre e fecha sem JavaScript.
 */
export default function SeasonList({ seasons }: SeasonListProps) {
  return (
    <section aria-labelledby="seasons-title">
      <h2 id="seasons-title">Temporadas e episódios</h2>

      {seasons.length === 0 ? (
        <p className="lead">Nenhum episódio cadastrado na TVmaze para esta série.</p>
      ) : (
        <div className="season-list">
          {seasons.map((season) => (
            <details key={season.season} className="season">
              <summary>
                <span className="season__title">Temporada {season.season}</span>
                {" — "}
                <span className="season__totals">{describeTotals(season)}</span>
              </summary>

              <ol className="episode-list">
                {season.episodes.map((episode) => {
                  const airdate = formatDate(episode.airdate);
                  return (
                    <li key={episode.id} className="episode">
                      <h3 className="episode__title">
                        {episode.number !== null && `${episode.number}. `}
                        {episode.name}
                      </h3>
                      <p className="episode__meta">
                        {airdate ? `Exibido em ${airdate}` : "Data de exibição desconhecida"}
                        {" · "}
                        {episode.runtime_minutes !== null
                          ? formatMinutes(episode.runtime_minutes)
                          : "duração desconhecida"}
                      </p>
                      {episode.summary && <p className="episode__summary">{episode.summary}</p>}
                    </li>
                  );
                })}
              </ol>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

/** Ex.: "7 episódios · duração total: 420 min (7 h)". */
function describeTotals(season: Season): string {
  const episodes = season.episode_count === 1 ? "1 episódio" : `${season.episode_count} episódios`;

  if (season.total_runtime_minutes === null) {
    return `${episodes} · duração total desconhecida`;
  }

  let text = `${episodes} · duração total: ${formatMinutes(season.total_runtime_minutes)}`;
  if (season.episodes_without_runtime > 0) {
    const missing = season.episodes_without_runtime;
    text += ` (sem contar ${missing} ${missing === 1 ? "episódio" : "episódios"} sem duração informada)`;
  }
  return text;
}
