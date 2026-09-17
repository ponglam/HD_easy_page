import {AlphaEditor} from './AlphaEditor';
import {assetUrl} from '../app/assetUrl';
import { browserOnly } from '../app/storage';
import type { Asset, Effect, MasterDocument, SlotContent, Unit, StylePack, ImageOperations } from '../core/schema';
import { isSafeImageSource } from '../core/registry';
import { setEffect } from '../engine/effects';
import { useState } from 'react';
export function Inspector({doc,unit,pack,sample,slotId,select,update,remove,variant,assetUpdate,applyAlpha,restore}:{doc:MasterDocument;unit:Unit;pack:StylePack;sample:MasterDocument;slotId:string|null;select:(id:string|null)=>void;update:(id:string,content:SlotContent)=>void;remove:(id:string)=>void;variant:(id:string)=>void;assetUpdate:(slotId:string,asset:Asset)=>void;applyAlpha:(slotId:string,asset:Asset,operation:ImageOperations['backgroundRemove'])=>void;restore:(slotId:string)=>void}) {
 const layout=pack.layouts.find(l=>l.id===unit.layoutId)!;
 const content=slotId?unit.slots[slotId]:undefined;const definition=layout.slots.find(s=>s.id===slotId);
 const [alphaOpen,setAlphaOpen]=useState(false);const [error,setError]=useState('');const [uploading,setUploading]=useState(false);
 const effect=(value:Effect)=>{if(content&&slotId)update(slotId,{...content,effects:setEffect(content.effects,value)});};
 async function upload(file?:File) {
  if(uploading||!file||!content||content.type!=='image'||!slotId)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10_000_000){setError('請選擇 10 MB 以下的 PNG、JPEG 或 WebP。');return;}
  setUploading(true);
  try{const src=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file);});
   const image=new Image();image.src=src;await image.decode();
   // Apply locally first; document autosave persists embedded image bytes when a server is available.
   const savedSrc=src;
   assetUpdate(slotId,{...doc.assets[content.assetId],src:savedSrc,label:file.name,alt:file.name,width:image.naturalWidth,height:image.naturalHeight,kind:'uploaded',credit:'User-provided image'});setError('');
  }catch(error){setError(error instanceof Error?error.message:'圖片上傳失敗。');}finally{setUploading(false);}
 }
 return <aside className="inspector">
  <div className="panel-heading"><span>{content?'編輯內容':'版面設定'}</span><span className="micro">INSPECTOR</span></div>
  <div className="inspector-scroll">
  {content&&slotId?<>
   <button className="back" onClick={()=>select(null)}>← 返回版面設定</button>
   <div className="section-title"><h3>{definition?.label}</h3><span className="badge">{definition?.required?'必要':'選用'}</span></div>
   {content.type==='text'?<label>文字內容<textarea aria-label="文字內容" rows={content.text.length>100?9:5} value={content.text} onChange={e=>update(slotId,{...content,text:e.target.value})}/><small>支援手動換行；文字框會自動調整字級。</small></label>:<fieldset disabled={uploading} className="image-fields">
    <div className="asset-preview" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void upload(e.dataTransfer.files[0]);}}><img src={assetUrl(doc.assets[content.assetId].src)} alt={doc.assets[content.assetId].alt}/><span>拖放圖片以替換</span></div>
    <label className="upload-button">{uploading?'正在讀取圖片…':'↑ 選擇圖片以替換'}<input disabled={uploading} type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const file=e.target.files?.[0];e.target.value='';void upload(file);}}/></label>
    <small>{browserOnly?'圖片保存在此瀏覽器；可下載 JSON 備份。':'選圖後立即替換，工作資料夾的儲存狀態顯示在畫布下方。'}</small>
    <button className="subtle" onClick={()=>restore(slotId)}>恢復範例圖片</button>
    <label>圖片素材<select aria-label="圖片素材" value={content.assetId} onChange={e=>update(slotId,{...content,assetId:e.target.value})}>{Object.values(doc.assets).map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select></label>
    <label>素材名稱<input value={doc.assets[content.assetId].label} onChange={e=>assetUpdate(slotId,{...doc.assets[content.assetId],label:e.target.value})}/></label>
    <label>替代文字<input value={doc.assets[content.assetId].alt} onChange={e=>assetUpdate(slotId,{...doc.assets[content.assetId],alt:e.target.value})}/></label>
    <label>圖片網址<input key={doc.assets[content.assetId].id} defaultValue={doc.assets[content.assetId].src.startsWith('data:')?'':doc.assets[content.assetId].src} placeholder="https://…" onBlur={e=>{const src=e.target.value.trim();if(!src)return;if(isSafeImageSource(src)){assetUpdate(slotId,{...doc.assets[content.assetId],src,kind:'external'});setError('');}else setError('請使用 HTTPS 圖片網址或專案內路徑。');}}/></label>
    <div className="field-pair">{(['width','height'] as const).map(key=><label key={key}>{key==='width'?'原圖寬度':'原圖高度'}<input type="number" min="1" value={doc.assets[content.assetId][key]} onChange={e=>{const value=Number(e.target.value);if(value>0)assetUpdate(slotId,{...doc.assets[content.assetId],[key]:value});}}/></label>)}</div>
    <label>構圖<select aria-label="構圖" value={content.operations.fit} onChange={e=>update(slotId,{...content,operations:{...content.operations,fit:e.target.value as 'cover'|'contain'}})}><option value="cover">填滿畫框</option><option value="contain">完整呈現</option></select></label>
    {(['x','y'] as const).map(axis=><label key={axis}>焦點 {axis.toUpperCase()} <output>{Math.round(content.operations.focal[axis]*100)}%</output><input aria-label={`焦點 ${axis.toUpperCase()}`} type="range" min="0" max="1" step=".01" value={content.operations.focal[axis]} onChange={e=>update(slotId,{...content,operations:{...content.operations,focal:{...content.operations.focal,[axis]:Number(e.target.value)}}})}/></label>)}
    <label>裁切範圍<select aria-label="裁切範圍" value={content.operations.crop.width===1?'full':'inset'} onChange={e=>update(slotId,{...content,operations:{...content.operations,crop:e.target.value==='full'?{x:0,y:0,width:1,height:1}:{x:.15,y:.15,width:.7,height:.7}}})}><option value="full">完整原圖</option><option value="inset">中央 70%</option></select></label>
    <button className="alpha-button" onClick={()=>setAlphaOpen(true)}>◈ Instant Alpha · 背景色去背</button>
    {content.operations.backgroundRemove.status==='ready'&&<><p className="note">已套用透明 PNG；原圖已保留。</p><button className="subtle" onClick={()=>update(slotId,{...content,operations:{...content.operations,backgroundRemove:{mode:'none',status:'idle'}}})}>還原原圖</button></>}
   </fieldset>}
   <details className="effects"><summary>視覺效果 <span>＋</span></summary>
    <label>透明度 <output>{Math.round((content.effects.find(e=>e.type==='opacity')?.value??1)*100)}%</output><input aria-label="透明度" type="range" min="0" max="1" step=".01" value={content.effects.find(e=>e.type==='opacity')?.value??1} onChange={e=>effect({type:'opacity',value:Number(e.target.value)})}/></label>
    <label>混合模式<select value={content.effects.find(e=>e.type==='blend')?.mode??'normal'} onChange={e=>effect({type:'blend',mode:e.target.value as 'normal'})}>{['normal','multiply','screen','overlay','soft-light'].map(mode=><option key={mode}>{mode}</option>)}</select></label>
    <label>模糊 <output>{content.effects.find(e=>e.type==='blur')?.radius??0}</output><input aria-label="模糊" type="range" min="0" max="20" value={content.effects.find(e=>e.type==='blur')?.radius??0} onChange={e=>effect({type:'blur',radius:Number(e.target.value)})}/></label>
    <label>染色<input type="color" value={content.effects.find(e=>e.type==='tint')?.color??'#9caa83'} onChange={e=>effect({type:'tint',color:e.target.value,amount:content.effects.find(e=>e.type==='tint')?.amount??.25})}/></label>
    <label>染色強度<input aria-label="染色強度" type="range" min="0" max="1" step=".01" value={content.effects.find(e=>e.type==='tint')?.amount??0} onChange={e=>effect({type:'tint',color:content.effects.find(e=>e.type==='tint')?.color??'#9caa83',amount:Number(e.target.value)})}/></label>
    <label className="check"><input type="checkbox" checked={content.effects.some(e=>e.type==='shadow')} onChange={e=>e.target.checked?effect({type:'shadow',dx:0,dy:12,blur:16,color:'#32352d',opacity:.25}):update(slotId,{...content,effects:content.effects.filter(e=>e.type!=='shadow')})}/>柔和陰影</label>
    <button className="subtle" onClick={()=>update(slotId,{...content,effects:[]})}>重設效果</button>
   </details>
   {definition?.removable&&!definition.required&&<button className="remove" onClick={()=>{remove(slotId);select(null);}}>移除此選用欄位</button>}
  </>:<>
   <div className="section-title"><h3>{unit.label}</h3><span className="badge">{unit.kind==='spread'?'跨頁':'單頁'}</span></div>
   <p className="description">{layout.description}</p>
   <label>切換構圖<select aria-label="切換構圖" value={unit.variantId} onChange={e=>variant(e.target.value)}>{layout.variants.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
   <h4>頁面內容 <span>{Object.keys(unit.slots).length}</span></h4>
   <div className="slot-list">{layout.slots.map(def=>unit.slots[def.id]?<button key={def.id} onClick={()=>select(def.id)}><span className="slot-icon">{def.type==='image'?'▧':'T'}</span><span>{def.label}<small>{def.required?'必要欄位':'選用欄位'}</small></span><span className="arrow">↗</span></button>:def.addable?<button key={def.id} className="add-slot" onClick={()=>{
    const original=sample.units.find(u=>u.layoutId===unit.layoutId)?.slots[def.id];
    const fallback:SlotContent=def.type==='text'?{type:'text',text:def.id==='quote'?'“A little less, a little more considered.”':'A considered detail, made for everyday.',effects:[]}:{type:'image',assetId:Object.keys(doc.assets)[0],operations:{fit:'cover',focal:{x:.5,y:.5},crop:{x:0,y:0,width:1,height:1},backgroundRemove:{mode:'none',status:'idle'}},effects:[]};
    update(def.id,original&&original.type==='text'?structuredClone(original):fallback);select(def.id);
   }}>＋ 新增{def.label}</button>:null)}</div>
   <div className="hint"><span>↖</span><p>點選畫布上的文字或圖片，即可編輯內容與調整效果。</p></div>
  </>}
  {error&&<p className="error" role="alert">{error}</p>}
  </div><div className="inspector-footer"><span className="dot"/> {pack.manifest.name} · v{pack.manifest.schemaVersion}</div>
 {alphaOpen&&content?.type==='image'&&slotId&&<AlphaEditor asset={doc.assets[content.assetId]} jobId={doc.id} onClose={()=>setAlphaOpen(false)} onApply={(asset,operation)=>applyAlpha(slotId,asset,operation)}/>}
 </aside>;
}
