import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [react()], server: { port: 5173, strictPort: true, proxy: { '/api/v1': 'http://127.0.0.1:8081', '/socket.io': { target: 'http://127.0.0.1:8081', ws: true } } } });
