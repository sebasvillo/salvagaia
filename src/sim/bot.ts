// Jugadores automáticos para probar el balance (no se usan en la interfaz).
import { CELDAS, CELDA_POR_ID, P, SOL_POR_ID, compatible, sectorDe } from './datos';
import {
  aplicarPolitica, POLITICAS, calcularEmisiones, comerciar, construir, costoConstruir, costoMejorar, costoPolitica, esTrampa, mejorar,
  nivelesDe, nuevaPartida, solucionesDisponibles, type Estado,
} from './juego';
import { siguienteAnio } from './turno';
import type { Dificultad } from './datos';

export type Estilo = 'bueno' | 'trampas' | 'nada';

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
  if (estilo === 'bueno') {
    for (const id of POLITICAS) {
      const c = costoPolitica(e, id);
      if (c !== null && e.esperanza > c + (id === 'fin_subsidios' ? 15 : 35)) aplicarPolitica(e, id);
    }
  }
  // Comercio: si sobra energía y faltan materiales (o al revés), cambia.
  if (estilo === 'bueno') {
    for (let i = 0; i < 40 && e.energia > e.materiales * 0.7 + 10; i++) if (comerciar(e, 'energia')) break;
    for (let i = 0; i < 40 && e.materiales > e.energia * 3.5 + 10; i++) if (comerciar(e, 'materiales')) break;
  }
  for (let paso = 0; paso < 40; paso++) {
    const em = calcularEmisiones(e);
    const deficit = regionMasPobre(e);
    let mejor: { valor: number; hacer: () => void } | null = null;
    for (const s of solucionesDisponibles(e)) {
      const trampa = esTrampa(s.id);
      if (estilo === 'bueno' && trampa) continue;
      const sec = sectorDe(s);
      const lleno = sec ? em.reduccion[sec] >= e.base[sec] * (1 - P.residuo_minimo_sector.valor) - 0.01 : false;
      const niveles = nivelesDe(e, s.id);
      const util = niveles < P.adopcion.niveles_saturacion && !lleno;
      let gan = util ? s.juego.potencial_gt_usado / P.adopcion.niveles_saturacion : 0;
      if (util) gan += s.juego.produce.energia * 0.08 + s.juego.produce.materiales * 0.05;
      if (e.vida < 55 && niveles < 5) gan += s.juego.efecto_vida * 0.15;
      if (e.esperanza < 45 && niveles < 5) gan += s.juego.efecto_comunidad * 0.15;
      if (estilo === 'trampas' && trampa) gan += 5;
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
      const v = (gan / (c.energia + c.materiales)) * (niveles > 0 ? 0.6 : 1.05);
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
