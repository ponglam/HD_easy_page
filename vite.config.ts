import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createStorageHandler } from './server/storage';
export default defineConfig({ plugins: [react(),{
 name:'easypage-job-storage',
 configureServer(server){const api=createStorageHandler();server.middlewares.use((req,res,next)=>{void api(req,res).then(handled=>{if(!handled)next();}).catch(next);});}
}] });
