# jkevintu.com

K2（Kevin Tu）的個人網站：**以產品思維、AI 系統與設計工程，把模糊想法做成真正運作的產品。**

首頁是一座用程式即時繪製的等角體素浮島——一條輸送帶把「模糊的想法」（真的是一團會抖的像素）一路送過燈塔、AI 核心、工坊，最後變成三色的產品方塊裝進火箭。捲動就是鏡頭。

## 設計系統

- **色票**：三色油墨（藍 `#304FFE`／粉 `#FF3E86`／黃 `#FFCF33`）+ 紙 + 墨。淡色是同一油墨的淡網，暗部是兩色疊印（黃+粉=橘、粉+藍=紫）。定義在 `src/lib/iso/palette.ts`，CSS 變數在 `src/styles/global.css`，兩邊要同步。
- **網點**：畫布上用 4×4 Bayer 網點當紋理；背景的大網點是 build 時產生的 SVG（`src/lib/halftone.ts`，點的大小隨濃度變化、網屏角度仿 riso）。
- **字體**：Archivo（variable，標題用 125% 寬）＋ Silkscreen（像素標籤）。

## 結構

```
src/
  data/content.ts        # 所有文案（來源：LinkedIn）— 改內容只要改這裡
  lib/iso/               # 體素引擎（純函式、可測）
    palette.ts           #   色票與材質
    sprite.ts            #   2:1 等角方塊光柵化
    world.ts             #   體素儲存、投影、畫家演算法排序
    island.ts            #   首頁浮島場景、站點、輸送帶路線、導覽節奏
    camera.ts            #   捲動 → 鏡頭
    fx.ts                #   動態：物件升級、火箭、光束、電波…
    render.ts            #   瀏覽器端繪製（原生解析度 → 最近鄰放大）
    models.ts            #   作品卡片的小模型
  scripts/               # 瀏覽器端：tour / icons / wave
  components/Tour.astro  # 開場 + 導覽舞台（沒有 JS 時退回一般卡片）
  pages/                 # 首頁、404、/app 轉址、favicon 與網點 SVG
tests/unit               # Vitest
tests/e2e                # Playwright（桌機 + 手機）
```

## 開發

```bash
npm install
npm run dev          # http://localhost:4321
npm test             # 單元測試
npm run check        # 型別檢查
npm run build && npm run test:e2e
npm run og           # 重新產生 public/og.png（需先 build）
```

## 部署

推到 `master` 後 GitHub Actions 會跑完型別檢查、單元測試、build、E2E，再部署到 GitHub Pages（自訂網域 `jkevintu.com`）。

## 舊站備份

- 本 repo 舊的轉址頁：tag `legacy-2020-redirect`、branch `legacy/2020-redirect`
- 2022 年的 React 作品集（原本在 `/app`）：[jkevintu/app](https://github.com/jkevintu/app) 的 tag `legacy-2022-portfolio` 與 `gh-pages` branch。`/app` 現在會轉回首頁。
