import type { StylePack } from '../core/schema';
export function resolveTypography(pack:StylePack, role:string) {
 const token = pack.tokens.typography[role] || pack.tokens.typography.body;
 return { ...token, fill:pack.tokens.colors[token.color] };
}
