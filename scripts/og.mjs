// 產生 public/og.png（1200x630）：直接拍首頁開場，隱藏導覽列等 UI。
// 用法：npm run build && npm run og
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const PORT = 4329;
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT), '--ignore-lock'], { stdio: 'ignore' });
try {
  await new Promise((r) => setTimeout(r, 2500));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.addStyleTag({
    content: `
      .nav, .tour__hint, .hud, .tour__progress, .hero__lede, .hero__cta, .hero__now { display: none !important; }
      .js .tour__hero { top: 96px !important; left: 64px !important; width: 560px !important; }
      .hero__title { font-size: 92px !important; }
    `,
  });
  await page.waitForTimeout(3200);
  await page.screenshot({ path: 'public/og.png' });
  await browser.close();
  console.log('wrote public/og.png');
} finally {
  server.kill();
}
