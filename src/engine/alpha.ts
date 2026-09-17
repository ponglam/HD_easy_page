/** Color-key alpha for the connected area touched by the user. Never mutates the source. */
export function removeConnectedColor(source:Uint8ClampedArray,width:number,height:number,seed:{x:number;y:number},threshold:number,feather:number){
 if(source.length!==width*height*4||width<1||height<1)throw new Error('Invalid pixel data');
 const x=Math.max(0,Math.min(width-1,Math.floor(seed.x))),y=Math.max(0,Math.min(height-1,Math.floor(seed.y)));
 const start=y*width+x,target=Array.from(source.slice(start*4,start*4+3));
 const output=new Uint8ClampedArray(source);const visited=new Uint8Array(width*height);const queue=new Uint32Array(width*height);let head=0,tail=1;queue[0]=start;visited[start]=1;
 const tolerance=Math.max(0,Math.min(1,threshold)),soft=Math.max(0,Math.min(1,feather));
 while(head<tail){const pixel=queue[head++],i=pixel*4;const distance=Math.hypot(source[i]-target[0],source[i+1]-target[1],source[i+2]-target[2])/(Math.sqrt(3)*255);
  if(distance>tolerance+soft)continue;
  const remaining=distance<=tolerance?0:soft?Math.min(1,(distance-tolerance)/soft):1;output[i+3]=Math.round(source[i+3]*remaining);
  const px=pixel%width,py=Math.floor(pixel/width);
  for(const next of [px>0?pixel-1:-1,px<width-1?pixel+1:-1,py>0?pixel-width:-1,py<height-1?pixel+width:-1])if(next>=0&&!visited[next]){visited[next]=1;queue[tail++]=next;}
 }
 return {pixels:output,color:'#'+target.map(c=>c.toString(16).padStart(2,'0')).join('')};
}
