// Testa a criação do banco SQLite em uma pasta temporária, sem tocar no
// data/app.db do projeto.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

// lib/db.ts grava em <pasta atual>/data/app.db. Por isso a pasta atual é
// trocada para uma pasta temporária ANTES de importar o módulo.
const projectDir = process.cwd();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "showtime-guide-db-"));
const dbFile = path.join(tempDir, "data", "app.db");

let getDb: typeof import("../lib/db.ts").getDb;

before(async () => {
  process.chdir(tempDir);
  ({ getDb } = await import("../lib/db.ts"));
});

after(() => {
  closeDb();
  process.chdir(projectDir);
  fs.rmSync(tempDir, { recursive: true, force: true });
});

/** Fecha a conexão e esquece a conexão guardada, como num reinício do servidor. */
function closeDb(): void {
  if (Reflect.has(globalThis, "watchlistDb")) {
    getDb().close();
    Reflect.deleteProperty(globalThis, "watchlistDb");
  }
}

function countRows(): number {
  const row = getDb().prepare("SELECT COUNT(*) AS total FROM watchlist").get() as { total: number };
  return row.total;
}

// Os testes abaixo rodam em sequência e dependem da ordem.

test("cria a pasta, o arquivo e a tabela quando o banco não existe", () => {
  assert.equal(fs.existsSync(dbFile), false);
  getDb();
  assert.equal(fs.existsSync(dbFile), true);
});

test("insere de 3 a 10 registros iniciais com as três situações", () => {
  const rows = getDb()
    .prepare("SELECT show_id, status, note, image_url FROM watchlist")
    .all() as { show_id: number; status: string; note: string | null; image_url: string | null }[];

  assert.ok(rows.length >= 3 && rows.length <= 10, `${rows.length} registros`);
  assert.deepEqual(
    new Set(rows.map((row) => row.status)),
    new Set(["want_to_watch", "watching", "finished"]),
  );
  assert.ok(rows.some((row) => row.note !== null), "alguma anotação preenchida");
  assert.ok(rows.some((row) => row.note === null), "alguma anotação vazia");
});

test("usa o modo de journal DELETE (sem WAL) e um único arquivo", () => {
  assert.equal(getDb().pragma("journal_mode", { simple: true }), "delete");
  assert.deepEqual(fs.readdirSync(path.dirname(dbFile)), ["app.db"]);
});

test("não duplica os registros iniciais ao reiniciar", () => {
  const before = countRows();
  closeDb();
  assert.equal(countRows(), before);
});

test("não reinsere os registros iniciais quando a lista é esvaziada", () => {
  getDb().prepare("DELETE FROM watchlist").run();
  closeDb();
  assert.equal(countRows(), 0);
});

test("recusa show_id repetido, status inválido e anotação acima de 500 caracteres", () => {
  const insert = getDb().prepare(
    "INSERT INTO watchlist (show_id, name, status, note) VALUES (?, ?, ?, ?)",
  );
  insert.run(1, "Série", "watching", "a".repeat(500));

  assert.throws(() => insert.run(1, "Repetida", "watching", null), { code: "SQLITE_CONSTRAINT_UNIQUE" });
  assert.throws(() => insert.run(2, "Série", "dropped", null), { code: "SQLITE_CONSTRAINT_CHECK" });
  assert.throws(() => insert.run(3, "Série", "watching", "a".repeat(501)), { code: "SQLITE_CONSTRAINT_CHECK" });
});

test("apagar o arquivo restaura o estado inicial", () => {
  closeDb();
  fs.rmSync(dbFile);
  assert.ok(countRows() >= 3);
});
