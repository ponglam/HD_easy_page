import { useEffect, useRef, type ReactNode } from 'react';
export function Dialog({label,onClose,children,wide=false}:{label:string;onClose?:()=>void;children:ReactNode;wide?:boolean}){
 const ref=useRef<HTMLElement>(null);const close=useRef(onClose);close.current=onClose;
 useEffect(()=>{
  const before=document.activeElement as HTMLElement|null;const root=ref.current;
  const focusable=()=>Array.from(root?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,a[href],[tabindex="0"]')||[]).filter(el=>el.getClientRects().length>0);
  focusable()[0]?.focus();
  function key(e:KeyboardEvent){if(e.key==='Escape'&&close.current){e.preventDefault();close.current();}if(e.key==='Tab'){const nodes=focusable(),first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}
  root?.addEventListener('keydown',key);return()=>{root?.removeEventListener('keydown',key);before?.focus();};
 },[]);
 return <div className="modal-backdrop" onClick={onClose}><section ref={ref} className={`modal ${wide?'composer-modal':''}`} role="dialog" aria-modal="true" aria-label={label} onClick={e=>e.stopPropagation()}>{onClose&&<button className="modal-close" aria-label="關閉" onClick={onClose}>×</button>}{children}</section></div>;
}
