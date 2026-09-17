# Style Pack / Document Schema v0.1

完整機器規格：`schemas/style-pack.v0.1.schema.json`、`document.v0.1.schema.json`、`manifest.v0.1.schema.json`。型別由 Zod inference 提供，無第二份手寫型別。

## Style pack

- manifest：id、name、schemaVersion、version、ready/planned、supportedIntents、sampleDocument。
- tokens：paper/ink/muted/accent/line；各 typography role 的 family、size、minSize、leading、tracking、color、italic。
- layout：id、label、intent、single/spread、description、slots、variants、gutter。
- slot：id、label、semantic、text/image、required、addable、removable、style、defaultEffects。required 應搭配 addable=false、removable=false。
- variant：id、label、regions。
- region：normalized frame、stack/overlay flow、gap、scope、gutterSafe、slot order、weights。
- gutter：width、textSafety、imageSafety、allowImageCrossing；數值單位為畫布座標。

## Master document

- schemaVersion、document id/title、stylePackId/version。
- page：width、height、binding（digital/saddle-stitch/perfect）。
- units：有序 layout units。每個單位有 id/label/kind/intent/layoutId/variantId。
- slots：以 semantic id 索引。text 存 text/effects；image 存 assetId/operations/effects。Optional 缺席以沒有該 key 表示。
- assets：id、label、alt、src、width/height、kind、credit、artDirection。上傳原圖以 data URI 嵌入 JSON；生成素材使用 public 路徑。

## 效果與圖片操作

通用 effect union：opacity(value 0–1)、blend(normal/multiply/screen/overlay/soft-light)、blur(radius)、shadow(dx/dy/blur/color/opacity)、tint(color/amount)。同類 override 取代 default；順序固定為 blur → tint → opacity → blend → shadow 的 resolver contract。SVG adapter 將 blur/tint/shadow 放在 filter，opacity/blend 放在外層 group，因此陰影也接受 group opacity。未承諾與未來印刷 renderer 像素完全一致。

image operations：fit(cover/contain)、focal(x/y)、crop(x/y/width/height)、backgroundRemove(mode/status/color/threshold/feather/resultAssetId)。先解析去背結果，再 crop/fit/focal、再套通用效果。color-key 已實作，resultAssetId 指向另存的透明 PNG；AI provider 仍是 stub，不執行模型。Crop 只改 preview geometry，不破壞原始素材。

## Sample deck

|頁码|Intent|模式|
|---|---|---|
|01|Cover / 品牌氛圍|Single|
|02–03|Intro / 核心理念|Spread|
|04–05|Story / 品牌故事|Spread|
|06|Product / 主打產品|Single|
|07–08|Feature / 成分亮點|Spread|
|09|Information / 使用步驟|Single|
|10–11|Team / 品牌人物|Spread|
|12–13|Gallery / 影像故事|Spread，圖片跨中縫|
|14|Closing / 結語邀請|Single|

每個單位有 Editorial 與 Image-first variants。文案與 sample assets 放在 document，layout recipes 不包含品牌文案。
