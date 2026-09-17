import {assetUrl} from '../app/assetUrl';
import { useId } from 'react';
import type { Scene, SceneElement } from '../engine/layout';
function EffectFilter({element,id}:{element:SceneElement;id:string}) {
 const effects=element.effects.filter(e=>['blur','tint','shadow'].includes(e.type));
 if (!effects.length) return null;
 return <filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">{effects.map((effect,index)=>{
  if (effect.type==='blur') return <feGaussianBlur key={index} stdDeviation={effect.radius}/>;
  if (effect.type==='shadow') return <feDropShadow key={index} dx={effect.dx} dy={effect.dy} stdDeviation={effect.blur} floodColor={effect.color} floodOpacity={effect.opacity}/>;
  if (effect.type==='tint') {
   const rgb=[1,3,5].map(start=>parseInt(effect.color.slice(start,start+2),16)/255*effect.amount);const keep=1-effect.amount;
   return <feColorMatrix key={index} type="matrix" values={`${keep} 0 0 0 ${rgb[0]} 0 ${keep} 0 0 ${rgb[1]} 0 0 ${keep} 0 ${rgb[2]} 0 0 0 1 0`}/>;
  }return null;
 })}</filter>;
}
export function SvgPreview({scene,selected,onSelect,guides=false,small=false}:{scene:Scene;selected?:string|null;onSelect?:(id:string)=>void;guides?:boolean;small?:boolean}) {
 const prefix=useId().replace(/:/g,'');
 return <svg className="page-svg" viewBox={`0 0 ${scene.width} ${scene.height}`} role="img" aria-label={scene.label} xmlns="http://www.w3.org/2000/svg">
  <rect width={scene.width} height={scene.height} fill={scene.paper}/>
  {scene.elements.map(el=>{
   const id=`${prefix}-${el.id}`,opacity=el.effects.find(e=>e.type==='opacity'),blend=el.effects.find(e=>e.type==='blend');
   const filtered=el.effects.some(e=>['blur','shadow','tint'].includes(e.type));
   const b=el.imageBox,crop=el.operations?.crop;
   return <g key={el.id} role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} aria-label={onSelect?`編輯 ${el.id}`:undefined} onClick={()=>onSelect?.(el.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect?.(el.id);}}} style={{cursor:onSelect?'pointer':'default'}}>
    <defs><clipPath id={`${id}-frame`}><rect x={el.x} y={el.y} width={el.width} height={el.height}/></clipPath>
     {b&&crop&&<clipPath id={`${id}-crop`}><rect x={b.x+crop.x*b.width} y={b.y+crop.y*b.height} width={b.width*crop.width} height={b.height*crop.height}/></clipPath>}
     <EffectFilter element={el} id={`${id}-fx`}/></defs>
    <g opacity={opacity?.type==='opacity'?opacity.value:1} style={{mixBlendMode:blend?.type==='blend'?blend.mode:'normal'}} filter={filtered?`url(#${id}-fx)`:undefined}>
     <g clipPath={`url(#${id}-frame)`}>
      {el.type==='image'&&b?<><rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.operations?.backgroundRemove.status==='ready'?'transparent':'#deded2'}/><text opacity={el.operations?.backgroundRemove.status==='ready'?0:1} x={el.x+22} y={el.y+35} fontSize="16" fill="#737b69">{el.asset?.label}</text><g clipPath={`url(#${id}-crop)`}><image href={assetUrl(el.asset?.src||'')} {...b} preserveAspectRatio="none"><title>{el.asset?.alt}</title></image></g></>:<text x={el.x} y={el.y} fill={el.typography?.fill} fontFamily={el.typography?.family} fontSize={el.text?.fontSize} fontStyle={el.typography?.italic?'italic':'normal'} letterSpacing={el.typography?.tracking}>
       {el.text?.lines.map((line,index)=><tspan key={index} x={el.x} y={el.y+(el.text?.fontSize||0)+index*(el.text?.lineHeight||0)}>{line||' '}</tspan>)}
      </text>}
     </g>
    </g>
    {onSelect&&<rect x={el.x} y={el.y} width={el.width} height={el.height} fill="transparent" stroke={selected===el.id?'#71865d':'transparent'} strokeWidth="3" vectorEffect="non-scaling-stroke"/>}
   </g>;
  })}
  {!small&&<><line x1="60" x2={scene.width-60} y1={scene.height-34} y2={scene.height-34} stroke={scene.line}/><text x="60" y={scene.height-13} fontFamily="Arial" fontSize="13" letterSpacing="3" fill={scene.ink}>{scene.footer.left}</text><text x={scene.width-60} y={scene.height-13} textAnchor="end" fontFamily="Arial" fontSize="13" fill={scene.ink}>{scene.footer.right}</text></>}
  {guides&&scene.kind==='spread'&&<><rect x={scene.width/2-60} width="120" height={scene.height} fill="#b88f6320" pointerEvents="none"/><line x1={scene.width/2} x2={scene.width/2} y1="0" y2={scene.height} stroke="#987d58" strokeDasharray="10 8" strokeWidth="2" pointerEvents="none"/></>}
 </svg>;
}
