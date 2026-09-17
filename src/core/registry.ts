import { migrateTeamPlaceholder } from './migrations';
import { DocumentSchema, StylePackSchema, type MasterDocument, type StylePack } from './schema';
const sampleModules = import.meta.glob('../../samples/*.json', { eager: true, import: 'default' });
const modules = import.meta.glob('../../style-packs/*/pack.json', { eager: true, import: 'default' });
export const packs: StylePack[] = Object.values(modules).map(value => StylePackSchema.parse(value));
export const catalogPacks = ['soft-editorial-wide','modern-corporate','architectural'].map(id=>packs.find(p=>p.manifest.id===id)!).filter(p=>p?.manifest.catalog);
export const pack = packs.find(p => p.manifest.id === 'soft-editorial')!;
export function getPack(id:string):StylePack {
 const result=packs.find(p=>p.manifest.id===id && p.manifest.status==='ready');
 if(!result)throw new Error('風格尚未開放。');return result;
}
export function getSample(id:string):MasterDocument {
 const style=getPack(id);const data=sampleModules[`../../${style.manifest.sampleDocument}`];
 if(!data)throw new Error('找不到示範文件。');
 const clean=DocumentSchema.parse(data);
 for(const asset of Object.values(clean.assets)){
  if(!['generated','placeholder'].includes(asset.kind)||!/^\/assets\/[a-zA-Z0-9_.-]+$/.test(asset.src))throw new Error('Theme sample 不可包含使用者上傳素材。');
 }
 return clean;
}
export const sample = getSample(pack.manifest.id);
export function validateDocument(value: unknown): MasterDocument {
  const doc = migrateTeamPlaceholder(DocumentSchema.parse(value));
  const style = packs.find(p => p.manifest.id === doc.stylePackId && p.manifest.status === 'ready');
  if (!style || style.manifest.version !== doc.stylePackVersion) throw new Error('找不到相容的風格版本。');
  const ids = new Set<string>();
  for (const unit of doc.units) {
    if (ids.has(unit.id)) throw new Error('頁面 ID 重複。');
    ids.add(unit.id);
    const layout = style.layouts.find(l => l.id === unit.layoutId && l.intent === unit.intent && l.kind === unit.kind);
    if (!layout || !layout.variants.some(v => v.id === unit.variantId)) throw new Error('頁面使用了不相容的版型。');
    for (const definition of layout.slots) if (definition.required && !unit.slots[definition.id]) throw new Error(`缺少必要欄位：${definition.id}`);
    for (const [id, content] of Object.entries(unit.slots)) {
      const def = layout.slots.find(s => s.id === id);
      if (!def || def.type !== content.type) throw new Error(`欄位類型不相容：${id}`);
      if (content.type === 'image' && !doc.assets[content.assetId]) throw new Error('圖片素材不存在。');
    }
  }
  for (const [id, asset] of Object.entries(doc.assets)) {
    if (asset.id !== id) throw new Error('素材 ID 不一致。');
    if (!isSafeImageSource(asset.src)) throw new Error('圖片僅支援專案路徑、HTTPS 或內嵌點陣圖片。');
  }
  return doc;
}
export function isSafeImageSource(src: string) {
  return src === '' || /^\/(?!\/)/.test(src) || /^https:\/\//.test(src) || /^data:image\/(png|jpeg|webp);base64,/.test(src);
}
validateDocument(sample);
