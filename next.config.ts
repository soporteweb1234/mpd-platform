import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["discord.js", "@discordjs/ws", "@discordjs/rest"],
};

export default nextConfig;