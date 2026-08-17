# Pulse 遠端工作打卡

一個簡潔的遠端工作打卡頁面，提供即時時間、上下班打卡、本週工時摘要與近期出勤紀錄。

## 功能

- 上班與下班打卡
- 打卡時間保存在目前瀏覽器
- 即時台北時間與工作狀態
- 本週工時摘要及近期出勤表格
- 支援桌面與手機版面

## 開始使用

需求：Node.js 22.13 或更新版本、pnpm。

```bash
pnpm install
pnpm dev
```

開啟 `http://localhost:3000` 即可預覽。

## 常用指令

```bash
pnpm dev       # 啟動開發環境
pnpm build     # 建立正式版本
pnpm lint      # 檢查程式碼
pnpm test      # 建置並執行基本測試
```

## 技術

React 19、TypeScript、vinext、Vite、Cloudflare Workers。

## 資料說明

目前打卡資料只保存在使用者的瀏覽器（localStorage），沒有連接後端資料庫。清除瀏覽器資料後，打卡狀態也會一併清除。

## 授權

僅供個人與內部專案使用。
