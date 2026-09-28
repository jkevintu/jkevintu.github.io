// 開發用：用 headless Chromium 截圖（桌機 + 手機）各個導覽站點
import { chromium, devices } from '@playwright/test';

const base = process.env.BASE ?? 'http://localhost:4321';
const out = process.env.OUT ?? '/tmp/shots';
const which = (process.env.ONLY ?? 'desktop,mobile').split(',');
const stops = (process.env.STOPS ?? '0,1.35,2.55,3.75,4.95,5.95,6.8').split(',').map(Number);

const browser = await chromium.launch();
const configs = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: { ...devices['iPhone 13'] },
};
for (const name of which) {
  const ctx = await browser.newContext(configs[name]);
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && console.log('console error:', m.text()));
  page.on('pageerror', (e) => console.log('page error:', e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);
  for (const s of stops) {
    await page.evaluate((u) => scrollTo(0, u * innerHeight), s);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/${name}-${String(s).replace('.', '_')}.png` });
  }
  if (process.env.FULL) {
    await page.evaluate(() => scrollTo(0, document.getElementById('now').offsetTop));
    await page.waitForTimeout(400);
    for (let i = 0; i < 12; i++) {
      await page.evaluate(() => scrollBy(0, innerHeight * 0.9));
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${out}/${name}-page-${i}.png` });
      const done = await page.evaluate(() => innerHeight + scrollY >= document.body.scrollHeight - 2);
      if (done) break;
    }
  }
  await ctx.close();
}
await browser.close();
