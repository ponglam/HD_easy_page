import {useState} from 'react';
import {getPack,getSample} from '../core/registry';
import {createProject,revisePagination,type PageChoice} from '../core/projects';
import type {MasterDocument} from '../core/schema';
import {layoutUnit} from '../engine/layout';
import {SvgPreview} from '../renderer/SvgPreview';
import {PageLibrary} from './PageLibrary';
export function ProjectComposer({themeId,initial,onApply,onCancel}:{themeId:string;initial?:MasterDocument;onApply:(doc:MasterDocument)=>void;onCancel:()=>void}){
 const pack=getPack(themeId),sample=getSample(themeId);
 const [title,setTitle]=useState(initial?.title||'我的新文件');
 const [choices,setChoices]=useState<PageChoice[]>(()=>initial?.units.map(u=>({id:u.id,layoutId:u.layoutId,variantId:u.variantId}))||[]);
 const [dragged,setDragged]=useState<string|null>(null);
 const pages=choices.reduce((n,c)=>n+(pack.layouts.find(l=>l.id===c.layoutId)?.kind==='spread'?2:1),0);
 function move(index:number,delta:number){setChoices(current=>{const next=[...current],target=index+delta;if(target<0||target>=next.length)return current;const [item]=next.splice(index,1);next.splice(target,0,item);return next;});}
 function apply(draft=choices,name=title){onApply(initial?revisePagination(initial,draft,sample,name):createProject(sample,draft,name,crypto.randomUUID()));}
 let page=1;
 return <main className="pagination-workspace" aria-label="頁序規劃工作區">
  <header className="planner-toolbar"><div><span className="micro">{initial?'YOUR DOCUMENT / REVISE PAGINATION':'NEW JOB / STEP 02'}</span><h1>頁序規劃 <small>{pack.manifest.name}</small></h1><p>{initial?'自由加頁、調整順序與構圖。已編輯的圖文會保留。':'從乾淨的 sample 頁型開始，組成自己的文件。'}</p></div><div className="planner-controls"><button onClick={onCancel}>{initial?'取消變更':'取消新工作'}</button><button className="start-project" disabled={!choices.length} onClick={()=>apply()}>{initial?'套用頁序 → 返回編輯':'開始放入圖文 ↗'}</button></div></header>
  <div className="planner-columns"><section className="planner-library"><div className="planner-section-title"><h2>Theme 頁型庫</h2><span>原始 sample · 可重複加入</span></div><PageLibrary pack={pack} disabled={choices.length>=200} onAdd={(layoutId,variantId)=>setChoices(c=>[...c,{id:crypto.randomUUID(),layoutId,variantId}])}/></section>
   <aside className="planner-sequence"><div className="planner-section-title"><h2>我的頁序</h2><span aria-live="polite">{choices.length} 個單位 · {pages} 頁</span></div><label>文件名稱<input aria-label="文件名稱" value={title} onChange={e=>setTitle(e.target.value)}/></label>
    {!choices.length&&<div className="pagination-empty"><span>＋</span><strong>從左側加入頁型</strong><p>例如：封面 → 產品 → 產品 → 品牌故事 → 結語。開始編輯後，也能隨時回來調整。</p></div>}
    <ol className="sequence-cards">{choices.map((choice,index)=>{
     const layout=pack.layouts.find(l=>l.id===choice.layoutId)!;const start=page;page+=layout.kind==='spread'?2:1;
     const existing=initial?.units.find(u=>u.id===(choice.sourceUnitId||choice.id));const source=existing||sample.units.find(u=>u.layoutId===choice.layoutId)!;
     return <li key={choice.id} draggable onDragStart={()=>setDragged(choice.id)} onDragEnd={()=>setDragged(null)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();setChoices(c=>{const from=c.findIndex(v=>v.id===dragged),to=c.findIndex(v=>v.id===choice.id);if(from<0||from===to)return c;const next=[...c];const [item]=next.splice(from,1);next.splice(to,0,item);return next;});setDragged(null);}}>
      <div className="sequence-preview"><SvgPreview scene={layoutUnit(existing?initial!:sample,{...source,variantId:choice.variantId},pack)} small/></div>
      <div className="sequence-detail"><div className="sequence-label"><span>{start===page-1?start:`${start}–${page-1}`}</span><strong>{layout.label}</strong><small>{existing?'保留工作內容':'Sample'}</small></div>
      <select aria-label={`第 ${index+1} 個單位構圖`} value={choice.variantId} onChange={e=>setChoices(c=>c.map(v=>v.id===choice.id?{...v,variantId:e.target.value}:v))}>{layout.variants.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select>
      <div className="sequence-actions"><button aria-label={`往前移第 ${index+1} 個單位`} disabled={index===0} onClick={()=>move(index,-1)}>↑</button><button aria-label={`往後移第 ${index+1} 個單位`} disabled={index===choices.length-1} onClick={()=>move(index,1)}>↓</button><button aria-label={`重複第 ${index+1} 個單位`} disabled={choices.length>=200} onClick={()=>setChoices(c=>{const next=[...c];next.splice(index+1,0,{...choice,id:crypto.randomUUID(),sourceUnitId:existing?.id});return next;})}>⧉ 重複</button><button aria-label={`移除第 ${index+1} 個單位`} onClick={()=>setChoices(c=>c.filter(v=>v.id!==choice.id))}>× 移除</button></div></div>
     </li>;
    })}</ol>
    <p className="composer-note">拖曳或用箭頭調整順序。刪除只在套用後生效，回到編輯器可復原。</p>
    {!initial&&<button className="sample-shortcut" onClick={()=>apply(sample.units.map(u=>({id:crypto.randomUUID(),layoutId:u.layoutId,variantId:u.variantId})),sample.title)}>或開啟整份示範文件 →</button>}
   </aside>
  </div>
 </main>;
}
