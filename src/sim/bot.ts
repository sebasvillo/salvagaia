// Jugadores automáticos para probar el balance (no se usan en la interfaz).
import { CELDAS, CELDA_POR_ID, P, SOL_POR_ID, compatible, sectorDe } from './datos';
import {
  aplicarPolitica, POLITICAS, calcularEmisiones, comerciar, construir, costoConstruir, costoMejorar, costoPolitica, demoler, esTrampa, mejorar,
  nivelesDe, nuevaPartida, solucionesDisponibles, type Estado,
} from './juego';
import { siguienteAnio } from './turno';
import { siguiente } from './rng';
import type { Dificultad } from './datos';

export type Estilo = 'bueno' | 'humano' | 'minmax' | 'diverso' | 'energia' | 'naturaleza' | 'sinpoliticas' | 'trampas' | 'nada';
export const ESTILOS: Estilo[] = ['bueno', 'humano', 'minmax', 'diverso', 'energia', 'naturaleza', 'sinpoliticas', 'trampas', 'nada'];

// Cómo juega cada estilo. "humano" imita a alguien que hace pocas jugadas por año y a veces cae en trampas.
const PERFIL: Record<string, { politicas: boolean; comercio: boolean; acciones: number; trampas: number; prod: number; vida: number; diversidad: number; mejorar: number }> = {
  bueno: { politicas: true, comercio: true, acciones: 40, trampas: 0, prod: 1, vida: 1, diversidad: 0, mejorar: 0.6 },
  humano: { politicas: true, comercio: false, acciones: 4, trampas: 0.15, prod: 1, vida: 1, diversidad: 0.3, mejorar: 0.8 },
  minmax: { politicas: false, comercio: true, acciones: 40, trampas: 0, prod: 0.5, vida: 0, diversidad: 0, mejorar: 0.3 },
  diverso: { politicas: true, comercio: true, acciones: 40, trampas: 0, prod: 1, vida: 1, diversidad: 2, mejorar: 1.2 },
  energia: { politicas: true, comercio: true, acciones: 40, trampas: 0, prod: 5, vida: 0.5, diversidad: 0, mejorar: 0.6 },
  naturaleza: { politicas: true, comercio: true, acciones: 40, trampas: 0, prod: 0.5, vida: 4, diversidad: 0, mejorar: 0.6 },
  sinpoliticas: { politicas: false, comercio: true, acciones: 40, trampas: 0, prod: 1, vida: 1, diversidad: 0, mejorar: 0.6 },
  trampas: { politicas: false, comercio: false, acciones: 40, trampas: 1, prod: 1, vida: 1, diversidad: 0, mejorar: 0.6 },
};

function regionMasPobre(e: Estado): Record<string, number> {
  const pob = P.poblacion_region as Record<string, number>;
  const inv: Record<string, number> = {};
  let t = 1;
  for (const [cid, b] of Object.entries(e.edificios)) { const r = CELDA_POR_ID.get(cid)!.region; inv[r] = (inv[r] ?? 0) + b.nivel; t += b.nivel; }
  const deficit: Record<string, number> = {};
  for (const r of Object.keys(pob)) if (r !== 'fuente') deficit[r] = pob[r] - (inv[r] ?? 0) / t;
  return deficit;
}

function jugarAnio(e: Estado, estilo: Estilo) {
  if (estilo === 'nada') return;
  const pf = PERFIL[estilo];
  // Demoler las trampas que ya se descubrieron (menos el que juega a puras trampas).
  if (estilo !== 'trampas') for (const [cid, x] of Object.entries(e.edificios)) if (e.reveladas.includes(x.sol)) demoler(e, cid);
  if (pf.politicas) {
    for (const id of POLITICAS) {
      const c = costoPolitica(e, id);
      if (c !== null && e.esperanza > c + (id === 'fin_subsidios' ? 15 : 35)) aplicarPolitica(e, id);
    }
  }
  // Comercio: si sobra energía y faltan materiales (o al revés), cambia.
  if (pf.comercio) {
    for (let i = 0; i < 40 && e.energia > e.materiales * 0.7 + 10; i++) if (comerciar(e, 'energia')) break;
    for (let i = 0; i < 40 && e.materiales > e.energia * 3.5 + 10; i++) if (comerciar(e, 'materiales')) break;
  }
  const porCat: Record<string, number> = {};
  for (const x of Object.values(e.edificios)) { const c = SOL_POR_ID.get(x.sol)!.categoria_juego; porCat[c] = (porCat[c] ?? 0) + x.nivel; }
  for (let paso = 0; paso < pf.acciones; paso++) {
    const em = calcularEmisiones(e);
    const deficit = regionMasPobre(e);
    let mejor: { valor: number; hacer: () => void } | null = null;
    for (const s of solucionesDisponibles(e)) {
      const trampa = esTrampa(s.id);
      if (trampa && pf.trampas === 0) continue;
      if (trampa && pf.trampas < 1 && siguiente(e) > pf.trampas) continue;
      const sec = sectorDe(s);
      const lleno = sec ? em.reduccion[sec] >= e.base[sec] * (1 - P.residuo_minimo_sector.valor) - 0.01 : false;
      const niveles = nivelesDe(e, s.id);
      const util = niveles < P.adopcion.niveles_saturacion && !lleno;
      let gan = util ? s.juego.potencial_gt_usado / P.adopcion.niveles_saturacion : 0;
      if (util) gan += (s.juego.produce.energia * 0.08 + s.juego.produce.materiales * 0.05) * pf.prod;
      if ((e.vida < 55 || pf.vida > 1) && niveles < 5) gan += s.juego.efecto_vida * 0.15 * pf.vida + (s.tipo === 'secuestrar' && pf.vida > 1 ? 0.2 : 0);
      if (pf.diversidad && util) gan *= 1 + pf.diversidad / (1 + (porCat[s.categoria_juego] ?? 0));
      if (e.esperanza < 45 && niveles < 5) gan += s.juego.efecto_comunidad * 0.15;
      if (estilo === 'trampas' && trampa) gan += 5;
      if (trampa && pf.trampas > 0 && pf.trampas < 1) gan += 0.3;
      if (gan <= 0) continue;
      // Mejorar uno existente
      for (const [cid, b] of Object.entries(e.edificios)) {
        if (b.sol !== s.id) continue;
        const c = costoMejorar(e, cid);
        if (!c || c.energia > e.energia || c.materiales > e.materiales) continue;
        const v = gan / (c.energia + c.materiales);
        if (!mejor || v > mejor.valor) mejor = { valor: v, hacer: () => mejorar(e, cid) };
      }
      // Construir en una celda libre, de preferencia en la región con más déficit
      const c = costoConstruir(e, s.id);
      if (c.energia > e.energia || c.materiales > e.materiales) continue;
      let celda: string | null = null, mejorDef = -Infinity;
      for (const x of CELDAS) {
        if (e.edificios[x.id] || !compatible(s, x.bioma)) continue;
        const df = (deficit[x.region] ?? -1) + (e.degradadas.includes(x.id) && s.tipo === 'secuestrar' ? 0.05 : 0);
        if (df > mejorDef) { mejorDef = df; celda = x.id; }
      }
      if (!celda) continue;
      const v = (gan / (c.energia + c.materiales)) * (niveles > 0 ? pf.mejorar : 1.05);
      const cc = celda;
      if (!mejor || v > mejor.valor) mejor = { valor: v, hacer: () => construir(e, cc, s.id) };
    }
    if (!mejor) break;
    mejor.hacer();
  }
}

export function simular(semilla: string, dificultad: Dificultad, estilo: Estilo, maxAnios = 200) {
  const e = nuevaPartida(semilla, dificultad);
  for (let i = 0; i < maxAnios && !e.fin; i++) { jugarAnio(e, estilo); siguienteAnio(e); }
  return e;
}

export { SOL_POR_ID };
