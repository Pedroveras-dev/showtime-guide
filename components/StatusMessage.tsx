type StatusMessageProps = {
  kind: "loading" | "info" | "error" | "success";
  children: React.ReactNode;
};

/**
 * Mensagem de situação (carregando, aviso, erro, sucesso).
 * role="alert" faz leitores de tela anunciarem o erro na hora;
 * role="status" anuncia as demais mensagens sem interromper.
 */
export default function StatusMessage({ kind, children }: StatusMessageProps) {
  return (
    <p className={`message message--${kind}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}
