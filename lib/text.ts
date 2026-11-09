// Utilitários de texto usados na normalização dos dados da TVmaze.

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Converte entidades HTML (&amp;, &#39;, &#x27; ...) nos caracteres reais. */
function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === "#") {
      const isHex = code[1] === "x" || code[1] === "X";
      const value = isHex ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isNaN(value) ? entity : String.fromCodePoint(value);
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

/**
 * Remove as marcações HTML de uma sinopse e devolve texto puro.
 * Fins de parágrafo e <br> viram quebras de linha; espaços repetidos são
 * reduzidos. Devolve null quando não sobra texto.
 *
 * Exemplo: "<p><b>Breaking Bad</b> follows...</p>" → "Breaking Bad follows..."
 */
export function stripHtml(html: string | null | undefined): string | null {
  if (!html) {
    return null;
  }

  const text = decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]*>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

  return text === "" ? null : text;
}
