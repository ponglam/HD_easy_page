# Demo 與真正上傳

## 你的空間只有靜態網站

直接使用根目錄的 `easypage-static-demo.zip`。解壓後，把 **內容**（index.html、assets 等）上傳到網站目錄，例如 `/easypage/`，以 HTTPS 網址開啟。不要只上傳 ZIP，也不要用雙擊本機 HTML 代替網站服務。

此版本可以選風格、自訂頁序、改字、選擇圖片、Instant Alpha、復原、JSON 保存。資料保留在訪客自己的瀏覽器；UI 顯示「瀏覽器示範 · 未上傳至網站」。它不會、也無法在純靜態主機上建立 user-job 資料夾。不同訪客不會看到彼此的瀏覽器資料；清除網站資料就會移除本機副本。重要文件應下載 JSON，含本機選取的內嵌圖片。

重新打包：

```sh
npm run build:static
```

部署 `dist-static/` 內容；base 使用相對路徑，可放子目錄。Alpha 處理在瀏覽器執行，不需要 AI 服務或資料庫。

## 本機完整版本（已實作）

```sh
npm run dev
```

Vite 同時掛載檔案 API。每份工作保存為：

```text
user-jobs/
  <document-id>/
    document.json
    assets/
      <content-hash>.png
      <content-hash>.jpg
      <content-hash>.webp
      <content-hash>.svg
```

- 上傳 PNG/JPEG/WebP，單檔上限 10 MB；成功後才替換圖片。
- 素材以內容 hash 命名去重，原本的檔名／說明保留在 document metadata。
- 專案自動保存＋「儲存文件」按鈕；文件寫入採用 temp + rename。
- 保存工作時，內嵌圖片與內建 sample assets 會整理到該工作的 assets，複製工作引用的其他工作素材也會拷入。
- 外部 HTTPS 圖片仍是連結，不會由伺服器偷偷抓取；需要永久保存時請上傳檔案。
- Alpha 結果是新的透明 PNG，原圖與去背參數保留，可隨時還原。
- 「我的文件」可讀取磁碟工作資料夾，即使清除瀏覽器副本仍可找回；首次進入時可先開一份文件，再按「我的文件」。
- 目前是單人／共享 demo workspace，沒有帳號層級的 job isolation。

## 要在線上真正上傳

靜態前端可以保留在現有網站，但需額外的檔案 API 或受控儲存服務。

|方案|可真正上傳|是否先要資料庫|
|---|---|---|
|現有純靜態 demo|否，僅瀏覽器內資料|否|
|Node.js API ＋持久化磁碟|是；本機已實作同一介面|否；document.json 即可保存文件|
|靜態前端＋受管理 Auth／Object Storage|是；需要帳號、bucket、存取規則與 adapter|不必先設計完整資料表；可先把 JSON 與圖片作為檔案|

例如 Supabase Storage 可搭配 Auth 與存取規則保存圖片。這是後續可接的服務，**目前沒有建立或連接任何雲端帳號、bucket 或資料庫**。正式提供多人使用時，再加入 user/job ownership、配額、資料版本與分享權限；資料庫適合管理這些索引與關係，圖片仍放 object storage。

## Node.js 同源 demo 啟動（需要額外主機）

```sh
npm run build
npm start
```

預設 http://127.0.0.1:4173。server 同時服務 dist 與檔案 API，無跨網域設定。對外展示需 HTTPS reverse proxy、持久化 volume，並設定以下環境變數（伺服器端，不放在前端）：

```text
HOST=0.0.0.0
PORT=4173
EASYPAGE_DATA_DIR=/persistent/easypage-jobs
EASYPAGE_DEMO_USER=<demo user>
EASYPAGE_DEMO_PASSWORD=<strong password>
```

這是單一共用帳密 demo，不是多租戶服務。當 HOST 對外監聽且缺少共用帳密時，server 拒絕啟動。不要把開發伺服器直接當公開服務。

**把 API 另外放到不同網域**需要再接 frontend API base URL、CORS 與認證 adapter，目前產出的 static zip 沒有設定任何遠端 API。

參考：[Vite 靜態部署](https://vite.dev/guide/static-deploy.html)、[Supabase Storage](https://supabase.com/docs/guides/storage)。
