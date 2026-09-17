import { instantiateUnit } from './projects';
import type { MasterDocument, SlotContent, StylePack } from './schema';
export type Action =
 | { type: 'slot'; unitId: string; slotId: string; content: SlotContent }
 | { type: 'restore-slot'; unitId: string; slotId: string }
 | { type: 'remove-slot'; unitId: string; slotId: string }
 | { type: 'variant'; unitId: string; variantId: string }
 | { type: 'add-unit'; layoutId: string; id: string; variantId?: string; afterId?: string }
 | { type: 'duplicate-unit'; unitId: string; id: string }
 | { type: 'remove-unit'; unitId: string }
 | { type: 'move-unit'; unitId: string; delta: number };
export function reduceDocument(doc: MasterDocument, action: Action, pack: StylePack, sample: MasterDocument): MasterDocument {
 const next = structuredClone(doc);
 if (action.type === 'add-unit') {
  const source = sample.units.find(u => u.layoutId === action.layoutId);
  if (!source) return doc;
  if (next.units.length >= 200 || next.units.some(u=>u.id===action.id)) return doc;
  const { unit, assets } = instantiateUnit(source,sample,action.id);
  const layout = pack.layouts.find(l=>l.id===action.layoutId)!;
  if(action.variantId && layout.variants.some(v=>v.id===action.variantId)) unit.variantId=action.variantId;
  Object.assign(next.assets,assets);
  const after = next.units.findIndex(u=>u.id===action.afterId);
  next.units.splice(after < 0 ? next.units.length : after+1,0,unit); return next;
 }
 const index = next.units.findIndex(u => u.id === action.unitId);
 if (index < 0) return doc;
 const unit = next.units[index]; const layout = pack.layouts.find(l => l.id === unit.layoutId)!;
 if (action.type === 'duplicate-unit') {
  if(next.units.length>=200 || next.units.some(u=>u.id===action.id)) return doc;
  const cloned=instantiateUnit(unit,next,action.id);Object.assign(next.assets,cloned.assets);next.units.splice(index+1,0,cloned.unit);
 } else if (action.type === 'variant') {
  if (layout.variants.some(v => v.id === action.variantId)) unit.variantId = action.variantId;
 } else if (action.type === 'restore-slot') {
  const original=sample.units.find(u=>u.layoutId===unit.layoutId)?.slots[action.slotId];
  if(original){
   const restored=structuredClone(original);
   if(restored.type==='image'){
    const id=`${unit.id}-${action.slotId}-sample`;next.assets[id]={...sample.assets[restored.assetId],id};restored.assetId=id;
   }
   unit.slots[action.slotId]=restored;
  }
 } else if (action.type === 'remove-slot') {
  const def = layout.slots.find(s => s.id === action.slotId);
  if (def?.removable && !def.required) delete unit.slots[action.slotId];
 } else if (action.type === 'slot') {
  const def = layout.slots.find(s => s.id === action.slotId);
  if (def?.type === action.content.type && (unit.slots[action.slotId] || def.addable)) unit.slots[action.slotId] = action.content;
 } else if (action.type === 'remove-unit') {
  if (next.units.length > 1) next.units.splice(index,1);
 } else if (action.type === 'move-unit') {
  const target = index + action.delta;
  if (target >= 0 && target < next.units.length) { next.units.splice(index,1); next.units.splice(target,0,unit); }
 }
 return next;
}
export function pageLabels(doc: MasterDocument) {
 let page = 1;
 return doc.units.map(u => { const start = page; page += u.kind === 'spread' ? 2 : 1; return start === page-1 ? `${start}`.padStart(2,'0') : `${start}`.padStart(2,'0')+'–'+`${page-1}`.padStart(2,'0'); });
}
