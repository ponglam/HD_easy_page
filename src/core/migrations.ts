import type { MasterDocument } from './schema';
/** Upgrade only the original two-person placeholder; never split or replace user photos. */
export function migrateTeamPlaceholder(doc:MasterDocument):MasterDocument {
 for(const unit of doc.units){
  if(doc.stylePackId!=='soft-editorial'||unit.layoutId!=='team')continue;
  const hero=unit.slots.hero;
  if(hero?.type!=='image')continue;
  const asset=doc.assets[hero.assetId];
  if(!asset || asset.src!=='/assets/portrait.svg' || asset.kind!=='placeholder')continue;
  for(const [number,name] of [[1,'Mina'],[2,'Alex']] as const){
   const slot=number===1?'hero':'secondary';
   if(number===2&&unit.slots.secondary)continue;
   const id=`${unit.id}-individual-${number}`;
   doc.assets[id]={...asset,id,label:`${name} / portrait placeholder`,alt:`Individual portrait of ${name}`,src:`/assets/portrait-${number}.svg`,width:600,height:800};
   unit.slots[slot]={...structuredClone(hero),assetId:id};
  }
  for(const [id,text] of Object.entries({name1:'Mina Chen',role1:'Creative direction',name2:'Alex Lin',role2:'Product design'})){
   if(!unit.slots[id])unit.slots[id]={type:'text',text,effects:[]};
  }
 }
 return doc;
}
