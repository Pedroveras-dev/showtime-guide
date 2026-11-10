// Banco de dados local (SQLite) da lista pessoal de séries.
// Só o backend (Route Handlers) pode usar este módulo.
import "server-only";

import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import type { WatchStatus } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

// Versão do esquema, gravada em PRAGMA user_version.
// 0 = banco recém-criado (vazio); 1 = tabela criada e registros iniciais inseridos.
const SCHEMA_VERSION = 1;

type SeedItem = {
  show_id: number;
  name: string;
  image_url: string | null;
  status: WatchStatus;
  note: string | null;
};

/**
 * Registros iniciais, inseridos uma única vez, quando o banco é criado.
 * Os show_id, nomes e imagens foram conferidos na TVmaze (GET /shows/:id).
 * Há as três situações, anotações preenchidas e vazias e uma série sem imagem.
 */
const SEED_ITEMS: readonly SeedItem[] = [
  {
    show_id: 169,
    name: "Breaking Bad",
    image_url: "https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg",
    status: "finished",
    note: "Uma das melhores séries que já vi. Rever a 5ª temporada.",
  },
  {
    show_id: 82,
    name: "Game of Thrones",
    image_url: "https://static.tvmaze.com/uploads/images/medium_portrait/498/1245274.jpg",
    status: "watching",
    note: "Parei na 4ª temporada.",
  },
  {
    show_id: 2993,
    name: "Stranger Things",
    image_url: "https://static.tvmaze.com/uploads/images/medium_portrait/595/1489169.jpg",
    status: "want_to_watch",
    note: null,
  },
  {
    show_id: 431,
    name: "Friends",
    image_url: "https://static.tvmaze.com/uploads/images/medium_portrait/41/104565.jpg",
    status: "finished",
    note: null,
  },
  {
    show_id: 526,
    name: "The Office",
    image_url: "https://static.tvmaze.com/uploads/images/medium_portrait/481/1204342.jpg",
    status: "watching",
    note: "Assistir com a família no fim de semana.",
  },
  {
    show_id: 39201,
    name: "Crash Test",
    image_url: null, // a TVmaze não tem imagem para esta série
    status: "want_to_watch",
    note: null,
  },
];

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS watchlist (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    show_id    INTEGER NOT NULL UNIQUE CHECK (show_id > 0),
    name       TEXT    NOT NULL,
    image_url  TEXT,
    status     TEXT    NOT NULL DEFAULT 'want_to_watch'
               CHECK (status IN ('want_to_watch', 'watching', 'finished')),
    note       TEXT    CHECK (note IS NULL OR length(note) <= 500),
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`;

/**
 * Cria a tabela e insere os registros iniciais na primeira execução.
 * O controle é feito por PRAGMA user_version, salvo dentro do próprio
 * arquivo do banco: se a lista for esvaziada depois, nada é reinserido.
 * Tudo roda numa transação: ou o banco fica completo, ou nada é gravado.
 */
function migrate(db: Database.Database): void {
  const version = db.pragma("user_version", { simple: true });
  if (version === SCHEMA_VERSION) {
    return;
  }

  db.transaction(() => {
    db.exec(CREATE_TABLE_SQL);

    // Prepared statement com parâmetros nomeados (@show_id, @name, ...).
    const insertSeed = db.prepare(
      `INSERT INTO watchlist (show_id, name, image_url, status, note)
       VALUES (@show_id, @name, @image_url, @status, @note)`,
    );
    for (const item of SEED_ITEMS) {
      insertSeed.run(item);
    }
    db.pragma(`user_version = ${SCHEMA_VERSION}`);
  })();
}

function openDatabase(): Database.Database {
  // Cria a pasta data/ se ainda não existir; o arquivo é criado pelo SQLite.
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new Database(DB_PATH);

  // Modo de journal padrão do SQLite (DELETE). O modo WAL NÃO é usado,
  // então o banco inteiro fica em um único arquivo (data/app.db).
  db.pragma("journal_mode = DELETE");

  migrate(db);
  return db;
}

// No `next dev`, os módulos são recarregados a cada alteração de código.
// Guardar a conexão em globalThis evita abrir uma nova a cada recarga.
const globalForDb = globalThis as typeof globalThis & {
  watchlistDb?: Database.Database;
};

/** Conexão única com o banco, aberta (e criada, se preciso) no primeiro uso. */
export function getDb(): Database.Database {
  globalForDb.watchlistDb ??= openDatabase();
  return globalForDb.watchlistDb;
}
