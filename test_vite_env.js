import { defineConfig } from 'vite';
import { loadEnv } from 'vite';

const env = loadEnv('development', process.cwd(), '');
console.log('VITE URL:', env.VITE_SUPABASE_URL);
console.log('PROCESS URL:', process.env.VITE_SUPABASE_URL);
