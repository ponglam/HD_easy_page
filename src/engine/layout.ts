import type { Asset, Effect, ImageOperations, MasterDocument, StylePack, Unit } from '../core/schema';
import { resolveEffects } from './effects';
import { imageGeometry, resolveProcessedAsset, type Box } from './image';
import { fitText, type TextMetrics } from './typography';
import { resolveTypography } from './style';
export interface SceneElement extends Box { id:string; type:'text'|'image'; effects:Effect[]; text?:TextMetrics; typography?:ReturnType<typeof resolveTypography>; asset?:Asset; imageBox?:Box; operations?:ImageOperations }
export interface Scene { width:number; height:number; paper:string; ink:string; line:string; kind:Unit['kind']; elements:SceneElement[]; warnings:string[]; label:string; footer:{ left:string; right:string } }
export function layoutUnit(doc:MasterDocument,unit:Unit,pack:StylePack):Scene {
 const width=doc.page.width*(unit.kind==='spread'?2:1),height=doc.page.height;
 const layout=pack.layouts.find(l=>l.id===unit.layoutId)!;
 const variant=layout.variants.find(v=>v.id===unit.variantId)!;
 const scene:Scene={width,height,paper:pack.tokens.colors.paper,ink:pack.tokens.colors.muted,line:pack.tokens.colors.line,kind:unit.kind,elements:[],warnings:[],label:unit.label,footer:{left:doc.title.toUpperCase(),right:unit.intent.toUpperCase()}};
 for (const region of variant.regions) {
  const active=region.slots.filter(id=>unit.slots[id]);
  if (!active.length) continue;
  let x=region.frame.x*width,w=region.frame.width*width;
  const y=region.frame.y*height,h=region.frame.height*height;
  if (unit.kind==='spread') {
   const safety=region.gutterSafe ? Math.max(layout.gutter.textSafety,layout.gutter.imageSafety)+layout.gutter.width/2 : 0;
   if (region.scope==='left') w=Math.min(w,width/2-safety-x);
   if (region.scope==='right') { const end=x+w; x=Math.max(x,width/2+safety);w=end-x; }
   if (region.scope==='spread' && x<width/2 && x+w>width/2) {
    if (!layout.gutter.allowImageCrossing || active.some(id=>unit.slots[id].type==='text')) scene.warnings.push('跨頁內容需要檢查中縫安全範圍。');
   }
  }
  const available=h-(region.flow==='stack'?region.gap*(active.length-1):0);
  const sum=active.reduce((total,id)=>total+(region.weights[id]||1),0);
  let cursor=y;
  for (const id of active) {
   const content=unit.slots[id],def=layout.slots.find(s=>s.id===id)!;
   const box={x,y:region.flow==='stack'?cursor:y,width:w,height:region.flow==='stack'?available*(region.weights[id]||1)/sum:h};
   const element:SceneElement={...box,id,type:content.type,effects:resolveEffects(def.defaultEffects,content.effects)};
   if (content.type==='text') {
    element.typography=resolveTypography(pack,def.style);
    const t=element.typography;
    element.text=fitText(content.text,w,box.height,t.size,t.minSize,t.leading,t.tracking);
    if (element.text.overflow) scene.warnings.push(`${def.label} 超出文字框，請縮短內容或切換版型。`);
   } else {
    element.asset=resolveProcessedAsset(doc,content.assetId,content.operations);
    element.operations=content.operations;
    element.imageBox=imageGeometry(element.asset,content.operations,box);
    if (content.operations.backgroundRemove.mode!=='none' && content.operations.backgroundRemove.status!=='ready') scene.warnings.push('去背設定已保存；M1 尚未連接處理服務。');
   }
   scene.elements.push(element);cursor+=box.height+region.gap;
  }
 }
 return scene;
}
