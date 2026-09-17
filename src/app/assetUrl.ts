export function assetUrl(src:string){return src.startsWith('/assets/')?import.meta.env.BASE_URL+src.slice(1):src;}
