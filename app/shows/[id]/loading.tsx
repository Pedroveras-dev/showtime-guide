import StatusMessage from "@/components/StatusMessage";

// Exibido enquanto a página da série é carregada no servidor.
export default function ShowLoading() {
  return <StatusMessage kind="loading">Carregando série…</StatusMessage>;
}
