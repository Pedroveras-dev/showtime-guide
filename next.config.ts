import type { NextConfig } from "next";

// Configuração mínima: o projeto usa os comportamentos padrão do Next.js.
const nextConfig: NextConfig = {
  // Impede que o `next dev` gere automaticamente o arquivo AGENTS.md.
  agentRules: false,
};

export default nextConfig;
