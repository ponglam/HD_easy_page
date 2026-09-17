export interface TextMetrics { lines: string[]; fontSize: number; lineHeight:number; overflow: boolean }
// Dependency-free estimate, deterministic in Node and browser. CJK glyphs use full em.
export function glyphWidth(character:string, size:number) {
 return size * (/\s/.test(character) ? .28 : /[MW@]/.test(character) ? .85 : /[il.,'!]/.test(character) ? .26 : character.codePointAt(0)! > 255 ? 1 : .56);
}
function wrap(text:string, width:number, size:number, tracking:number) {
 const result:string[]=[];
 for (const paragraph of text.split('\n')) {
  let line=''; let measured=0;
  const tokens=paragraph.match(/[\u3000-\uFFFF]|[^\s\u3000-\uFFFF]+|\s+/gu) || [''];
  for (const token of tokens) {
   const length=Array.from(token).reduce((n,c)=>n+glyphWidth(c,size)+tracking,0);
   if (measured+length>width && line.trim()) { result.push(line.trimEnd()); line=''; measured=0; }
   for (const c of Array.from(token)) {
    const advance=glyphWidth(c,size)+tracking;
    if (!line && /\s/.test(c)) continue;
    if (measured+advance>width && line) { result.push(line.trimEnd()); line=''; measured=0; }
    line+=c; measured+=advance;
   }
  }
  result.push(line.trimEnd());
 }
 return result;
}
export function fitText(text:string,width:number,height:number,size:number,minSize:number,leading:number,tracking:number):TextMetrics {
 let fontSize=size; let lines=wrap(text,width,fontSize,tracking);
 while ((lines.length*fontSize*leading>height) && fontSize>minSize) { fontSize=Math.max(minSize,fontSize-2); lines=wrap(text,width,fontSize,tracking); }
 return { lines, fontSize, lineHeight:fontSize*leading, overflow:lines.length*fontSize*leading>height };
}
