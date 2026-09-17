import type { MasterDocument, Unit } from './schema';
export interface PageChoice { id: string; layoutId: string; variantId: string; sourceUnitId?: string }
/** A template instance owns its content. Repeated page types never share mutable slots. */
export function instantiateUnit(source: Unit, sourceDocument: MasterDocument, id: string) {
 const unit = structuredClone(source); unit.id = id;
 const assets: MasterDocument['assets'] = {};
 for (const content of Object.values(unit.slots)) if (content.type === 'image') {
  const original = content.assetId; const assetId = `${id}-${original}`;
  assets[assetId] = { ...sourceDocument.assets[original], id: assetId };
  content.assetId = assetId;
  const result = content.operations.backgroundRemove.resultAssetId;
  if (result && sourceDocument.assets[result]) {
   const resultId = `${id}-${result}`; assets[resultId] = {...sourceDocument.assets[result], id:resultId};
   content.operations.backgroundRemove.resultAssetId = resultId;
  }
 }
 return { unit, assets };
}
export function createProject(sample: MasterDocument, choices: PageChoice[], title: string, id: string): MasterDocument {
 if (!choices.length || choices.length > 200) throw new Error('請選擇 1–200 個頁面單位。');
 if (new Set(choices.map(c=>c.id)).size !== choices.length) throw new Error('頁面 ID 不可重複。');
 const doc: MasterDocument = {...structuredClone(sample),id,title:title.trim() || '未命名文件',units:[],assets:{}};
 for (const choice of choices) {
  const source = sample.units.find(u=>u.layoutId===choice.layoutId);
  if (!source) throw new Error('找不到此頁型的示範內容。');
  const {unit,assets} = instantiateUnit(source,sample,choice.id);
  unit.variantId=choice.variantId; doc.units.push(unit);Object.assign(doc.assets,assets);
 }
 return doc;
}

/** Rearrange a working document without replacing existing content with sample data. */
export function revisePagination(current:MasterDocument,choices:PageChoice[],sample:MasterDocument,title=current.title):MasterDocument {
 if(!choices.length||choices.length>200)throw new Error('請保留 1–200 個頁面單位。');
 if(new Set(choices.map(c=>c.id)).size!==choices.length)throw new Error('頁面 ID 不可重複。');
 const next={...structuredClone(current),title:title.trim()||'未命名文件',units:[] as Unit[]};
 for(const choice of choices){
  const source=current.units.find(u=>u.id===(choice.sourceUnitId||choice.id)&&u.layoutId===choice.layoutId);
  if(source){
   if(source.id===choice.id){const unit=structuredClone(source);unit.variantId=choice.variantId;next.units.push(unit);}
   else {const cloned=instantiateUnit(source,current,choice.id);cloned.unit.variantId=choice.variantId;next.units.push(cloned.unit);Object.assign(next.assets,cloned.assets);}
  }else{
   const fresh=createProject(sample,[choice],title,current.id);next.units.push(fresh.units[0]);Object.assign(next.assets,fresh.assets);
  }
 }
 return next;
}
