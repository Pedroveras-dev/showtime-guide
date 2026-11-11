import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Impede que o `next dev` gere automaticamente o arquivo AGENTS.md.
  agentRules: false,

  // O componente <Image> só carrega imagens externas de endereços liberados
  // aqui: apenas as imagens de séries hospedadas pela TVmaze.
  images: {
    remotePatterns: [new URL("https://static.tvmaze.com/uploads/images/**")],
  },
};

export default nextConfig;
