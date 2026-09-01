import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@erdflow/web": path.resolve(__dirname, "../../packages/web/src/index.ts"),
    },
  },
  build: {
    outDir: "../../packages/cli/public",
    emptyOutDir: true,
  },
  base: "/",
})
