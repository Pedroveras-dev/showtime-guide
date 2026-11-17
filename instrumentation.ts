// O Next.js chama register() uma única vez, quando o servidor inicia
// (npm run dev ou npm start), antes de atender a primeira requisição.
// Aqui o banco é aberto já na inicialização: se data/app.db não existir, ele é
// criado com a tabela e os registros iniciais na primeira execução, mesmo que
// nenhuma página que usa o banco tenha sido aberta ainda.
export async function register() {
  // O SQLite só funciona no runtime Node.js (não no Edge).
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  try {
    const { getDb } = await import("@/lib/db");
    getDb();
  } catch (error) {
    // Uma falha aqui não impede o servidor de subir: a busca e a programação
    // continuam funcionando, e os endpoints da lista tentam abrir o banco de
    // novo a cada requisição (respondendo 500 enquanto o problema persistir).
    console.error("[Banco de dados] Não foi possível criar ou abrir data/app.db:", error);
  }
}
