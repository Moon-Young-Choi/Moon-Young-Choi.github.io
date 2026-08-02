import vinext from "vinext";
import { defineConfig } from "vite";

// This portfolio is built as a static artifact and published to GitHub Pages.
// Keep the Vite graph independent of the retired Sites/Cloudflare hosting stub.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig({
  server: isCodexSeatbeltSandbox
    ? { watch: { useFsEvents: false, usePolling: true } }
    : undefined,
  plugins: [vinext()],
});
