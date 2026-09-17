import { saveJob,browserOnly } from './storage';
import { useEffect, useRef, useState } from 'react';
import { getPack, getSample, sample, validateDocument } from '../core/registry';
import { reduceDocument, type Action } from '../core/actions';
import type { MasterDocument } from '../core/schema';
const legacyKey='easypage.document.v0.1', libraryKey='easypage.projects.v0.1';
function load() {
 const documents:Record<string,MasterDocument>={};let activeId='';
 try {
  const saved=JSON.parse(localStorage.getItem(libraryKey)||'null');
  if(saved?.documents){for(const [id,value] of Object.entries(saved.documents)){try{const doc=validateDocument(value);if(doc.id===id)documents[id]=doc;}catch{/* Preserve other valid projects. */}}activeId=saved.activeId;}
  if(!Object.keys(documents).length){const legacy=localStorage.getItem(legacyKey);if(legacy){const doc=validateDocument(JSON.parse(legacy));documents[doc.id]=doc;activeId=doc.id;}}
 }catch{/* A first visit can start from the style library. */}
 return {documents,doc:documents[activeId]||Object.values(documents)[0]||structuredClone(sample),hasSaved:!!Object.keys(documents).length};
}
export function useEditor() {
 const [initial]=useState(load);
 const [doc,setDoc]=useState(initial.doc);const [documents,setDocuments]=useState(initial.documents);
 const [started,setStarted]=useState(initial.hasSaved);
 const [past,setPast]=useState<MasterDocument[]>([]);const [future,setFuture]=useState<MasterDocument[]>([]);
 const [saveStatus,setSaveStatus]=useState('已載入');
 const [diskStatus,setDiskStatus]=useState('');const current=useRef(doc);current.current=doc;
 const [unitId,setUnitId]=useState(doc.units[0].id);const [slotId,setSlotId]=useState<string|null>(null);
 const unit=doc.units.find(u=>u.id===unitId)||doc.units[0];
 const pack=getPack(doc.stylePackId), sampleDocument=getSample(doc.stylePackId);
 useEffect(()=>{if(!started)return;const timer=setTimeout(()=>{try{
  // Write the full shelf first; keep the previous single-document key for compatibility.
  localStorage.setItem(libraryKey,JSON.stringify({activeId:doc.id,documents:{...documents,[doc.id]:doc}}));
  localStorage.setItem(legacyKey,JSON.stringify(doc));setSaveStatus('已儲存至此瀏覽器');
 }catch{setSaveStatus('本機儲存空間不足，請下載 JSON');}},400);return()=>clearTimeout(timer);},[doc,documents,started]);
 async function saveNow(snapshot=current.current){
  setDiskStatus('正在儲存工作資料夾…');
  try{const saved=await saveJob(snapshot);
   if(current.current===snapshot){
    const changed=Object.keys(saved.assets).some(id=>saved.assets[id].src!==snapshot.assets[id]?.src);
    if(changed){current.current=saved;setDoc(saved);setDocuments(d=>({...d,[saved.id]:saved}));}
    setDiskStatus(browserOnly?'瀏覽器示範 · 未上傳至網站':'已儲存至工作資料夾');
   }
  }catch(error){setDiskStatus(`尚未儲存至工作資料夾：${error instanceof Error?error.message:'請重試'}`);}
 }
 useEffect(()=>{if(!started)return;const timer=setTimeout(()=>{void saveNow(doc);},700);return()=>clearTimeout(timer);},[doc,started]);
 function apply(next:MasterDocument){const previous=current.current;setDocuments(d=>({...d,...(started?{[previous.id]:previous}:{}),[next.id]:next}));current.current=next;setDoc(next);setStarted(true);setSaveStatus('儲存中…');}
 function commit(next:MasterDocument){const previous=current.current;setPast(p=>[...p.slice(-29),previous]);setFuture([]);apply(next);}
 function openProject(next:MasterDocument){if(started)void saveNow(current.current);setPast([]);setFuture([]);apply(next);setUnitId(next.units[0].id);setSlotId(null);}
 function updateAsset(unitId:string,slotId:string,asset:MasterDocument['assets'][string]){
  const next=structuredClone(current.current);const slot=next.units.find(u=>u.id===unitId)?.slots[slotId];if(slot?.type!=='image')return;
  const changed=next.assets[slot.assetId]?.src!==asset.src;const id=`${unitId}-${slotId}-asset`;next.assets[id]={...asset,id};slot.assetId=id;if(changed)slot.operations.backgroundRemove={mode:'none',status:'idle'};commit(next);
 }
 function applyAlpha(unitId:string,slotId:string,asset:MasterDocument['assets'][string],operation:import('../core/schema').ImageOperations['backgroundRemove']){
  const next=structuredClone(current.current);const slot=next.units.find(u=>u.id===unitId)?.slots[slotId];if(slot?.type!=='image')return;
  next.assets[asset.id]=asset;slot.operations.backgroundRemove=operation;commit(next);
 }
 function dispatch(action:Action){const latest=current.current;const next=reduceDocument(latest,action,getPack(latest.stylePackId),getSample(latest.stylePackId));if(next!==latest)commit(next);}
 function undo(){if(!past.length)return;const previous=current.current;setFuture(f=>[previous,...f]);apply(past[past.length-1]);setPast(p=>p.slice(0,-1));}
 function redo(){if(!future.length)return;const previous=current.current;setPast(p=>[...p,previous]);apply(future[0]);setFuture(f=>f.slice(1));}
 function selectUnit(id:string){setUnitId(id);setSlotId(null);}
 return {doc,unit,pack,sample:sampleDocument,documents,started,slotId,setSlotId,selectUnit,commit,openProject,updateAsset,applyAlpha,saveNow,diskStatus,dispatch,undo,redo,canUndo:!!past.length,canRedo:!!future.length,saveStatus};
}
