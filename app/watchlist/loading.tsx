import StatusMessage from "@/components/StatusMessage";

// Exibido enquanto a lista é carregada no servidor.
export default function WatchlistLoading() {
  return <StatusMessage kind="loading">Carregando sua lista…</StatusMessage>;
}
