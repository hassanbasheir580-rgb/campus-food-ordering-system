var _a;
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({
    plugins: [react()],
    server: {
        port: Number((_a = process.env.VITE_PORT) !== null && _a !== void 0 ? _a : 5173)
    }
});
