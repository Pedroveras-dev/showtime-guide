import StatusMessage from "@/components/StatusMessage";

// Exibido enquanto a programação é carregada no servidor.
export default function ScheduleLoading() {
  return <StatusMessage kind="loading">Carregando programação…</StatusMessage>;
}
