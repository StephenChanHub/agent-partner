import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const sealosAllowedHosts = [
  'localhost',
  '127.0.0.1',
  '.sealosgzg.site',
  'partner-studio.ns-lnn76r5i',
  'partner-studio.ns-lnn76r5i.svc.cluster.local',
  'rdnegqjgqcar.sealosgzg.site',
];

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 3000,
    strictPort: false,
    allowedHosts: sealosAllowedHosts,
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 3000,
    allowedHosts: sealosAllowedHosts,
  },
});
