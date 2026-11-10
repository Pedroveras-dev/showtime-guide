# Guia de Séries de TV

Trabalho da 2ª Avaliação de Programação Web (UESPI, prof. Eyder Rios), Problema 10.

Aplicação Next.js que permite buscar séries de TV, consultar temporadas e
episódios, ver a programação do dia e manter uma lista pessoal de séries,
usando dados da [TVmaze](https://www.tvmaze.com/api).

> Documento em construção. Ele será completado ao longo do desenvolvimento.

## Integrante

- João Pedro Veras

## Tecnologias

- Next.js 16 (App Router) e React 19
- TypeScript em modo estrito (`"strict": true`)
- CSS puro

## Versão do Node.js

Desenvolvido e testado com Node.js 26.13.0 e npm 11.20.0 (mínimo: Node.js 22.18, que executa TypeScript diretamente nos testes).

## Como executar

```bash
npm install
npm run dev
```

Depois, acesse <http://localhost:3000>.

### Outros scripts

| Comando             | Finalidade                                |
| ------------------- | ----------------------------------------- |
| `npm run build`     | Gera o build de produção                  |
| `npm run start`     | Executa o build de produção               |
| `npm run lint`      | Verifica o código com o ESLint            |
| `npm run typecheck` | Verifica os tipos com o compilador do TypeScript |
| `npm test`          | Executa os testes automatizados (pasta `tests/`) |
