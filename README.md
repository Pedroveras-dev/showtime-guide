# Guia de Séries de TV

Trabalho da 2ª Avaliação de Programação Web (UESPI, prof. Eyder Rios), **Problema 10**.

Aplicação web em Next.js para buscar séries de TV, consultar temporadas e episódios, ver a
programação do dia e manter uma lista pessoal de séries. Os dados de séries vêm da API pública
[TVmaze](https://www.tvmaze.com/api); a lista pessoal fica em um banco SQLite local.

## Integrante

- João Pedro Veras ([Pedroveras-dev](https://github.com/Pedroveras-dev))

## Principais funcionalidades

- **Busca de séries** pelo nome, com pôster, ano de estreia e gêneros.
- **Detalhe da série** (`/shows/[id]`): sinopse sem HTML, dados gerais e episódios organizados
  por temporada, com a quantidade de episódios e a duração total de cada temporada.
- **Programação do dia** (`/schedule`): episódios exibidos na TV em uma data, com seleção da data
  e do país (Brasil por padrão).
- **Minha lista** (`/watchlist`): incluir séries, alterar a situação (“Quero assistir”,
  “Assistindo”, “Concluída”), editar ou apagar a anotação e remover itens.
- Estados de carregamento, lista vazia e erro em todas as páginas; layout responsivo e acessível
  (rótulos em formulários, foco visível, navegação por teclado, mensagens anunciadas a leitores de
  tela).
- Atribuição da fonte dos dados (TVmaze, licença CC BY-SA 4.0) no rodapé de todas as páginas.

## Tecnologias

- [Next.js](https://nextjs.org) 16.4.5 com App Router (Route Handlers no backend)
- React 19.3.0
- TypeScript 5 em modo estrito (`"strict": true` no `tsconfig.json`)
- CSS puro (`app/globals.css`)
- SQLite com [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) 13
- `fetch` nativo para todas as requisições HTTP
- ESLint (configuração do Next.js) e o executor de testes nativo do Node.js (`node:test`)

Não são usados: Server Actions, backend separado, ORM ou query builder, banco em nuvem ou
autenticação.

## Versão do Node.js

Desenvolvido e testado com **Node.js 26.13.0** e **npm 11.20.0**.

A versão mínima declarada em `package.json` é o **Node.js 22.18**, a primeira da linha 22 que
executa arquivos TypeScript diretamente (usado por `npm test` e `npm run check:api`). A aplicação
em si (`npm run dev`) não depende desse recurso.

## Como executar

```bash
npm install
npm run dev
```

Depois, acesse <http://localhost:3000>.

Na primeira vez que a aplicação acessa o banco (por exemplo, ao abrir **Minha lista** ou a página
de uma série), a pasta `data/`, o arquivo `data/app.db`, a tabela e os registros iniciais são
criados automaticamente. Nenhum passo manual é necessário.

> O arquivo `.npmrc` contém `ignore-scripts=true`. O better-sqlite3 já traz binários prontos para
> Linux, Windows e macOS; sem essa opção, o npm tentaria compilá-lo do zero, o que exige um
> compilador C++. Nenhuma outra dependência usa scripts de instalação.

### Outros scripts

| Comando             | Finalidade                                                                 |
| ------------------- | -------------------------------------------------------------------------- |
| `npm run build`     | Gera o build de produção                                                   |
| `npm run start`     | Executa o build de produção                                                |
| `npm run lint`      | Verifica o código com o ESLint                                             |
| `npm run typecheck` | Verifica os tipos com o compilador do TypeScript                           |
| `npm test`          | Testes automatizados (pasta `tests/`): validações, texto, temporadas, formatação e banco |
| `npm run check:api` | Verificação de integração de todos os endpoints (exige o servidor rodando) |

`npm test` não acessa a internet e cria o banco de teste em uma pasta temporária, sem tocar em
`data/app.db`. `npm run check:api` faz requisições reais ao servidor em `http://localhost:3000`
(ou ao endereço em `BASE_URL`) e, para testar o CRUD, cria e remove uma série temporária, sem
alterar os itens já existentes na lista.

## API externa: TVmaze

- Base: `https://api.tvmaze.com` — documentação: <https://www.tvmaze.com/api>
- Endpoints usados pelo backend:

| Endpoint da TVmaze                       | Usado em                                   |
| ---------------------------------------- | ------------------------------------------ |
| `GET /search/shows?q=:termo`             | `GET /api/shows`                           |
| `GET /shows/:id?embed=episodes`          | `GET /api/shows/[id]`                      |
| `GET /shows/:id`                         | `POST /api/watchlist` (nome e imagem)      |
| `GET /schedule?country=:país&date=:data` | `GET /api/schedule`                        |

- Todas as requisições saem do backend (`lib/tvmaze.ts`), com o cabeçalho de identificação
  `User-Agent: ShowtimeGuide/0.1 (trabalho academico UESPI; https://github.com/Pedroveras-dev/showtime-guide)`,
  como a documentação da TVmaze recomenda, e tempo máximo de espera de 10 segundos.
- As respostas são convertidas para um formato próprio da aplicação, só com os campos necessários.
- Os dados da TVmaze são licenciados sob [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/);
  a atribuição aparece no rodapé de todas as páginas, e a página de cada série tem um link para a
  série na TVmaze.

## Endpoints do backend

Todas as respostas são JSON (exceto o `204`, que não tem corpo). Os erros seguem sempre o formato:

```json
{ "error": "Mensagem descritiva em português" }
```

| Método | Rota                  | Finalidade                                                           |
| ------ | --------------------- | -------------------------------------------------------------------- |
| GET    | `/api/shows`          | Buscar séries pelo nome                                              |
| GET    | `/api/shows/[id]`     | Dados de uma série, com os episódios agrupados por temporada         |
| GET    | `/api/schedule`       | Programação de um país em uma data                                   |
| GET    | `/api/watchlist`      | Listar as séries da lista pessoal                                    |
| POST   | `/api/watchlist`      | Incluir uma série na lista pessoal                                   |
| PATCH  | `/api/watchlist/[id]` | Alterar a situação e/ou a anotação de um item da lista               |
| DELETE | `/api/watchlist/[id]` | Remover um item da lista                                             |

Em `/api/shows/[id]`, o `[id]` é o identificador da série **na TVmaze**. Em
`/api/watchlist/[id]`, o `[id]` é o identificador **local** do registro no SQLite.

Os exemplos de resposta abaixo foram copiados de respostas reais da aplicação, encurtados (`…`).

### `GET /api/shows?q=termo`

- `q` (obrigatório): nome da série, até 100 caracteres (espaços nas pontas são ignorados).
- `200`: lista de séries (pode ser vazia) · `400`: `q` ausente, vazio ou longo demais ·
  `502`: falha na comunicação com a TVmaze.

```json
[
  {
    "id": 169,
    "name": "Breaking Bad",
    "image_url": "https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg",
    "genres": ["Drama", "Crime", "Thriller"],
    "premiered": "2008-01-20"
  }
]
```

### `GET /api/shows/[id]`

- `[id]`: id da série na TVmaze (inteiro positivo).
- `200`: série com temporadas · `400`: id inválido · `404`: série inexistente na TVmaze · `502`.
- Processamento feito no backend:
  - **Agrupamento por temporada**, em ordem crescente, com `episode_count` (quantidade de
    episódios) e `total_runtime_minutes` (duração total, **em minutos**). Episódios sem duração
    informada ficam fora da soma e são contados em `episodes_without_runtime`; se nenhum episódio
    da temporada tiver duração, o total é `null` (desconhecido), e não `0`.
  - **Remoção das marcações HTML** das sinopses da série e dos episódios (tags removidas,
    entidades como `&amp;` convertidas, sinopse vazia vira `null`).
  - Episódios especiais não são enviados pela TVmaze nesse endpoint e por isso não aparecem.

```json
{
  "id": 169,
  "name": "Breaking Bad",
  "image_url": "https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg",
  "genres": ["Drama", "Crime", "Thriller"],
  "premiered": "2008-01-20",
  "ended": "2019-10-11",
  "status": "Ended",
  "language": "English",
  "network": "AMC",
  "rating": 9.2,
  "summary": "Breaking Bad follows protagonist Walter White, a chemistry teacher…",
  "tvmaze_url": "https://www.tvmaze.com/shows/169/breaking-bad",
  "seasons": [
    {
      "season": 1,
      "episode_count": 7,
      "total_runtime_minutes": 420,
      "episodes_without_runtime": 0,
      "episodes": [
        {
          "id": 12192,
          "number": 1,
          "name": "Pilot",
          "airdate": "2008-01-20",
          "runtime_minutes": 60,
          "summary": "A high-school chemistry teacher (Bryan Cranston) is diagnosed with a deadly cancer…"
        }
      ]
    }
  ]
}
```

### `GET /api/schedule?date=AAAA-MM-DD&country=BR`

- `date` (opcional): data no formato `AAAA-MM-DD`, que precisa existir no calendário
  (`2026-02-30` e `2025-02-29` são recusadas; `2024-02-29` é aceita). Sem `date`, usa o dia atual
  no fuso `America/Sao_Paulo`.
- `country` (opcional): código de país com duas letras (ISO 3166-1, ex.: `BR`, `US`, `GB`;
  minúsculas são aceitas). Sem `country`, usa **`BR`**.
- A resposta informa a data e o país efetivamente usados.
- `200`: programação (`items` pode ser vazio) · `400`: data ou país inválidos (inclusive códigos
  que a TVmaze não reconhece, como `XX`) · `502`.

```json
{
  "date": "2026-11-17",
  "country": "BR",
  "items": [
    {
      "id": 3797165,
      "airtime": "21:20",
      "season": 1,
      "number": 157,
      "episode_name": "Capítulo 157",
      "runtime_minutes": 60,
      "show": {
        "id": 92051,
        "name": "Quem Ama Cuida",
        "network": "TV Globo"
      }
    }
  ]
}
```

### `GET /api/watchlist`

- `200`: lista de itens, da inclusão mais recente para a mais antiga · `500`: erro ao acessar o
  banco.

```json
[
  {
    "id": 2,
    "show_id": 82,
    "name": "Game of Thrones",
    "image_url": "https://static.tvmaze.com/uploads/images/medium_portrait/498/1245274.jpg",
    "status": "watching",
    "note": "Parei na 4ª temporada.",
    "created_at": "2026-11-11T18:30:53.629Z"
  }
]
```

### `POST /api/watchlist`

- Corpo: `{ "show_id": 169, "status": "watching", "note": "texto" }`
  - `show_id` (obrigatório): id da série na TVmaze.
  - `status` (opcional, padrão `want_to_watch`): `want_to_watch`, `watching` ou `finished`.
  - `note` (opcional): até 500 caracteres; vazia vira `null`.
  - `name` e `image_url` **não** são aceitos: o backend os busca na TVmaze pelo `show_id`.
    `id` e `created_at` são preenchidos automaticamente.
- `201`: item criado (com o cabeçalho `Location: /api/watchlist/{id}`) · `400`: JSON inválido,
  campo não permitido ou valor inválido · `404`: série inexistente na TVmaze · `409`: a série já
  está na lista · `502`: falha na comunicação com a TVmaze.

### `PATCH /api/watchlist/[id]`

- Corpo: `{ "status": "finished" }`, `{ "note": "texto" }` ou os dois juntos.
- Só `status` e `note` são editáveis; qualquer outro campo resulta em `400`. Campos não enviados
  são mantidos. `"note": null` ou `"note": ""` apaga a anotação.
- `200`: item atualizado · `400`: id, JSON, campo ou valor inválido (inclusive corpo sem nenhum
  dos dois campos) · `404`: item inexistente.

### `DELETE /api/watchlist/[id]`

- `204`: item removido (sem corpo) · `400`: id inválido · `404`: item inexistente.

### Códigos de status usados

| Situação                                         | Código |
| ------------------------------------------------ | ------ |
| Consulta ou alteração realizada com sucesso      | 200    |
| Registro criado                                  | 201    |
| Registro removido                                | 204    |
| Parâmetro ausente ou inválido                    | 400    |
| Recurso inexistente                              | 404    |
| Série já cadastrada na lista                     | 409    |
| Falha na comunicação com a TVmaze                | 502    |
| Erro interno                                     | 500    |

## Banco de dados

- Arquivo: **`data/app.db`** (SQLite), criado automaticamente junto com a pasta `data/` no
  primeiro acesso ao banco. O arquivo está no `.gitignore` e não faz parte do repositório.
- Modo de journal: o padrão do SQLite (`DELETE`). O modo WAL **não** é usado, então o banco é um
  único arquivo, sem `*.db-wal` nem `*.db-shm`.
- Acesso: somente pelo backend (`lib/db.ts` abre a conexão; `lib/watchlist.ts` contém todas as
  consultas), sempre com **prepared statements** (parâmetros como `@show_id`), sem concatenar
  valores recebidos do usuário.
- O banco guarda apenas o que o usuário cria (a lista pessoal) e, para exibir a listagem sem uma
  requisição por item, o nome e a imagem da série. Os demais dados são sempre consultados na
  TVmaze.

### Tabela `watchlist`

| Coluna       | Tipo    | Regras                                                                 | Editável |
| ------------ | ------- | ---------------------------------------------------------------------- | -------- |
| `id`         | INTEGER | chave primária, gerada automaticamente (identificador local)           | —        |
| `show_id`    | INTEGER | obrigatório, único, maior que zero (id da série na TVmaze)             | Não      |
| `name`       | TEXT    | obrigatório (nome da série, obtido na TVmaze)                          | Não      |
| `image_url`  | TEXT    | opcional (URL da imagem, obtida na TVmaze)                             | Não      |
| `status`     | TEXT    | obrigatório: `want_to_watch` (padrão), `watching` ou `finished`        | Sim      |
| `note`       | TEXT    | opcional, até 500 caracteres                                           | Sim      |
| `created_at` | TEXT    | preenchido automaticamente com a data e hora da inclusão (ISO 8601, UTC) | —      |

```sql
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
```

### Registros iniciais

Seis registros são inseridos **uma única vez**, quando o banco é criado. Eles estão definidos em um
só lugar (`SEED_ITEMS`, em `lib/db.ts`), e os ids, nomes e imagens foram conferidos na TVmaze.

| `show_id` | Série           | `status`        | Anotação                                                    | Imagem |
| --------- | --------------- | --------------- | ----------------------------------------------------------- | ------ |
| 169       | Breaking Bad    | `finished`      | “Uma das melhores séries que já vi. Rever a 5ª temporada.”  | sim    |
| 82        | Game of Thrones | `watching`      | “Parei na 4ª temporada.”                                    | sim    |
| 2993      | Stranger Things | `want_to_watch` | vazia                                                       | sim    |
| 431       | Friends         | `finished`      | vazia                                                       | sim    |
| 526       | The Office      | `watching`      | “Assistir com a família no fim de semana.”                  | sim    |
| 39201     | Crash Test      | `want_to_watch` | vazia                                                       | não (a TVmaze não tem imagem) |

Os registros cobrem as três situações, anotações preenchidas e vazias e uma série sem imagem.
O controle de “banco já criado” é feito pelo `PRAGMA user_version`, gravado dentro do próprio
arquivo: reiniciar o servidor ou esvaziar a lista **não** reinsere os registros.

**Para restaurar o estado inicial**, pare o servidor, apague o arquivo `data/app.db` e rode
`npm run dev` novamente.

## Páginas do frontend

| Rota           | Página                                                                       |
| -------------- | ---------------------------------------------------------------------------- |
| `/`            | Busca de séries (o termo fica na URL: `/?q=...`)                             |
| `/shows/[id]`  | Detalhe da série (rota dinâmica), com o botão “Adicionar à minha lista”      |
| `/schedule`    | Programação do dia, com seleção da data e do país (`/schedule?date=...&country=...`) |
| `/watchlist`   | Lista pessoal: situação, anotação e remoção                                  |

O frontend obtém todos os dados **somente** por requisições HTTP aos endpoints `/api/...`:

- as páginas `/shows/[id]`, `/schedule` e `/watchlist` são Server Components que chamam a API
  com `fetch` (`lib/server-api.ts`);
- a busca, o botão de adicionar e as ações da lista são Client Components que chamam a API com
  `fetch` no navegador (`lib/api-client.ts`).

Nenhum componente acessa a TVmaze ou o banco diretamente, e não há Server Actions.

## Estrutura do projeto

```
app/
  api/                    backend (Route Handlers)
    shows/route.ts        GET /api/shows
    shows/[id]/route.ts   GET /api/shows/[id]
    schedule/route.ts     GET /api/schedule
    watchlist/route.ts    GET e POST /api/watchlist
    watchlist/[id]/route.ts  PATCH e DELETE /api/watchlist/[id]
  page.tsx                busca (/)
  shows/[id]/             detalhe da série (page, loading, not-found)
  schedule/               programação do dia (page, loading)
  watchlist/              lista pessoal (page, loading)
  layout.tsx, globals.css layout comum (cabeçalho, rodapé) e estilos
components/               componentes React reutilizáveis (recebem dados por props)
lib/
  tvmaze.ts               cliente da TVmaze (somente backend)
  db.ts, watchlist.ts     conexão SQLite, criação, registros iniciais e consultas (somente backend)
  validation.ts           validação das entradas dos endpoints
  seasons.ts, text.ts     agrupamento por temporada e remoção de HTML
  http.ts                 respostas de erro padronizadas
  api-client.ts, server-api.ts  chamadas do frontend aos endpoints /api/...
  format.ts, types.ts     formatação para a interface e tipos compartilhados
tests/                    testes automatizados (npm test)
scripts/check-api.ts      verificação de integração dos endpoints (npm run check:api)
docs/CHECKLIST.md         requisitos do enunciado × implementação × verificação
```

## Requisitos e verificação

O arquivo [docs/CHECKLIST.md](docs/CHECKLIST.md) relaciona cada requisito do enunciado ao arquivo
que o implementa e à forma como foi verificado, separando o que foi verificado do que não pôde ser
verificado.

## Limitações conhecidas

- As páginas “Série não encontrada” (`/shows/[id]` com id inexistente) mostram a mensagem correta,
  mas a resposta HTTP da **página** é `200`, porque o carregamento (`loading.tsx`) começa a ser
  enviado antes de se saber que a série não existe. O Next.js adiciona `noindex` nesse caso. O
  **endpoint** `/api/shows/[id]` responde `404` corretamente.
- O banco é criado no primeiro acesso a uma funcionalidade que o utiliza, e não no instante em
  que o servidor inicia.
