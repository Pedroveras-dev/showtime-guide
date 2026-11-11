import Image from "next/image";
import Link from "next/link";

import type { ShowSummary } from "@/lib/types";

type ShowCardProps = {
  show: ShowSummary;
};

/** Cartão de uma série com imagem, nome, ano de estreia e gêneros. */
export default function ShowCard({ show }: ShowCardProps) {
  const year = show.premiered?.slice(0, 4);

  return (
    <article className="card">
      {show.image_url ? (
        <Image
          className="card__image"
          src={show.image_url}
          alt={`Pôster da série ${show.name}`}
          width={210}
          height={295}
        />
      ) : (
        <div className="card__image card__image--empty" aria-hidden="true">
          Sem imagem
        </div>
      )}
      <div className="card__body">
        <h3 className="card__title">
          {/* O link cobre o cartão inteiro (ver .card__link no CSS). */}
          <Link href={`/shows/${show.id}`} className="card__link">
            {show.name}
          </Link>
        </h3>
        <p className="card__meta">
          {year ? `Estreia: ${year}` : "Estreia desconhecida"}
          {show.genres.length > 0 && (
            <>
              <br />
              {show.genres.join(", ")}
            </>
          )}
        </p>
      </div>
    </article>
  );
}
