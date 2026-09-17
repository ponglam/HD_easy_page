import type { Effect } from '../core/schema';
// Overrides replace the same effect type, independently of layout changes.
export function resolveEffects(base: Effect[], overrides: Effect[]): Effect[] {
 const merged = new Map(base.map(e => [e.type,e]));
 overrides.forEach(e => merged.set(e.type,e));
 const order: Effect['type'][] = ['blur','tint','opacity','blend','shadow'];
 return order.flatMap(type => merged.has(type) ? [merged.get(type)!] : []);
}
export function setEffect(effects: Effect[], effect: Effect): Effect[] {
 return [...effects.filter(e => e.type !== effect.type),effect];
}
