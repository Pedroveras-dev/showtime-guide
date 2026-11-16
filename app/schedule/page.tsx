import type { Metadata } from "next";

import ScheduleForm from "@/components/ScheduleForm";
import ScheduleList from "@/components/ScheduleList";
import StatusMessage from "@/components/StatusMessage";
import { formatCountry, formatDate } from "@/lib/format";
import { requestApiFromServer } from "@/lib/server-api";
import type { Schedule } from "@/lib/types";

export const metadata: Metadata = {
  title: "Programação | Guia de Séries de TV",
};

type SchedulePageProps = {
  searchParams: Promise<{ date?: string | string[]; country?: string | string[] }>;
};

function firstValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

// Página da programação. Sem parâmetros na URL, o backend usa o dia de hoje
// (fuso de São Paulo) e o Brasil, e informa na resposta a data e o país usados.
export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const params = await searchParams;
  const date = firstValue(params.date);
  const country = firstValue(params.country);

  // Só envia ao backend os parâmetros que o usuário informou.
  const query = new URLSearchParams();
  if (date !== "") query.set("date", date);
  if (country !== "") query.set("country", country);
  const queryString = query.toString();

  const result = await requestApiFromServer<Schedule>(
    `/api/schedule${queryString ? `?${queryString}` : ""}`,
  );

  // O formulário mostra a data e o país usados pelo backend; em caso de erro,
  // mostra o que veio na URL para o usuário corrigir.
  const formDate = result.ok ? result.data.date : date;
  const formCountry = result.ok ? result.data.country : country.toUpperCase() || "BR";

  return (
    <>
      <h1>Programação de TV</h1>
      <p className="lead">Episódios exibidos na TV em um dia, de acordo com o país escolhido.</p>

      {/* key: ao voltar/avançar no navegador, o formulário mostra os valores da URL. */}
      <ScheduleForm key={`${formDate}-${formCountry}`} date={formDate} country={formCountry} />

      {!result.ok ? (
        <StatusMessage kind="error">{result.error}</StatusMessage>
      ) : (
        <section aria-labelledby="schedule-title">
          <h2 id="schedule-title" className="results-title">
            {formatDate(result.data.date)} · {formatCountry(result.data.country)} ·{" "}
            {result.data.items.length === 1
              ? "1 episódio"
              : `${result.data.items.length} episódios`}
          </h2>
          {result.data.items.length === 0 ? (
            <StatusMessage kind="info">
              Nenhum episódio na programação desta data para este país. Escolha outra data ou
              outro país.
            </StatusMessage>
          ) : (
            <ScheduleList items={result.data.items} />
          )}
        </section>
      )}
    </>
  );
}
