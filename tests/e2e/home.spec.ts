import { expect, test, type Page } from '@playwright/test';
import { BUILDS, COMMUNITY, PATENTS } from '../../src/data/content';

/** canvas 上有多少像素被畫到（抽樣） */
async function paintedPixels(page: Page): Promise<number> {
  return page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('[data-canvas]')!;
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 0) n++;
    return n;
  });
}

/** 捲到導覽中的某個位置（單位：視窗高） */
async function scrollTour(page: Page, units: number): Promise<void> {
  await page.evaluate((u) => scrollTo(0, u * innerHeight), units);
  await page.waitForTimeout(700);
}

test.describe('home', () => {
  test('載入無錯誤、標題與主標正確', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto('/');
    await expect(page).toHaveTitle(/Kevin \(K2\) Tu/);
    await expect(page.locator('h1')).toContainText('Fuzzy ideas in.');
    await expect(page.locator('h1')).toContainText('Working products out.');
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });

  test('體素世界有畫出來', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-stage]')).toHaveAttribute('data-ready', 'true');
    await page.waitForTimeout(2500); // 等開場掉落動畫
    expect(await paintedPixels(page)).toBeGreaterThan(200);
  });

  test('捲動會依序切換五個章節', async ({ page }) => {
    await page.goto('/');
    const stage = page.locator('[data-stage]');
    await expect(stage).toHaveAttribute('data-chapter', '0');
    const holds = [1.35, 2.55, 3.75, 4.95, 5.95];
    for (const [i, units] of holds.entries()) {
      await scrollTour(page, units);
      await expect(stage).toHaveAttribute('data-chapter', String(i + 1));
      await expect(page.locator(`.chapter[data-index="${i + 1}"]`)).toBeVisible();
    }
    // 開場標題在導覽開始後淡出
    await expect(stage).toHaveAttribute('data-intro', 'false');
  });

  test('HUD 點點可以直接跳到某一站', async ({ page, isMobile }) => {
    test.skip(isMobile, '手機版不顯示 HUD');
    await page.goto('/');
    await scrollTour(page, 1.35);
    await page.locator('[data-pip="3"]').click();
    await expect(page.locator('[data-stage]')).toHaveAttribute('data-chapter', '3', { timeout: 5000 });
    await expect(page.locator('[data-pip="3"]')).toHaveAttribute('aria-current', '');
  });

  test('「Take the tour」會跳到第一站', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Take the tour/ }).click();
    await expect(page.locator('[data-stage]')).toHaveAttribute('data-chapter', '1', { timeout: 5000 });
  });

  test('作品卡片的體素圖示都畫好了', async ({ page }) => {
    await page.goto('/');
    await page.locator('#work').scrollIntoViewIfNeeded();
    await expect(page.locator('canvas[data-model][data-ready="true"]')).toHaveCount(BUILDS.length);
  });

  test('導覽列錨點都存在', async ({ page }) => {
    await page.goto('/');
    for (const id of ['tour', 'work', 'path', 'community', 'contact']) await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Say hi' })).toHaveAttribute('href', 'mailto:ktu@jkevintu.com');
  });

  test('沒有水平捲軸', async ({ page }) => {
    await page.goto('/');
    for (const y of [0, 0.3, 0.6, 1]) {
      await page.evaluate((f) => scrollTo(0, document.body.scrollHeight * f), y);
      await page.waitForTimeout(200);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });

  test('經歷標題、專利連結與社群區', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#path-title')).toHaveText('Engineer → PM → AI Builder.');
    const links = page.locator('.patents a');
    await expect(links).toHaveCount(PATENTS.flatMap((p) => p.numbers).length);
    for (const href of await links.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href)))
      expect(href).toMatch(/^https:\/\/patents\.google\.com\/patent\//);
    // 純文字（複製、閱讀模式）時標題與公開號之間要有空白
    await expect(page.locator('.patents li').first()).toContainText('environment US 2024/0185306 A1');
    await expect(page.locator('.patents li').nth(1)).toContainText('A1 WO 2024/151578 A1');
    await expect(page.locator('#community .guild__item--featured')).toHaveCount(1);
    await expect(page.locator('#community blockquote')).toContainText('most passionate and creative PM');
    await expect(page.getByText('Side quest · Writing')).toHaveCount(0);
    // 已上線的產品是可點的外部連結；還在做的只顯示文字
    for (const href of [
      'https://karakuma.com',
      'https://elephantgym.co',
      'https://taro-us.org',
      'https://club.fantimate.com/spacen/',
      'https://firework.com/blog/firework-launches-ava-the-virtual-shopping-assistant-giving-a-face-to-e-commerce',
    ])
      await expect(page.locator(`a.linkout[href="${href}"]`)).toHaveCount(1);
    await expect(page.locator('.linkout--soon')).toContainText('makeready.design');
    // 先不公開的說法
    await expect(page.locator('body')).not.toContainText('$1M');
    await expect(page.locator('body')).not.toContainText('3×');
  });

  test('結構化資料可解析', async ({ page }) => {
    await page.goto('/');
    const json = await page.locator('script[type="application/ld+json"]').textContent();
    expect(JSON.parse(json!)).toMatchObject({ '@type': 'Person', alternateName: 'K2' });
  });
});

test.describe('降級', () => {
  test('減少動態：仍可導覽、畫面照常出現', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('[data-stage]')).toHaveAttribute('data-ready', 'true');
    expect(await paintedPixels(page)).toBeGreaterThan(200);
    await scrollTour(page, 3.75);
    await expect(page.locator('[data-stage]')).toHaveAttribute('data-chapter', '3');
    await ctx.close();
  });

  test('沒有 JavaScript：五個章節都是一般內容', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    for (let i = 1; i <= 5; i++) await expect(page.locator(`.chapter[data-index="${i}"]`)).toBeVisible();
    await expect(page.locator('[data-canvas]')).toBeHidden();
    await expect(page.locator('#work .card')).toHaveCount(BUILDS.length);
    await expect(page.locator('#community .guild__item')).toHaveCount(COMMUNITY.length + 1);
    await ctx.close();
  });
});

test.describe('其他頁面', () => {
  test('404 頁', async ({ page }) => {
    const res = await page.goto('/this-level-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('Game over.');
  });

  test('舊站 /app 導回首頁', async ({ request }) => {
    const html = await (await request.get('/app/')).text();
    expect(html).toContain('http-equiv="refresh"');
    expect(html).toContain('url=/');
  });

  test('favicon 與網點 SVG 都是合法 SVG', async ({ request }) => {
    for (const path of ['/favicon.svg', '/ht/corner-blue.svg', '/ht/linear-pink.svg']) {
      const res = await request.get(path);
      expect(res.ok()).toBe(true);
      expect(res.headers()['content-type']).toContain('image/svg+xml');
      expect(await res.text()).toMatch(/^<svg/);
    }
  });

  test('CNAME 指向 jkevintu.com', async ({ request }) => {
    expect((await (await request.get('/CNAME')).text()).trim()).toBe('jkevintu.com');
  });
});
