import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const root=resolve('dist-static');const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer(async(req,res)=>{try{const relative=new URL(req.url,'http://localhost').pathname.replace(/^\/demo\//,'');const file=resolve(root,relative||'index.html');if(!file.startsWith(root+'/'))throw Error();const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();const requests=[];page.on('request',r=>{if(r.url().includes('/api/'))requests.push(r.url());});
try{await page.goto(`http://127.0.0.1:${server.address().port}/demo/index.html`);await page.getByRole('button',{name:'加入主打產品'}).click();await page.getByRole('button',{name:'開始放入圖文 ↗'}).click();await page.getByRole('button',{name:'編輯 hero',exact:true}).click();
 await expect(page.locator('.asset-preview img')).toHaveJSProperty('naturalWidth',1254);
 await page.locator('input[type=file]').last().setInputFiles('public/assets/nara-serum.png');await expect(page.getByLabel('素材名稱',{exact:true})).toHaveValue('nara-serum.png');
 await page.getByRole('button',{name:'◈ Instant Alpha · 背景色去背'}).click();await expect(page.getByLabel('去背預覽，點選背景顏色')).toHaveAttribute('width','1254');await page.getByLabel('去背預覽，點選背景顏色').click({position:{x:15,y:15}});await page.getByRole('button',{name:'套用透明 PNG（瀏覽器示範）'}).click();
 await page.getByText('瀏覽器示範 · 未上傳至網站',{exact:true}).waitFor();assert.deepEqual(requests,[]);console.log('Passed: static demo hosted in a subdirectory, images, local replacement, alpha, browser-only saving, zero backend requests.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
