// Verificação de integração dos endpoints do backend.
//
// Uso (com o servidor rodando em outro terminal):  npm run check:api
// Outra porta/endereço:  BASE_URL=http://localhost:3001 npm run check:api
//
// Faz requisições HTTP reais (backend + TVmaze + SQLite). Para testar o CRUD,
// inclui uma série temporária, altera e remove; os itens já existentes na
// lista nunca são alterados.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Séries candidatas para o item temporário (ids reais da TVmaze); usa a
// primeira que ainda não estiver na lista.
const TEMPORARY_SHOW_CANDIDATES = [1, 2, 3, 4, 5, 6, 7, 8];

type JsonResponse = { status: number; body: unknown; text: string; headers: Headers };

async function request(method: string, path: string, body?: unknown): Promise<JsonResponse> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text === "" ? null : JSON.parse(text);
  } catch {
    parsed = null;
  }
  return { status: response.status, body: parsed, text, headers: response.headers };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Confere o status e o formato padrão de erro { "error": "..." }. */
function assertError(response: JsonResponse, status: number): void {
  assert.equal(response.status, status, response.text);
  assert.ok(isRecord(response.body), "o corpo do erro deve ser um objeto JSON");
  assert.deepEqual(Object.keys(response.body), ["error"]);
  assert.equal(typeof response.body.error, "string");
  assert.ok(String(response.body.error).length > 0);
}

before(async () => {
  try {
    await fetch(BASE_URL);
  } catch {
    throw new Error(`Servidor não encontrado em ${BASE_URL}. Rode "npm run dev" antes.`);
  }
});

describe("GET /api/shows (busca)", () => {
  test("200 com a lista de séries no formato da aplicação", async () => {
    const response = await request("GET", "/api/shows?q=girls");
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body) && response.body.length > 0);
    const [first] = response.body;
    assert.ok(isRecord(first));
    assert.deepEqual(Object.keys(first).sort(), ["genres", "id", "image_url", "name", "premiered"]);
  });

  test("400 sem o termo, com termo vazio ou acima de 100 caracteres", async () => {
    assertError(await request("GET", "/api/shows"), 400);
    assertError(await request("GET", "/api/shows?q=%20%20"), 400);
    assertError(await request("GET", `/api/shows?q=${"a".repeat(101)}`), 400);
  });
});

describe("GET /api/shows/[id] (detalhe)", () => {
  test("200 com temporadas, totais e sinopse sem HTML", async () => {
    const response = await request("GET", "/api/shows/169");
    assert.equal(response.status, 200);
    assert.ok(isRecord(response.body));
    assert.equal(response.body.name, "Breaking Bad");
    assert.equal(typeof response.body.summary, "string");
    assert.doesNotMatch(String(response.body.summary), /<[a-z/]/i);

    const seasons = response.body.seasons;
    assert.ok(Array.isArray(seasons) && seasons.length === 5);
    const [first] = seasons;
    assert.ok(isRecord(first));
    assert.equal(first.season, 1);
    assert.equal(first.episode_count, 7);
    assert.equal(first.total_runtime_minutes, 420);
    assert.ok(Array.isArray(first.episodes) && first.episodes.length === 7);
  });

  test("400 para id inválido e 404 para série inexistente", async () => {
    assertError(await request("GET", "/api/shows/abc"), 400);
    assertError(await request("GET", "/api/shows/0"), 400);
    assertError(await request("GET", "/api/shows/999999999"), 404);
  });
});

describe("GET /api/schedule (programação)", () => {
  test("sem parâmetros: hoje (AAAA-MM-DD) e Brasil", async () => {
    const response = await request("GET", "/api/schedule");
    assert.equal(response.status, 200);
    assert.ok(isRecord(response.body));
    assert.match(String(response.body.date), /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(response.body.country, "BR");
    assert.ok(Array.isArray(response.body.items));
  });

  test("aceita data e país informados", async () => {
    const response = await request("GET", "/api/schedule?date=2024-02-29&country=us");
    assert.equal(response.status, 200);
    assert.ok(isRecord(response.body));
    assert.equal(response.body.date, "2024-02-29");
    assert.equal(response.body.country, "US");

    // Cada item traz só os campos exibidos na página da programação.
    const items = response.body.items;
    assert.ok(Array.isArray(items) && items.length > 0);
    const [first] = items;
    assert.ok(isRecord(first) && isRecord(first.show));
    assert.deepEqual(Object.keys(first).sort(), [
      "airtime",
      "episode_name",
      "id",
      "number",
      "runtime_minutes",
      "season",
      "show",
    ]);
    assert.deepEqual(Object.keys(first.show).sort(), ["id", "name", "network"]);
  });

  test("400 para data fora do formato, data inexistente e país inválido", async () => {
    assertError(await request("GET", "/api/schedule?date=22/11/2026"), 400);
    assertError(await request("GET", "/api/schedule?date=2026-02-30"), 400);
    assertError(await request("GET", "/api/schedule?country=BRA"), 400);
    assertError(await request("GET", "/api/schedule?country=XX"), 400);
  });
});

describe("/api/watchlist (CRUD da lista pessoal)", () => {
  let showId = 0;
  let itemId = 0;
  let removed = false;

  before(async () => {
    const list = await request("GET", "/api/watchlist");
    assert.equal(list.status, 200);
    assert.ok(Array.isArray(list.body));
    const listed = new Set(list.body.map((item) => (isRecord(item) ? item.show_id : null)));
    const candidate = TEMPORARY_SHOW_CANDIDATES.find((id) => !listed.has(id));
    assert.ok(candidate !== undefined, "todas as séries candidatas já estão na lista");
    showId = candidate;
  });

  // Se algum teste falhar no meio, o item temporário é removido mesmo assim.
  after(async () => {
    if (itemId !== 0 && !removed) {
      await request("DELETE", `/api/watchlist/${itemId}`);
    }
  });

  test("POST 201: busca nome e imagem na TVmaze e preenche created_at", async () => {
    const response = await request("POST", "/api/watchlist", {
      show_id: showId,
      note: "  Item temporário da verificação  ",
    });
    assert.equal(response.status, 201, response.text);
    assert.ok(isRecord(response.body));
    itemId = Number(response.body.id);
    assert.equal(response.headers.get("location"), `/api/watchlist/${itemId}`);
    assert.equal(response.body.show_id, showId);
    assert.equal(typeof response.body.name, "string");
    assert.equal(response.body.status, "want_to_watch");
    assert.equal(response.body.note, "Item temporário da verificação");
    assert.ok(!Number.isNaN(Date.parse(String(response.body.created_at))));
  });

  test("POST 409 para série já cadastrada", async () => {
    assertError(await request("POST", "/api/watchlist", { show_id: showId }), 409);
  });

  test("POST 400 para corpo inválido e 404 para série inexistente na TVmaze", async () => {
    assertError(await request("POST", "/api/watchlist", "{ json quebrado"), 400);
    assertError(await request("POST", "/api/watchlist", {}), 400);
    assertError(await request("POST", "/api/watchlist", { show_id: "1" }), 400);
    assertError(await request("POST", "/api/watchlist", { show_id: 1, name: "X" }), 400);
    assertError(await request("POST", "/api/watchlist", { show_id: 1, status: "dropped" }), 400);
    assertError(await request("POST", "/api/watchlist", { show_id: 999999999 }), 404);
  });

  test("GET 200 inclui o item criado", async () => {
    const response = await request("GET", "/api/watchlist");
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body));
    assert.ok(response.body.some((item) => isRecord(item) && item.id === itemId));
  });

  test("PATCH 200 altera só os campos enviados e apaga a anotação", async () => {
    const status = await request("PATCH", `/api/watchlist/${itemId}`, { status: "watching" });
    assert.equal(status.status, 200, status.text);
    assert.ok(isRecord(status.body));
    assert.equal(status.body.status, "watching");
    assert.equal(status.body.note, "Item temporário da verificação"); // mantida

    const note = await request("PATCH", `/api/watchlist/${itemId}`, { note: "Nova anotação" });
    assert.ok(isRecord(note.body));
    assert.equal(note.body.note, "Nova anotação");
    assert.equal(note.body.status, "watching"); // mantido

    const cleared = await request("PATCH", `/api/watchlist/${itemId}`, { note: null });
    assert.ok(isRecord(cleared.body));
    assert.equal(cleared.body.note, null);
  });

  test("PATCH 400 para campos não editáveis e valores inválidos", async () => {
    const path = `/api/watchlist/${itemId}`;
    assertError(await request("PATCH", path, {}), 400);
    assertError(await request("PATCH", path, { name: "Outro nome" }), 400);
    assertError(await request("PATCH", path, { show_id: 5 }), 400);
    assertError(await request("PATCH", path, { created_at: "2020-01-01" }), 400);
    assertError(await request("PATCH", path, { status: "dropped" }), 400);
    assertError(await request("PATCH", path, { note: "a".repeat(501) }), 400);
    assertError(await request("PATCH", "/api/watchlist/abc", { status: "watching" }), 400);
  });

  test("DELETE 204 sem corpo; depois 404 para PATCH e DELETE", async () => {
    const response = await request("DELETE", `/api/watchlist/${itemId}`);
    assert.equal(response.status, 204);
    assert.equal(response.text, "");
    removed = true;

    assertError(await request("DELETE", `/api/watchlist/${itemId}`), 404);
    assertError(await request("PATCH", `/api/watchlist/${itemId}`, { status: "finished" }), 404);
  });
});
