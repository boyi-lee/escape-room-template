# 托勒密占星四書｜互動學習網站

本分支將原本的閱讀密室逃脫模板，改造成《Tetrabiblos／占星四書》的繁體中文互動學習網站。

## 學習設計

- 四書學習地圖：從自然語法、世運、本命，到人生領域與時間。
- 16 個核心章節：每章包含原典定位、摘要、白話理解、關鍵規則與學習提醒。
- 章節解鎖：閱讀後通過檢核，才會解鎖下一章。
- 本機學習進度：透過 `localStorage` 保存已通過與已解鎖章節。
- 章節級搜尋：搜尋結果可直接定位至已解鎖章節，未解鎖內容會明確標示。
- 手機與桌機 RWD，不需要後端或建置工具。

## 專案結構

```text
index.html
assets/
  css/styles.css
  js/data.js
  js/app.js
docs/
  qa-first-release.md
```

- `data.js`：四書章節、原典 Book／Chapter 定位、白話內容與檢核題。
- `app.js`：搜尋、章節切換、解鎖與學習紀錄。
- `styles.css`：深藍金色古典星盤介面與 RWD。

## 視覺方向

古典星盤、深藍與金色。首頁星盤使用純 CSS 製作，不依賴圖片素材。

## 使用方式

直接開啟 `index.html`，或透過 GitHub Pages 發布。

## 內容來源與邊界

內容依據 Claudius Ptolemy《Tetrabiblos》，主要參考 J. M. Ashmand 英譯本整理。每章標示對應的 Book 與 Chapter，方便回查原典。網站內容屬教學摘要與繁體中文轉譯，不是逐字翻譯。

原典中的醫療、死亡、性別、婚姻、民族與階級描述具有歷史時代限制。網站保留其思想與技法結構，但不提供醫療診斷、死亡推算或確定性人生預測。

## 技術與依賴

- HTML5
- CSS3
- Vanilla JavaScript
- Google Fonts：Noto Sans TC、Noto Serif TC

無 JavaScript 框架、無資料庫、無後端執行依賴。Google Fonts 為唯一外部前端資源；字體載入失敗時，瀏覽器會使用本機 sans-serif／serif 字體。
