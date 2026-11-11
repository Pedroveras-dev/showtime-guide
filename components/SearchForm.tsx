import Form from "next/form";

import { MAX_SEARCH_QUERY_LENGTH } from "@/lib/validation";

type SearchFormProps = {
  defaultValue: string;
};

/**
 * Formulário de busca. O <Form> do Next.js, com `action` em texto (uma URL,
 * e não uma Server Action), navega para "/?q=termo" sem recarregar a página.
 */
export default function SearchForm({ defaultValue }: SearchFormProps) {
  return (
    <Form action="/" className="search-form" role="search">
      <label htmlFor="search-query">Nome da série</label>
      <div className="search-form__row">
        <input
          id="search-query"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder="Ex.: Breaking Bad"
          required
          maxLength={MAX_SEARCH_QUERY_LENGTH}
          autoComplete="off"
        />
        <button type="submit">Buscar</button>
      </div>
    </Form>
  );
}
