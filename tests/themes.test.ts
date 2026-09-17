import {describe,it,expect} from 'vitest';
import {catalogPacks,getSample,validateDocument,pack,sample} from '../src/core/registry';
import {layoutUnit} from '../src/engine/layout';
import {createProject,revisePagination} from '../src/core/projects';
import {reduceDocument} from '../src/core/actions';
describe('Theme demos and safe pagination',()=>{
 it('offers the specified sizes and single/spread collections',()=>{
  expect(catalogPacks).toHaveLength(3);
  const [beauty,corporate,architecture]=catalogPacks.map(p=>getSample(p.manifest.id));
  expect(beauty.page.width/beauty.page.height).toBeCloseTo(16/9,5);
  expect(corporate.page.width/corporate.page.height).toBeCloseTo(210/297,5);
  expect(architecture.page.width/architecture.page.height).toBeCloseTo(297/210,5);
  expect([...beauty.units,...corporate.units].every(u=>u.kind==='single')).toBe(true);
  expect(architecture.units.filter(u=>u.kind==='single')).toHaveLength(9);
  expect(architecture.units.filter(u=>u.kind==='spread')).toHaveLength(4);
 });
 it('validates and renders every demo variant within the page without overflow',()=>{
  for(const p of catalogPacks){const doc=getSample(p.manifest.id);expect(validateDocument(doc)).toEqual(doc);
   for(const unit of doc.units)for(const variant of p.layouts.find(l=>l.id===unit.layoutId)!.variants){
    const scene=layoutUnit(doc,{...unit,variantId:variant.id},p);
    expect(scene.warnings,`${p.manifest.id}/${unit.layoutId}/${variant.id}`).toEqual([]);
    for(const e of scene.elements){expect(e.x).toBeGreaterThanOrEqual(0);expect(e.y).toBeGreaterThanOrEqual(0);expect(e.x+e.width).toBeLessThanOrEqual(scene.width+.01);expect(e.y+e.height).toBeLessThanOrEqual(scene.height+.01);expect(e.height).toBeGreaterThan(0);}
   }
  }
 });
 it('keeps clean samples isolated from edits and new jobs',()=>{
  for(const p of catalogPacks){const original=getSample(p.manifest.id),edited=getSample(p.manifest.id);Object.values(edited.assets)[0].src='/api/jobs/test/upload.jpg';edited.units[0].slots.title={type:'text',text:'User edit',effects:[]};
   expect(getSample(p.manifest.id)).toEqual(original);
   const clean=createProject(getSample(p.manifest.id),[{id:'new',layoutId:original.units[0].layoutId,variantId:'editorial'}],'New','new');expect(Object.values(clean.assets).every(a=>a.src.startsWith('/assets/'))).toBe(true);
  }
 });
 it('reorders, duplicates edited pages and adds clean pages without changing the original',()=>{
  const doc=structuredClone(sample);doc.units[0].slots.title={type:'text',text:'Edited title',effects:[]};doc.assets.serum.src='/api/jobs/test/my-image.jpg';doc.assets.serum.kind='uploaded';const before=structuredClone(doc);
  const next=revisePagination(doc,[{id:doc.units[1].id,layoutId:'intro',variantId:'reverse'},{id:'copy',sourceUnitId:doc.units[0].id,layoutId:'cover',variantId:'editorial'},{id:'fresh',layoutId:'product',variantId:'editorial'}],sample);
  expect(doc).toEqual(before);expect(next.units[1].slots.title).toEqual(doc.units[0].slots.title);expect(next.units[0].slots).toEqual(doc.units[1].slots);expect(next.assets['copy-serum'].src).toBe(doc.assets.serum.src);expect(next.assets['fresh-serum'].src).toBe(sample.assets.serum.src);expect(validateDocument(next)).toEqual(next);
 });
 it('restores sample image while keeping the original upload available',()=>{
  const doc=structuredClone(sample);doc.assets.serum.src='/api/jobs/test/my-image.jpg';doc.assets.serum.kind='uploaded';
  const next=reduceDocument(doc,{type:'restore-slot',unitId:doc.units[0].id,slotId:'hero'},pack,sample);const hero=next.units[0].slots.hero;if(hero.type!=='image')throw Error();expect(next.assets[hero.assetId].src).toBe(sample.assets.serum.src);expect(next.assets.serum.src).toBe(doc.assets.serum.src);
 });
});
