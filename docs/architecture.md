# M1 架構

UI communicates intent; schemas describe design; engines resolve layout; renderers only draw.

```text
HTML / React UI
   ↓ semantic action
Application controller + history / persistence
   ↓
JSON MasterDocument + StylePack
   ↓
Layout engine → Style / Typography / Image / Effects
   ↓
Serializable scene graph
   ↓
SVG renderer                 PDF / IDML adapters (stubs)
```

## 分層契約

1. **UI**：頁面清單、選取狀態、表單、檔案輸入、提示。不得決定幾何位置。App CSS 只管編輯器，不控制文件字體／色盤。
2. **Document model**：持久化 intent、kind、layoutId、variantId、semantic content、effects overrides、asset metadata。不可儲存 SVG DOM 作為 master。
3. **Application**：`reduceDocument` 產出不可變文件；UI 呼叫 actions。undo/redo 最多 30 個過去狀態；localStorage 400 ms debounce。匯入先做結構驗證，再檢查版型、slot type、asset reference 與 ID uniqueness。
4. **Layout engine**：依正規化 region frame 與 stack weights 解出絕對座標。optional slot 缺席就從 flow 移除，其餘 slot 分配剩餘高度。只變更 variantId 即可重新排版，content 不動。
5. **Style engine**：從 pack tokens 解析角色字體與色彩。effect resolver 合併 base defaults 與 user overrides；同一 type 的 override 取代 base。
6. **Renderer**：接收 scene graph；只繪製 SVG text、image、clip、filters、guide 與 hit target。與文件規則無關。SVG 內的 React 是 renderer adapter，幾何引擎本身完全不依賴 React。
7. **Asset processing**：獨立處理素材選擇、crop、fit、focal 與去背結果 reference。去背 provider 目前會明確回報未安裝，無假成功。
8. **Export**：JSON 可用；PDF/IDML 共用 `ExportAdapter`，呼叫 stub 會明確拋出未實作，不產出偽裝檔案。

## Spread 與中縫

single W×H；spread 2W×H，不加一張虛構中間頁。region `scope` 可為 page/left/right/spread；page scope 用於 single。左右頁的 gutterSafe region 會被限制在各半頁，保留安全距離。Gallery 使用 `scope:spread` 與 `gutterSafe:false`，且 layout 明確宣告 `allowImageCrossing:true`。跨頁圖片是同一個 image element、同一個 crop，不是左右兩張重複貼圖。

目前 gallery 允許圖像主體通過中縫；未做臉部或產品偵測。binding 已存於 document schema，M1 不套用實體裝訂補償。中縫參考線只影響預覽。

## 新增與修改版型

在 `style-packs/soft-editorial/pack.json` 新增 intent/layout；宣告 semantic slots、regions 與 variants；在 `samples/nara-skin.json` 加 sample unit。現有 UI 依 layout 定義產生表單與新增項目。每個 variant 必須映射所有支援 slot 一次，且保持相同內容 contract。測試覆蓋這些條件。

更改色盤或 typography，只改 tokens。不要在 CSS 或 renderer 中增加 Beauty 特例。新增通用效果則同時更新 schema、effect resolver、SVG adapter 與測試。後續 PDF adapter 須聲明支援效果子集。

## 新增 Style Pack

`style-packs/*/pack.json` 由 registry 自動載入。兩個 planned packs 已有 manifest 與 tokens，但 layouts 為空。完成 layouts、sample document、manifest status 後，可接上新的 sample selection；初始可用風格仍是 Soft Editorial；registry 依 manifest 的 sampleDocument 載入範例，UI 依當前文件取得 pack。新建文件可選 ready pack。新增跨 style content mapping 是後續功能，不以不相容的 slot 靜默重置內容。

## v0.1 驗證與演進

`src/core/schema.ts` 是結構真源；執行 `npm run schema` 同步 JSON Schema。JSON Schema 無法表达 crop x+width 等跨欄位算式，因此 runtime Zod refine 與 semantic validation 仍是必要關卡。所有 persisted files 有 schemaVersion，pack 有 version；不相容版本拒絕載入。下一版新增 `migrateDocument(from,to)`，禁止默默解讀未知版本。

## 已知取捨

- normalized frames 與 weighted vertical stack 是刻意有限的 grammar，尚未包含 linked text frames、自由拖曳或自動選 variant。
- scene 帶 warnings；文字使用估算字寬與最小字級，renderer 使用 clip frame，原始內容完整保留。
- image crop 是 normalized source window；focal 在 M1 表示該窗口內的 overflow alignment（0 左／上、1 右／下），不是 face tracking。
- 歷史紀錄、內嵌圖片與文件存於記憶體；大文件應改用 command history + IndexedDB。
- HTML 表單具 labels、SVG 元件可用鍵盤 Enter／Space 選取。共用 Dialog 支援 focus trap、Escape 關閉與焦點還原；正式上線前仍需完整輔助技術 audit。

## Style library 與使用者文件

StylePack / SampleDocument 是唯讀模板來源；`createProject` 按使用者選擇的 PageChoice 序列建立獨立 MasterDocument。每次加入同一頁型都產生獨立 unit ID 及素材 reference，不共用可變圖文。加入頁面可以指定 afterId；duplicate 複製目前編輯內容而非退回 sample。

`easypage.projects.v0.1` 保存 activeId 與 documents map；仍同步舊的 `easypage.document.v0.1` 相容鍵。首次會讀入既有舊文件；新建／切換不刪除舊文件。Undo/redo 在切換文件時重設，避免跨文件混淆。

團隊 layout 把 hero/secondary 分別標為 person-1-portrait/person-2-portrait，另有 name1/role1/name2/role2。新增文字欄位為 optional，保持 v0.1 舊文件可讀。migrations 僅辨識原始 placeholder URL 與 placeholder kind，把舊的合成示範圖拆為兩個獨立素材；不拆解自訂／上傳的圖片，亦不覆寫已編輯內文。

## Job storage 與 Instant Alpha

`server/storage.ts` 實作 filesystem adapter，`src/app/storage.ts` 是瀏覽器的服務邊界；開發模式由 Vite middleware 掛載，正式同源 demo 由 `server/index.ts` 同時服務 dist 與 API。localStorage 仍是編輯快取；磁碟保存另有成功／失敗狀態，不混稱。每個 job 的 request queue 保持寫入順序；伺服器以 atomic rename 保存 JSON。用戶內容不提交進程式碼版本庫。

`src/engine/alpha.ts` 是純 RGBA 運算：從點選處 flood fill，RGB 色差決定連續選區，容差內 alpha=0、邊緣帶依 feather 插值。UI canvas 只呈現與選色，結果由同一 upload adapter 寫入新 PNG。原 assetId 不變，backgroundRemove.resultAssetId 指向 derivative；重設去背可還原原圖。處理最長邊上限 2048px，原始檔案不縮減。MVP 每次處理一個連續色域，尚非 AI segmentation、多重選區、髮絲 matting。

Static build 將 storage adapter 切為 browserOnly，完全不發送 API；上傳語意改為本機選取，儲存狀態明確標示未上傳網站。見 deployment.md。

## Theme catalog and pagination workspace

`catalogPacks` defines the ordered three-theme catalog. A manifest's `catalog: false` keeps legacy documents renderable without offering that pack for new jobs. `getSample` returns freshly parsed bundled content and rejects uploaded/remote/job-folder sources in templates.

`ThemePicker` selects a master theme. `ProjectComposer` is a main-layer workspace, not another modal. `revisePagination` applies an explicit draft to an existing document while retaining user content and assets; new units come from clean samples. Applying the draft creates one undo step. `PageLibrary` reads its own canonical sample and groups singles above spreads.

The two new demos use original local SVG illustrations. They are placeholders, not architectural drawings or audited corporate data. Existing documents retain their original pack and page dimensions.
