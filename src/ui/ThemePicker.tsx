import {useState} from 'react';
import {catalogPacks as packs,getSample} from '../core/registry';
import {layoutUnit} from '../engine/layout';
import {SvgPreview} from '../renderer/SvgPreview';
import {Dialog} from './Dialog';
export function ThemePicker({onChoose,onClose}:{onChoose:(id:string)=>void;onClose?:()=>void}){
 const [selected,setSelected]=useState(packs.find(p=>p.manifest.status==='ready')!.manifest.id);
 return <Dialog label="選擇 Theme" onClose={onClose} wide><span className="micro">NEW JOB / STEP 01</span><h2>先選一個 Theme。</h2><p>Theme 決定整份文件的視覺語言。下一步，在頁序工作區自由組合它的頁型。</p><div className="theme-cards">{packs.map(pack=>{
  const available=pack.manifest.status==='ready',sample=available?getSample(pack.manifest.id):null;
  return <button className="theme-card" key={pack.manifest.id} aria-pressed={selected===pack.manifest.id} disabled={!available} onClick={()=>setSelected(pack.manifest.id)}>
   <div className="theme-cover">{sample?<SvgPreview scene={layoutUnit(sample,sample.units[0],pack)} small/>:<div className="theme-placeholder" style={{background:pack.tokens.colors.paper,color:pack.tokens.colors.ink}}><span style={{background:pack.tokens.colors.accent}}/>Aa</div>}</div>
   <strong>{pack.manifest.name}</strong><p>{pack.manifest.description}</p><div className="swatches">{Object.values(pack.tokens.colors).slice(0,4).map(c=><span key={c} style={{background:c}}/>)}</div><small>{available?`${pack.layouts.length} 種頁型 · 使用原始 sample`:'即將推出'}</small>
  </button>;
 })}</div><div className="theme-picker-footer"><p>新工作只會使用 Theme 的示範圖文。</p><button className="start-project" onClick={()=>onChoose(selected)}>使用此 Theme → 規劃頁序</button></div></Dialog>;
}
