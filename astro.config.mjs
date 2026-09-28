// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://jkevintu.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
