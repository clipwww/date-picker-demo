# Date Picker Demo

這是一個以 Vue 3 + Vite 建立的日期選擇器展示專案，包含日期、時間、日期時間、日期區間等多種選擇模式。樣式採用 UnoCSS，並整合 Day.js 做日期處理。

## 功能摘要

- 單一日期、時間、日期時間選擇
- 日期區間選擇
- 多日期選擇
- 可設定最小/最大日期與時間、跨日時間
- 自訂輸入欄位與清除按鈕

## 技術棧

- Vue 3
- Vite
- TypeScript
- UnoCSS
- Day.js

## 開發需求

- Node.js 18+（建議 20+）
- Bun 1.3+

## 安裝

```bash
bun install
```

## 開發

```bash
bun run dev
```

啟動後，預設在 `http://localhost:5173`。

## 建構

```bash
bun run build
```

輸出至 `dist/`。

## 預覽

```bash
bun run preview
```

## 程式碼品質

```bash
bun run lint
```

```bash
bun run lint:fix
```

## GitHub Pages 部署

本專案已設定 GitHub Actions 自動部署。只要 push 到 `master`，就會建構並部署到 GitHub Pages。

注意事項：

- Vite `base` 已設定為 `/date-picker-demo/`，需與 GitHub repo 名稱一致。
- 請在 GitHub repo 的 Settings → Pages 將 Source 設為 GitHub Actions。

## UnoCSS 注意事項

- 已啟用 `transformerDirectives`（支援 `@apply`）與 `transformerVariantGroup`（支援 `hover:(...)`）。
- 若樣式未生效，請先重啟 dev server。

## 目錄結構

```
src/
	components/
		Picker/
			BaseDatePicker.vue
			BaseTimePicker.vue
			CustomInput.vue
			DateRangePicker.vue
			DateTimePicker.vue
	composable/
		use-date-picker.ts
	helpers/
		index.ts
```