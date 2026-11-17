# Requisitos × implementação × verificação

Relação entre cada requisito do enunciado (2ª Avaliação, Problema 10 — Guia de Séries de TV), o
código que o atende e a forma como foi verificado.

Legenda da coluna **Verificação**:

- ✅ **Verificado**: conferido executando o comando ou o teste indicado.
- ⚠️ **Parcial**: verificado só em parte; o que falta está descrito.
- ⏳ **Não verificado**: não foi possível verificar neste ambiente; o motivo está descrito.

Comandos citados: `npm test` (testes automatizados, sem rede), `npm run check:api` (integração de
todos os endpoints com o servidor rodando), `npm run typecheck`, `npm run lint` e `npm run build`.
As verificações no navegador usaram o navegador embutido do ambiente de desenvolvimento (Chromium),
nas larguras de 1024, 375 e 320 pixels.

## Repositório

| Requisito | Implementação | Verificação |
| --- | --- | --- |
| Repositório público no GitHub, branch `main` | github.com/Pedroveras-dev/showtime-guide | ✅ `gh repo view` informa `PUBLIC` e branch padrão `main` |
| Histórico de commits compatível com o desenvolvimento | um commit por etapa, mais commits `fix:` para problemas achados depois | ✅ `git log` (sem squash, amend, rebase ou force push) |
| `.gitignore` com `node_modules`, `.next` e o banco | `.gitignore` (`/node_modules`, `/.next/`, `/data/`, `*.db`, `*.db-journal`, `*.db-wal`, `*.db-shm`) | ✅ `git check-ignore` confirma `data/app.db` e `data/app.db-journal` |
| `tsconfig.json` com `"strict": true` | `tsconfig.json` | ✅ |
| `README.md` com os itens da seção 7 | `README.md` | ✅ integrantes, descrição, funcionalidades, API, endpoints, tabela, local do arquivo, registros iniciais, tecnologias, Node.js e execução |

## Execução

| Requisito | Implementação | Verificação |
| --- | --- | --- |
| Executar só com `npm install` e `npm run dev` | `package.json`, `.npmrc` | ✅ clone novo do repositório: `npm install` sem erros e sem alterar arquivos versionados; `npm run dev` respondendo `200`. ⏳ Testado apenas em Linux com Node.js 26.13.0 e npm 11.20.0 (ver “Não verificado”) |
| Sem erros de compilação do TypeScript | todo o código em TypeScript estrito | ✅ `npm run typecheck` e `npm run build`, também dentro do clone novo |
| Evitar `any` | — | ✅ busca no código: nenhum `any` |
| Banco criado automaticamente com 3 a 10 registros iniciais, na primeira execução | `instrumentation.ts` (abre o banco quando o servidor inicia); `lib/db.ts` (`migrate`, `SEED_ITEMS`) | ✅ cópia limpa, **sem nenhuma requisição**: `npm run dev` criou `data/app.db` com 6 registros cerca de 4,7 s após a mensagem “Ready” (medido duas vezes); `npm start` criou ao iniciar; `npm run build` não cria o banco. ✅ 10 requisições simultâneas durante a criação: todas `200`, 6 registros, sem erros. ✅ Falha simulada (`data` como arquivo): o servidor continua no ar, a lista responde `500` e volta a funcionar quando o problema é removido. ✅ `npm test` (`tests/db.test.ts`) |
| Registros só na criação, sem duplicar ao reiniciar ou recarregar | `PRAGMA user_version` em `lib/db.ts`; conexão guardada em `globalThis` | ✅ clone novo: após reiniciar o servidor, continuam 6 registros. ✅ `npm test`: reinício, recarga e lista esvaziada (não reinsere) |
| Registros com ids existentes na TVmaze e valores variados | `SEED_ITEMS` | ✅ ids, nomes e imagens conferidos em `GET https://api.tvmaze.com/shows/:id`; três situações, anotações preenchidas e vazias, uma série sem imagem |
| Modo WAL desativado (journal `DELETE`) | `db.pragma("journal_mode = DELETE")` em `lib/db.ts` | ✅ clone novo: `journal_mode` = `delete` e só `app.db` na pasta. ✅ `npm test` |
| Apagar o arquivo restaura o estado inicial | `lib/db.ts` | ✅ `npm test` (banco temporário) |

## Backend

| Requisito | Implementação | Verificação |
| --- | --- | --- |
| Route Handlers em `app/api/` | `app/api/**/route.ts` | ✅ `npm run build` lista as 5 rotas como dinâmicas |
| Só o backend acessa a TVmaze e o SQLite | `lib/tvmaze.ts`, `lib/db.ts` e `lib/watchlist.ts` importam `server-only` (o build falha se um componente do navegador os importar) | ✅ busca no código: esses módulos só são importados pelos Route Handlers de `app/api` (e `lib/watchlist.ts` usa `lib/db.ts`) |
| `GET /api/shows` — busca pelo nome | `app/api/shows/route.ts` | ✅ `npm run check:api` (200, 400) |
| `GET /api/shows/[id]` — série com episódios por temporada | `app/api/shows/[id]/route.ts`, `lib/seasons.ts` | ✅ `npm run check:api` (200, 400, 404) |
| Quantidade de episódios e duração total por temporada | `groupEpisodesBySeason` (`lib/seasons.ts`) | ✅ `npm test`. ✅ Breaking Bad: totais conferidos com `GET https://api.tvmaze.com/shows/169/episodes` (7/13/13/13/16 episódios; 420/780/780/780/960 min) |
| Remover marcações HTML das sinopses | `stripHtml` (`lib/text.ts`) | ✅ `npm test`. ✅ `npm run check:api`: sinopse sem tags |
| `GET /api/schedule` — programação de um país em uma data | `app/api/schedule/route.ts` | ✅ `npm run check:api` (200, 400) |
| Validar a data (`AAAA-MM-DD`), inclusive se existe no calendário | `parseScheduleDate` (`lib/validation.ts`) | ✅ `npm test` (30/02, 29/02 em ano bissexto e não bissexto, formatos errados). ✅ `npm run check:api` |
| Brasil como país padrão | `DEFAULT_COUNTRY = "BR"` (`lib/validation.ts`) | ✅ `npm test`. ✅ `npm run check:api` |
| `GET`/`POST /api/watchlist` | `app/api/watchlist/route.ts` | ✅ `npm run check:api` |
| `PATCH`/`DELETE /api/watchlist/[id]` (id local) | `app/api/watchlist/[id]/route.ts` | ✅ `npm run check:api` |
| Mesmo item da API não pode ser cadastrado duas vezes (409) | verificação prévia + `UNIQUE` em `show_id` | ✅ `npm run check:api` |
| PATCH aceita só os campos editáveis (`status`, `note`) | `parseUpdateWatchlistBody` | ✅ `npm test` e `npm run check:api` (`name`, `show_id`, `created_at`, `id` → 400) |
| Campo editável com valor inválido → 400 | `lib/validation.ts` | ✅ `npm test` e `npm run check:api` |
| `created_at` preenchido pelo backend | `DEFAULT (strftime(...))` na tabela | ✅ `npm run check:api` |
| Nome e imagem obtidos na TVmaze no POST | `getShowSummary` (`lib/tvmaze.ts`) | ✅ `npm run check:api` (envio de `name` → 400; nome preenchido pela TVmaze) |
| Validação de parâmetros | `lib/validation.ts`, `readJsonBody` (`lib/http.ts`) | ✅ `npm test` e `npm run check:api` |
| Códigos 200, 201, 204, 400, 404, 409, 502, 500 | Route Handlers + `errorToResponse` (`lib/http.ts`) | ✅ 200, 201, 204, 400, 404 e 409 em `npm run check:api`. ✅ 502 e 500 simulados manualmente (endereço da TVmaze e SQL alterados temporariamente e depois restaurados) |
| Erros em JSON no formato `{ "error": "..." }` | `jsonError` (`lib/http.ts`) | ✅ `npm run check:api` confere o formato em todos os erros. ⚠️ Métodos não implementados (ex.: `PUT`) recebem `405` do próprio Next.js, sem corpo |
| SQL parametrizado | `lib/watchlist.ts`, `lib/db.ts` | ✅ busca no código: valores sempre por parâmetros (`@nome`); a única interpolação é `PRAGMA user_version = ${SCHEMA_VERSION}`, uma constante interna (PRAGMA não aceita parâmetros) |
| Cabeçalho de identificação para a API externa | `User-Agent` em `lib/tvmaze.ts` | ✅ revisão do código; a TVmaze recomenda, mas não exige |
| Converter os dados da TVmaze para um formato próprio, só com os campos necessários | funções `to...` em `lib/tvmaze.ts` | ✅ `npm run check:api` confere os campos exatos da busca e dos itens da programação (campos não exibidos foram removidos no commit `a2b03d6`) |
| Não substituir a API por dados simulados | — | ✅ todas as consultas são feitas em tempo de execução; o banco guarda só a lista pessoal, com nome e imagem para a listagem resumida |

## Frontend

| Requisito | Implementação | Verificação |
| --- | --- | --- |
| Busca de séries | `app/page.tsx`, `SearchForm`, `SearchResults` | ✅ navegador: busca, sem resultados, termo inválido, falha da TVmaze, “Voltar” |
| Detalhe `/shows/[id]` com sinopse e episódios por temporada | `app/shows/[id]/`, `SeasonList` | ✅ navegador: Breaking Bad (totais), série sem imagem, id inválido, série inexistente, falha da TVmaze |
| Página da programação do dia com seleção da data | `app/schedule/`, `ScheduleForm`, `ScheduleList` | ✅ navegador: abre em hoje/Brasil, troca de data e país, data inválida, lista vazia, falha da TVmaze |
| Lista pessoal: alterar status, editar anotação, remover | `app/watchlist/`, `WatchlistManager`, `WatchlistItemCard` | ✅ navegador: mudar situação, salvar e apagar anotação, remover com confirmação, item removido por fora (404), lista vazia |
| Rótulos “Quero assistir”, “Assistindo”, “Concluída” | `WATCH_STATUS_LABELS` (`lib/format.ts`) | ✅ navegador |
| Rota dinâmica de detalhe | `app/shows/[id]/page.tsx` | ✅ `npm run build` |
| Dados obtidos somente via `/api/...` | `lib/server-api.ts`, `lib/api-client.ts` | ✅ busca no código. ✅ sem Server Actions (nenhum `"use server"`) |
| Componentes reutilizáveis com props; navegação com `Link` | `components/` | ✅ revisão do código |
| Estados de carregamento, vazio e erro | `StatusMessage`, arquivos `loading.tsx` | ✅ navegador e HTML gerado pelo servidor |
| Feedback em operações assíncronas | “Buscando…”, “Adicionando…”, “Salvando…”, mensagens de sucesso e erro | ✅ navegador |
| Atribuição da TVmaze (CC BY-SA 4.0) | `SiteFooter` | ✅ navegador: links para a TVmaze e para a licença em todas as páginas |

## Interface e qualidade

| Requisito | Implementação | Verificação |
| --- | --- | --- |
| Funcionar em diferentes tamanhos de tela; sem rolagem horizontal | `app/globals.css` (grades flexíveis, `@media`) | ✅ navegador: as 4 páginas em 320, 375 e 1024 px, sem rolagem horizontal |
| HTML semântico | `header`, `nav`, `main`, `footer`, `article`, `section`, `dl`, listas, títulos em ordem | ✅ revisão do código |
| Formulários e controles acessíveis | `label` ligado a cada campo, `role="search"`, `aria-describedby` | ✅ navegador: nomes acessíveis dos campos |
| Foco visível e contraste adequado | `:focus-visible` com contorno de 3 px | ✅ contraste calculado: textos ≥ 6,2:1; contorno de foco 5,0:1 (corrigido no commit `da6bfeb`). ✅ navegação por teclado, atalho “Pular para o conteúdo” |
| Mensagens anunciadas a leitores de tela | `role="status"`, `role="alert"`, `aria-live`, `aria-current` | ⚠️ atributos conferidos no navegador; não foi testado com um leitor de tela real |
| Identificadores em inglês; interface e documentação em português | todo o projeto | ✅ revisão do código |

## Não verificado

| Item | Motivo |
| --- | --- |
| Instalação e execução no Windows e no macOS | só havia Linux disponível. O better-sqlite3 13 traz binários prontos para essas plataformas (`prebuilds/win32-x64.node`, `darwin-arm64.node` etc.), mas eles não foram executados aqui |
| Node.js 22.18 (versão mínima declarada) e npm 10 | testado apenas com Node.js 26.13.0 e npm 11.20.0 |
| Leitor de tela real (NVDA, Orca, VoiceOver) | só os atributos de acessibilidade foram conferidos |
| Navegadores além do Chromium (Firefox, Safari) | só o navegador embutido do ambiente foi usado |
| Episódio real da TVmaze sem duração informada | nenhuma série consultada tinha esse caso; a regra é coberta por `npm test` com dados de exemplo |
| Entrega no SIGAA (link do repositório e nome do integrante) | ação do aluno, prazo: 22/11/2026 |
