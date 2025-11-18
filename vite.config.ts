import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  environments: {},
  base: "/math-3D-practicing",
  server: {
    watch: {
      ignored: ["**/docs/ia-only/**"]
    }
  }
});
