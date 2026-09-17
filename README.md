# EasyPage · M1

可執行的 editorial layout editor：React + TypeScript + Vite，HTML 操作介面、SVG 預覽、JSON 主文件。

## 啟動

```sh
cd /Users/nullbaysea/Desktop/_AI/_Astra/_EasyPage
npm install
npm run dev
```

開啟終端顯示的本機網址（預設 http://127.0.0.1:5173）。需 Node.js 22.12+，本次使用 Node 24.13.1。

```sh
npm run build       # TypeScript + production build
npm run preview     # 預覽 dist
npm test            # 27 項核心契約測試
npm run schema      # 從 Zod 產出 JSON Schema
node scripts/browser-check.mjs  # 需先啟動 dev；使用已安裝的 Google Chrome
```

## 從自己的頁序開始

首次開啟會先出現「選擇 Theme」。已經有文件時，按右上角「＋ 新建文件」。

1. 選風格：目前 Soft Editorial 可用，另兩套風格尚未開放。
2. 在視覺頁型庫選構圖並加入需要的頁型；同一頁型可重複使用。
3. 在「我的頁序」命名文件、上下移動、重複或移除頁面；單頁／跨頁會自動計算頁碼。
4. 按「開始放入圖文」進入編輯器，再替換 sample copy 與圖片。也可選擇開啟整份示範文件。
5. 編輯途中可繼續新增頁型（插入目前頁之後）、複製目前頁與重新排序。
6. 自動儲存每份文件。點頂端文件名稱旁的文件圖示「我的文件」可切換；新建不覆蓋原文件。

團隊頁有「人物 1 照片／姓名／職稱」與「人物 2 照片／姓名／職稱」。分別上傳兩張人像，不需預先拼圖；兩張照片各有 crop、focal、effects 與 metadata。舊版預設雙人 placeholder 會自動升級，使用者自己的照片與文字保留。

## 現在可以測什麼

- Theme 1 Beauty：9 個 16:9 單頁；Theme 2 Corporate：9 個 A4 直式單頁；Theme 3 Architectural：9 個 A4 橫式單頁＋4 個跨頁。
- 中央點選文字或圖片，右側依內容切換 inspector。
- 每個頁型有 2 個構圖；切換時保留相同 semantic slot 內容與效果。
- 編輯中英文、多行文字；新增／移除引言、圖片說明、章節標記、第二張圖。必要欄位禁止移除。
- 動態 stack 重新分配空間、文字縮放／換行，過長文字保留原文並顯示警告。
- 換素材、上傳／拖放 PNG/JPEG/WebP（單檔上限 10 MB）、修改 alt、名稱、網址及原始尺寸。修改某頁素材時複製獨立 metadata，不會連動其他頁。
- crop（完整／中央 70%）、cover/contain、focal X/Y；透明度、混合、模糊、染色與陰影。
- Architectural 跨頁為兩張 A4 橫式並排，保留中縫安全區；舊版 Beauty 跨頁文件仍可開啟。
- 加入 sample page/spread、重新排序、刪除、復原／重做。
- 瀏覽器編輯快取＋工作資料夾自動儲存；可按「儲存文件」或 Cmd/Ctrl+S。磁碟保存成功／失敗會分開顯示。JSON 下載／驗證匯入可用。
- 三套 Theme 都可選，使用各自的 sample copy 與本機素材。Corporate／Architectural 的圖片為原創 SVG 示意圖。

## 真實上傳、Instant Alpha 與靜態 demo

本機 `npm run dev` 現在包含真實上傳／保存 API。文件寫入 `user-jobs/<document-id>/document.json`，原圖與透明 PNG 寫入該工作的 `assets/`。替換圖片成功後會使用磁碟素材 URL；metadata 編輯不會重寫原圖。

點選圖片 →「Instant Alpha · 背景色去背」→ 點背景色 → 調容差／柔化 → 套用。MVP 每次處理一個連續色域；最長邊 2048px 的透明 PNG 另存，原圖保留，可一鍵還原。AI 髮絲去背尚未實作。

只有靜態網頁空間時，使用 **easypage-static-demo.zip**，解壓後上傳其中的內容。此包僅在瀏覽器內保存，**不會上傳到網站主機**。需要真正網路上傳時，另接 Node API 或受管理的儲存服務；目前未連任何雲端帳號或資料庫。詳見 [部署說明](docs/deployment.md)。

```sh
npm run build:static    # 純靜態 demo → dist-static/
npm run build
npm start              # 同源 Node demo + 檔案 API → localhost:4173
```

## 主要檔案

|位置|職責|
|---|---|
|`src/core/schema.ts`|v0.1 型別、Zod runtime schema，唯一結構來源|
|`schemas/*.schema.json`|可供其他系統使用的 JSON Schema draft-07|
|`src/core/actions.ts`、`projects.ts`|必要欄位保護、模板實例化、內容更新、插入／複製頁面與 pagination|
|`src/core/registry.ts`|風格載入、文件語意驗證、素材來源驗證|
|`style-packs/soft-editorial/pack.json`|tokens、9 layouts、18 variants、semantic slots 與 gutter rules|
|`samples/nara-skin.json`|完整可序列化 master document 與素材 metadata|
|`src/engine/`|layout、typography、style、effects、image：不依賴 React|
|`src/renderer/SvgPreview.tsx`|scene graph → SVG；包含 selection hit areas|
|`src/ui/`、`src/app/`|HTML 編輯器、contextual inspector、狀態與儲存|
|`src/export/adapters.ts`|JSON 下載及 PDF/IDML interface/stub|
|`public/assets/nara-serum.png`|本次生成的產品示範圖|
|`docs/architecture.md`|分層、資料流、擴充方式與限制|
|`docs/schema-v0.1.md`|欄位規格與 effect/image 處理順序|
|`docs/screenshots/`|實際 Chrome 畫面截圖|

## 範例品牌與素材

NARA Skin 是虛構品牌。Sample copy、人物、產品與網址皆為示範內容。產品照片使用內建 image generation 產生；植物與團隊圖片是明確標示的原創 SVG placeholders，可直接替換。無外部字體或遠端照片依賴。生成 prompt 與參考分析見 `docs/references-and-assets.md`。

## M1 邊界與下一步

- 未實作 PDF/IDML 匯出、AI 去背、印刷出血／裝訂補償、多人協作。
- 文字量測為 deterministic estimate，不是字型 shaping engine。超出最小字級仍放不下時，預覽裁切並提示，不截斷 master text。
- 外部 HTTPS 圖片須可被瀏覽器讀取；修改網址時需同步確認原圖尺寸。Image load error 會露出素材名稱底板。
- localStorage 是瀏覽器／origin 專屬，容量有限；完整本機版另有磁碟工作資料夾。純靜態版的重要版本請下載 JSON。大型瀏覽器快取下一步改用 IndexedDB。
- 桌面優先 UI，最小工作寬度 960px；本次驗證 1512×982。
- 下一個 milestone：真實字型量測與 overflow policy、更多 intent-specific layouts、資產管理／AI 去背 provider，再做輸出 adapters。

## 三套 Theme demo 與隨時調整頁序

Theme 選擇是獨立 modal；下一步進入 app 主層的頁序工作區。左側頁型庫上方排列所有單頁，下方排列所有跨頁，右側組合自己的頁序。可重複加入、改構圖、用箭頭或拖曳排序。

編輯途中按「頁序規劃」可再次修改；套用時保留現有頁面的圖文與圖片處理設定，新增頁面取自原始 sample，複製頁面保留已編輯內容。取消不修改文件，套用後可復原。圖片 Inspector 的「恢復範例圖片」只還原該圖片欄位，保留原始上傳素材。

|Theme|尺寸|頁型數|
|---|---|---|
|Soft Editorial / Beauty|1600×900，16:9|9 單頁|
|Modern Corporate Report|840×1188，A4 直式比例|9 單頁|
|Architectural Editorial|1188×840，A4 橫式比例；跨頁 2376×840|9 單頁＋4 跨頁|

A4 為精確比例的 preview units，尚未承諾印刷輸出單位。`style-packs/soft-editorial-wide` 是新 Theme 1；舊 `soft-editorial` 保留作既有文件相容用途，不出現在新建 Theme 清單。
