import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://italia-gohan-map.vercel.app',
  output: 'hybrid',
  adapter: vercel(),
});
