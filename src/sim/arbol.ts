// El árbol de soluciones: ramas (sectores de Drawdown), familias (variantes por bioma) y prerrequisitos lógicos.
import arbolJson from '../../data/arbol.json';
import { SOL_POR_ID, solucionesIniciales } from './datos';

export interface Nodo { id: string; rama: string; requiere: string[]; miembros: string[]; familia: boolean }
export interface Rama { id: string; nombre_es: string; nombre_en: string; nodos: string[] }

const A = arbolJson as any;
export const FAMILIAS = A.familias as Record<string, { nombre_es: string; nombre_en: string; miembros: string[] }>;
export const NODOS = new Map<string, Nodo>();
export const RAMAS: Rama[] = [];
const NODO_DE = new Map<string, string>();

for (const r of A.ramas) {
  RAMAS.push({ id: r.id, nombre_es: r.nombre_es, nombre_en: r.nombre_en, nodos: r.nodos.map((n: any) => n.id) });
  for (const n of r.nodos) {
    const fam = FAMILIAS[n.id];
    const miembros = fam ? fam.miembros : [n.id];
    NODOS.set(n.id, { id: n.id, rama: r.id, requiere: n.requiere, miembros, familia: !!fam });
    for (const m of miembros) NODO_DE.set(m, n.id);
  }
}

export const nodoDe = (solId: string) => NODO_DE.get(solId)!;
export const ramaDe = (solId: string) => NODOS.get(nodoDe(solId))!.rama;

export function nombreNodo(id: string, idioma: 'es' | 'en'): string {
  const f = FAMILIAS[id];
  if (f) return idioma === 'es' ? f.nombre_es : f.nombre_en;
  const s = SOL_POR_ID.get(id)!;
  return idioma === 'es' ? s.nombre_es : s.nombre_en;
}

/** Nombre que se muestra para una solución: el de su familia si la tiene. */
export function nombreSolucion(solId: string, idioma: 'es' | 'en'): string {
  return nombreNodo(nodoDe(solId), idioma);
}

export function eraNodo(id: string): number {
  return Math.min(...NODOS.get(id)!.miembros.map((m) => SOL_POR_ID.get(m)!.juego.era));
}

export const nodoAbierto = (abiertas: Set<string>, id: string) => NODOS.get(id)!.miembros.every((m) => abiertas.has(m));

/** Los nodos con los que arranca la partida: las raíces del árbol (sin prerrequisitos) entre las soluciones iniciales. */
export function nodosIniciales(): string[] {
  const ini = new Set(solucionesIniciales().map((s) => nodoDe(s.id)));
  return [...ini].filter((id) => NODOS.get(id)!.requiere.length === 0);
}

export function expandir(nodos: string[]): string[] {
  return nodos.flatMap((n) => NODOS.get(n)!.miembros);
}

/** Nodos que ya se pueden desbloquear: cerrados, con todos sus prerrequisitos abiertos. */
export function listosParaAbrir(abiertas: Set<string>): string[] {
  return [...NODOS.values()].filter((n) => !nodoAbierto(abiertas, n.id) && n.requiere.every((r) => nodoAbierto(abiertas, r))).map((n) => n.id);
}
