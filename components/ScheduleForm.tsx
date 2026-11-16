import Form from "next/form";

import { formatCountry } from "@/lib/format";

// Países oferecidos na seleção. O Brasil é o padrão da aplicação.
const COUNTRY_CODES = ["BR", "US", "GB", "PT", "CA", "AU", "DE", "FR", "ES", "JP"];

type ScheduleFormProps = {
  date: string;
  country: string;
};

/**
 * Formulário da programação. Como na busca, o <Form> do Next.js leva os
 * valores para a URL (/schedule?date=...&country=...) sem recarregar a página.
 */
export default function ScheduleForm({ date, country }: ScheduleFormProps) {
  // Se a URL trouxer um país fora da lista, ele também aparece como opção.
  const codes = COUNTRY_CODES.includes(country) ? COUNTRY_CODES : [country, ...COUNTRY_CODES];

  return (
    <Form action="/schedule" className="filter-form">
      <div className="field">
        <label htmlFor="schedule-date">Data</label>
        <input id="schedule-date" name="date" type="date" defaultValue={date} required />
      </div>
      <div className="field">
        <label htmlFor="schedule-country">País</label>
        <select id="schedule-country" name="country" defaultValue={country}>
          {codes.map((code) => (
            <option key={code} value={code}>
              {formatCountry(code)}
            </option>
          ))}
        </select>
      </div>
      <button type="submit">Ver programação</button>
    </Form>
  );
}
