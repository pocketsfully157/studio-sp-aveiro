import vinext from "vinext";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

// Keep Wrangler and Miniflare state project-local.
process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
process.env.WRANGLER_SEND_METRICS ??= "false";

export default defineConfig({
  server: { port: 5173 },
  plugins: [
    vinext(),
    cloudflare({
      configPath: "./wrangler.jsonc",
      persistState: { path: ".wrangler/state" },
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      inspectorPort: false,
    }),
  ],
});
