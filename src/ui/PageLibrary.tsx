import { getSample } from '../core/registry';
import { useState } from 'react';
import type { StylePack } from '../core/schema';
import { layoutUnit } from '../engine/layout';
import { SvgPreview } from '../renderer/SvgPreview';
export function PageLibrary({pack,onAdd,disabled=false}:{pack:StylePack;onAdd:(layoutId:string,variantId:string)=>void;disabled?:boolean}) {
 const sample=getSample(pack.manifest.id);
 const [variants,setVariants]=useState<Record<string,string>>({});
 return <div className="template-library">{(['single','spread'] as const).map(kind=><section className="template-group" key={kind} aria-label={kind==='single'?'單頁頁型':'跨頁頁型'}>{pack.layouts.some(l=>l.kind===kind)&&<h3>{kind==='single'?'單頁頁型':'跨頁頁型 · 左右兩頁'}</h3>}<div className="template-group-grid">{pack.layouts.filter(l=>l.kind===kind).map(layout=>{
  const source=sample.units.find(u=>u.layoutId===layout.id);if(!source)return null;
  const variantId=variants[layout.id]||layout.variants[0].id;
  return <article className="template-card" key={layout.id}>
   <div className={`template-preview ${sample.page.height>sample.page.width?'portrait-preview':''}`}><SvgPreview scene={layoutUnit(sample,{...source,variantId},pack)} small/></div>
   <div className="template-card-heading"><strong>{layout.label}</strong><span className="badge">{layout.kind==='spread'?'跨頁 · 2 頁':'單頁'}</span></div>
   <select aria-label={`${layout.label}構圖`} value={variantId} onChange={e=>setVariants(v=>({...v,[layout.id]:e.target.value}))}>{layout.variants.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select>
   <button disabled={disabled} aria-label={`加入${layout.label}`} onClick={()=>onAdd(layout.id,variantId)}>＋ 加入這個頁型</button>
  </article>;
 })}</div></section>)}</div>;
}
