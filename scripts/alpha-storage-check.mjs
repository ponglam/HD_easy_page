import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1512,height:982}});page.setDefaultTimeout(15000);
try{
 await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:'加入主打產品'}).click();await page.getByLabel('文件名稱',{exact:true}).fill('Alpha storage verification');await page.getByRole('button',{name:'開始放入圖文 ↗'}).click();
 const dataUrl=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=200;c.height=200;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,200,200);x.fillStyle='#884433';x.fillRect(65,50,70,110);return c.toDataURL('image/png');});
 await page.getByRole('button',{name:'編輯 hero',exact:true}).click();
 await page.locator('input[type=file][accept="image/png,image/jpeg,image/webp"]').setInputFiles({name:'alpha-test.png',mimeType:'image/png',buffer:Buffer.from(dataUrl.split(',')[1],'base64')});
 await expect(page.getByLabel('素材名稱',{exact:true})).toHaveValue('alpha-test.png');
 await page.getByRole('button',{name:'◈ Instant Alpha · 背景色去背'}).click();
 const canvas=page.getByLabel('去背預覽，點選背景顏色');await expect(canvas).toHaveAttribute('width','200');await canvas.click({position:{x:5,y:5}});
 await page.getByLabel('去背容差').fill('0.1');await page.screenshot({path:'docs/screenshots/instant-alpha.png'});
 await page.getByRole('button',{name:'套用並保存透明 PNG'}).click();await page.getByText('已套用透明 PNG；原圖已保留。').waitFor();
 await page.getByRole('button',{name:'儲存文件',exact:true}).click();await page.getByText('已儲存至工作資料夾',{exact:true}).waitFor();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('easypage.document.v0.1'))?.units[0].slots.hero.operations.backgroundRemove.status==='ready');
 const document=await page.evaluate(()=>JSON.parse(localStorage.getItem('easypage.document.v0.1')));const slot=document.units[0].slots.hero,original=document.assets[slot.assetId],derived=document.assets[slot.operations.backgroundRemove.resultAssetId];
 assert.match(original.src,/^\/api\/jobs\//);assert.match(derived.src,/^\/api\/jobs\//);assert.notEqual(derived.src,original.src);
 const persisted=JSON.parse(await readFile(`user-jobs/${document.id}/document.json`,'utf8'));assert.equal(persisted.units[0].slots.hero.operations.backgroundRemove.status,'ready');
 const bytes=await readFile(`user-jobs/${document.id}/assets/${derived.src.split('/').pop()}`);assert(bytes.length>0);
 const alpha=await page.evaluate(async src=>{const image=new Image();image.src=src;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d');x.drawImage(image,0,0);return [x.getImageData(5,5,1,1).data[3],x.getImageData(100,100,1,1).data[3]];},derived.src);assert.deepEqual(alpha,[0,255]);
 await page.getByRole('button',{name:'還原原圖'}).click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('easypage.document.v0.1'))?.units[0].slots.hero.operations.backgroundRemove.mode==='none');
 console.log(`Passed: real upload, alpha preview, transparent PNG on disk, original retained, project saved, restore original. Job ${document.id}`);
}catch(e){await page.screenshot({path:'docs/screenshots/alpha-failure.png'});throw e;}finally{await browser.close();}
