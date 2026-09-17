import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve,extname,sep } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import { createStorageHandler } from './storage';
const root=resolve(import.meta.dirname,'../dist');const api=createStorageHandler();
const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||4173);
const user=process.env.EASYPAGE_DEMO_USER,password=process.env.EASYPAGE_DEMO_PASSWORD;
if(!['127.0.0.1','localhost','::1'].includes(host)&&(!user||!password))throw new Error('對外 demo 請設定 EASYPAGE_DEMO_USER 與 EASYPAGE_DEMO_PASSWORD。');
const types:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json'};
createServer(async(req,res)=>{
 if(user&&password){const expected=Buffer.from('Basic '+Buffer.from(`${user}:${password}`).toString('base64'));const actual=Buffer.from(req.headers.authorization||'');if(expected.length!==actual.length||!timingSafeEqual(expected,actual)){res.writeHead(401,{'WWW-Authenticate':'Basic realm="EasyPage demo"'});res.end('Demo login required');return;}}
 if(await api(req,res))return;
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
 try{const pathname=decodeURIComponent(new URL(req.url||'/','http://localhost').pathname);let file=resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}if(!extname(file))file=resolve(root,'index.html');const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(404);res.end('Not found');}
}).listen(port,host,()=>console.log(`EasyPage: http://${host}:${port}`));
