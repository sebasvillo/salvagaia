// El estado de la partida y las acciones del jugador. TypeScript puro, sin DOM, determinista con semilla.
import { CELDAS, CELDA_POR_ID, P, SOLUCIONES, SOL_POR_ID, compatible, sectorDe, solucionesIniciales, type Dificultad, type Solucion } from './datos';
import { entre, semillaDeTexto, siguiente } from './rng';
import { expandir, nodosIniciales } from './arbol';
import ceibasJson from '../../data/ceibas.json';
const CEIBAS_IDS: string[] = (ceibasJson as any).ceibas.map((c: any) => c.id);

export const SECTORES = Object.keys(P.sectores).filter((k) => !k.startsWith('_'));

export interface Edificio {
  sol: string;
  nivel: number;
  anio: number;
  revelaAnio?: number;
}

export interface Punto {
  anio: number;
  emisiones: number;
  temperatura: number;
  vida: number;
  esperanza: number;
}

export type Fin = null | 'victoria' | 'derrota_vida' | 'derrota_esperanza' | 'derrota_calor' | 'derrota_tiempo';

export interface Estado {
  version: 1;
  semilla: string;
  dificultad: Dificultad;
  rng: number;
  anio: number;
  energia: number;
  materiales: number;
  vida: number;
  esperanza: number;
  temperatura: number;
  tCo2Base: number;
  tSlcf: number;
  aerosol: number;
  cumCo2: number;
  base: Record<string, number>;
  tendenciaExtra: number;
  degradacionMult: number;
  adopcion: Record<string, number>;
  edificios: Record<string, Edificio>;
  nivelesHistoricos: Record<string, number>;
  reveladas: string[];
  degradadas: string[];
  /** Ids de las soluciones ya desbloqueadas. */
  desbloqueadas: string[];
  /** Temperatura sin El Niño ni La Niña (la tendencia de fondo). */
  tBase: number;
  /** Parte de la temperatura que responde con inercia (sin aerosoles ni El Niño). */
  tInercia?: number;
  enso: { fase: 'nino' | 'nina' | 'neutro'; anios: number; anom: number };
  politicas: Record<string, number>;
  inflexiones: Record<string, boolean>;
  historia: Punto[];
  tPico: number;
  racha: number;
  ultimaEmision: number;
  fin: Fin;
  acciones: number;
  /** Qué vida de Ceiba acompaña este mundo. */
  ceiba?: string;
}

export interface EventoAnio {
  tipo: string;
  celda: string;
  region: string;
  danados: string[];
}

export interface ResumenDelAnio {
  anio: number;
  emisiones: number;
  deltaEmisiones: number;
  temperatura: number;
  deltaTemperatura: number;
  energia: number;
  materiales: number;
  vida: number;
  esperanza: number;
  eventos: EventoAnio[];
  reveladas: string[];
  inflexiones: string[];
  choqueAerosoles: boolean;
  /** Nodos del árbol (soluciones o familias) que se desbloquearon este año. */
  desbloqueadas: string[];
  enso: { fase: 'nino' | 'nina' | 'neutro'; anom: number };
  dato: string | null;
  fin: Fin;
  /** Por qué cambiaron la Vida y la Esperanza este año (para enseñar). */
  desglose: { vida: [string, number][]; esperanza: [string, number][] };
  /** Lo que produjeron tus edificios este año. */
  produccion: { energia: number; materiales: number };
}

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const d = (e: Estado) => e.dificultad;

export function nuevaPartida(semilla: string, dificultad: Dificultad): Estado {
  const e0 = P.emisiones_inicio_gt.valor as number;
  const base: Record<string, number> = {};
  for (const s of SECTORES) base[s] = e0 * P.sectores[s].participacion;
  const e: Estado = {
    version: 1, semilla, dificultad, rng: semillaDeTexto(semilla + dificultad), anio: P.anio_inicio,
    energia: P.recursos.energia.inicio, materiales: P.recursos.materiales.inicio,
    vida: P.vida.inicio[dificultad], esperanza: P.esperanza.inicio,
    temperatura: P.temperatura_inicio.valor, tCo2Base: 0, tSlcf: 0, aerosol: 0, cumCo2: 0,
    base, tendenciaExtra: 0, degradacionMult: 1, adopcion: {}, edificios: {}, nivelesHistoricos: {},
    reveladas: [], degradadas: [], desbloqueadas: expandir(nodosIniciales()), tBase: P.temperatura_inicio.valor, enso: { fase: 'neutro', anios: 1, anom: 0 }, politicas: {}, inflexiones: {}, historia: [],
    tPico: P.temperatura_inicio.valor, racha: 0, ultimaEmision: 0, fin: null, acciones: 0,
  };
  // La semilla perturba el estado inicial, no la geografía: qué celdas de tierra arrancan degradadas.
  for (const c of CELDAS) {
    if (c.bioma === 'oceano' || c.bioma === 'oceano_costero' || c.bioma === 'hielo' || c.bioma === 'ciudad') continue;
    if (siguiente(e) < 0.25) e.degradadas.push(c.id);
  }
  e.vida = clamp(e.vida + entre(e, -4, 4), 1, 100);
  if (P.ceibas_activas) e.ceiba = CEIBAS_IDS[entre(e, 0, CEIBAS_IDS.length - 1)];
  const em = calcularEmisiones(e);
  e.tSlcf = P.slcf.c_por_gt * em.slcf;
  e.tCo2Base = e.temperatura - e.tSlcf; // SUPUESTO: el resto del calentamiento inicial se atribuye al CO2 acumulado
  e.ultimaEmision = em.neta;
  e.historia.push({ anio: e.anio, emisiones: em.neta, temperatura: e.temperatura, vida: e.vida, esperanza: e.esperanza });
  return e;
}

// ---------- Consultas ----------

export function solucionesDisponibles(e: Estado): Solucion[] {
  migrar(e);
  const abiertas = new Set(e.desbloqueadas);
  return SOLUCIONES.filter((s) => abiertas.has(s.id));
}

/** Partidas guardadas con versiones anteriores. */
export function migrar(e: Estado) {
  if (!e.desbloqueadas) {
    const ini = expandir(nodosIniciales());
    const extra = (e as any).era2 ? SOLUCIONES.filter((s) => s.juego.era === 2 && !s.juego.es_trampa).map((s) => s.id) : [];
    e.desbloqueadas = [...new Set([...ini, ...extra])];
  }
  if (e.tBase === undefined) e.tBase = e.temperatura;
  if (!e.enso) e.enso = { fase: 'neutro', anios: 1, anom: 0 };
}

export function esTrampa(id: string) {
  return SOL_POR_ID.get(id)!.juego.es_trampa;
}

export function nivelesDe(e: Estado, sol: string): number {
  let n = 0;
  for (const b of Object.values(e.edificios)) if (b.sol === sol) n += b.nivel;
  return n;
}

export function lockIn(e: Estado): number {
  let n = 0;
  for (const b of Object.values(e.edificios)) n += (SOL_POR_ID.get(b.sol)!.juego.efectos_ocultos.lock_in_fosil ?? 0) * b.nivel;
  return n;
}

function multiplicadorCosto(e: Estado, s: Solucion): number {
  const esp = 1.3 - 0.6 * (e.esperanza / 100); // SUPUESTO: con Esperanza alta se construye más barato
  const aprendizaje = Math.pow(1 + (e.nivelesHistoricos[s.id] ?? 0), -P.aprendizaje_b.valor);
  const lock = s.categoria_juego === 'energia' && !s.juego.es_trampa ? 1 + P.trampas.lock_in_costo * lockIn(e) : 1;
  return esp * aprendizaje * lock;
}

export interface Costo { energia: number; materiales: number }

export function costoConstruir(e: Estado, solId: string): Costo {
  const s = SOL_POR_ID.get(solId)!;
  const m = multiplicadorCosto(e, s);
  return { energia: Math.max(1, Math.round(s.juego.costo.energia * m)), materiales: Math.max(1, Math.round(s.juego.costo.materiales * m)) };
}

export function costoMejorar(e: Estado, celdaId: string): Costo | null {
  const b = e.edificios[celdaId];
  if (!b) return null;
  const s = SOL_POR_ID.get(b.sol)!;
  if (b.nivel >= s.juego.niveles) return null;
  const m = multiplicadorCosto(e, s) * (b.nivel + 1) * P.costo_mejora_factor;
  return { energia: Math.max(1, Math.round(s.juego.costo.energia * m)), materiales: Math.max(1, Math.round(s.juego.costo.materiales * m)) };
}

const alcanza = (e: Estado, c: Costo) => e.energia >= c.energia && e.materiales >= c.materiales;

export function puedeConstruir(e: Estado, celdaId: string, solId: string): string | null {
  if (e.fin) return 'fin';
  const c = CELDA_POR_ID.get(celdaId);
  const s = SOL_POR_ID.get(solId);
  if (!c || !s) return 'no_existe';
  if (e.edificios[celdaId]) return 'ocupada';
  if (!solucionesDisponibles(e).some((x) => x.id === solId)) return 'bloqueada';
  if (!compatible(s, c.bioma)) return 'bioma';
  if (!alcanza(e, costoConstruir(e, solId))) return 'recursos';
  return null;
}

// ---------- Acciones ----------

export function construir(e: Estado, celdaId: string, solId: string): string | null {
  const err = puedeConstruir(e, celdaId, solId);
  if (err) return err;
  const c = costoConstruir(e, solId);
  e.energia -= c.energia; e.materiales -= c.materiales;
  const b: Edificio = { sol: solId, nivel: 1, anio: e.anio };
  if (esTrampa(solId)) b.revelaAnio = e.anio + entre(e, P.trampas.revelacion_min, P.trampas.revelacion_max);
  e.edificios[celdaId] = b;
  e.nivelesHistoricos[solId] = (e.nivelesHistoricos[solId] ?? 0) + 1;
  e.acciones++;
  return null;
}

export function mejorar(e: Estado, celdaId: string): string | null {
  if (e.fin) return 'fin';
  const c = costoMejorar(e, celdaId);
  if (!c) return 'maximo';
  if (!alcanza(e, c)) return 'recursos';
  const b = e.edificios[celdaId];
  e.energia -= c.energia; e.materiales -= c.materiales;
  b.nivel++;
  e.nivelesHistoricos[b.sol] = (e.nivelesHistoricos[b.sol] ?? 0) + 1;
  e.acciones++;
  return null;
}

/** Demoler: no devuelve recursos. Si eran aerosoles, se viene el choque de terminación el próximo año. */
export function demoler(e: Estado, celdaId: string): string | null {
  if (e.fin) return 'fin';
  if (!e.edificios[celdaId]) return 'vacia';
  delete e.edificios[celdaId];
  e.acciones++;
  return null;
}

export const POLITICAS = Object.keys(P.politicas).filter((k) => !k.startsWith('_'));

export function costoPolitica(e: Estado, id: string): number | null {
  const p = P.politicas[id];
  if (!p) return null;
  if ((e.politicas[id] ?? 0) >= p.veces) return null;
  return id === 'cerrar_carbon' ? p.esperanza + 3 * lockIn(e) : p.esperanza;
}

export function aplicarPolitica(e: Estado, id: string): string | null {
  if (e.fin) return 'fin';
  const costo = costoPolitica(e, id);
  if (costo === null) return 'agotada';
  if (e.esperanza - costo < 5) return 'esperanza';
  const p = P.politicas[id];
  e.esperanza -= costo;
  e.politicas[id] = (e.politicas[id] ?? 0) + 1;
  for (const [k, m] of Object.entries((p.multiplica ?? {}) as Record<string, number>)) e.base[k] *= m;
  if (p.tendencia) e.tendenciaExtra += p.tendencia;
  if (p.degradacion_mult) e.degradacionMult *= p.degradacion_mult;
  if (p.vida) e.vida = clamp(e.vida + p.vida, 0, 100);
  e.acciones++;
  return null;
}

/** Tasa de cambio: 3 de un recurso por 1 del otro. */
export function tasaComercio(_e?: Estado): number {
  return P.recursos.comercio.normal;
}

export function comerciar(e: Estado, de: 'energia' | 'materiales'): string | null {
  if (e.fin) return 'fin';
  const tasa = tasaComercio(e);
  const a = de === 'energia' ? 'materiales' : 'energia';
  if (e[de] < tasa) return 'recursos';
  if (e[a] >= P.recursos[a].tope) return 'tope';
  e[de] -= tasa; e[a] += 1;
  return null;
}

/** Rendimiento del terreno (Catan): nivel 1-2 da 1, 3-4 da 2, 5 da 3. */
export function rendimiento(e: Estado, celdaId: string): { energia: number; materiales: number } {
  const b = e.edificios[celdaId];
  const r = { energia: 0, materiales: 0 };
  if (!b) return r;
  const base = P.recursos.rendimiento_bioma[CELDA_POR_ID.get(celdaId)!.bioma] ?? {};
  const k = Math.floor((b.nivel + 1) / 2);
  r.energia = (base.energia ?? 0) * k; r.materiales = (base.materiales ?? 0) * k;
  return r;
}

/** Cuánto evita o captura hoy esta solución en tu mundo (Gt/año), según su adopción. */
export function aporteActual(e: Estado, solId: string): number {
  const s = SOL_POR_ID.get(solId)!;
  return (e.adopcion[solId] ?? 0) * s.juego.potencial_gt_usado * eficacia(e, s);
}

/** Adopción a la que tiende la solución con estos niveles construidos (0-1). */
export function adopcionMeta(e: Estado, solId: string, nivelesExtra = 0): number {
  return Math.min(1, (nivelesDe(e, solId) + nivelesExtra) / P.adopcion.niveles_saturacion);
}

/** Lo que produce un edificio al año (solución + terreno) con un nivel dado. */
export function produccionEdificio(celdaId: string, solId: string, nivel: number): { energia: number; materiales: number } {
  const s = SOL_POR_ID.get(solId)!;
  const base = P.recursos.rendimiento_bioma[CELDA_POR_ID.get(celdaId)!.bioma] ?? {};
  const k = Math.floor((nivel + 1) / 2);
  const dac = s.id === 'deploy-direct-air-capture' ? -4 * nivel : 0;
  return { energia: s.juego.produce.energia * nivel + (base.energia ?? 0) * k + dac, materiales: s.juego.produce.materiales * nivel + (base.materiales ?? 0) * k };
}

// ---------- El modelo de emisiones ----------

export interface Emisiones {
  porSector: Record<string, number>;
  reduccion: Record<string, number>;
  secuestro: number;
  retro: number;
  neta: number;
  slcf: number;
}

function eficacia(e: Estado, s: Solucion): number {
  return s.juego.es_trampa && e.reveladas.includes(s.id) ? P.trampas.eficacia_real : 1;
}

export function calcularEmisiones(e: Estado): Emisiones {
  const red: Record<string, number> = {};
  for (const k of SECTORES) red[k] = 0;
  let secuestro = 0;
  for (const [id, a] of Object.entries(e.adopcion)) {
    const s = SOL_POR_ID.get(id)!;
    if (s.categoria_juego === 'geoingenieria') continue; // los aerosoles no bajan emisiones
    const g = a * s.juego.potencial_gt_usado * eficacia(e, s);
    const sec = sectorDe(s);
    if (sec && sec in red) red[sec] += g;
    else secuestro += g * (s.categoria_juego === 'naturaleza' ? 0.5 + e.vida / 100 : 1);
  }
  const porSector: Record<string, number> = {};
  let bruta = 0, slcf = 0;
  for (const k of SECTORES) {
    const tope = e.base[k] * (1 - P.residuo_minimo_sector.valor);
    red[k] = Math.min(red[k], tope);
    porSector[k] = e.base[k] - red[k];
    bruta += porSector[k];
    slcf += porSector[k] * P.sectores[k].slcf;
  }
  let retro = P.sumideros.extra_max_gt * Math.max(0, (P.sumideros.vida_ref - e.vida) / P.sumideros.vida_ref);
  if (e.inflexiones.permafrost) retro += P.inflexion.permafrost.extra_gt;
  if (e.inflexiones.amazonia) retro += P.inflexion.amazonia.extra_gt;
  return { porSector, reduccion: red, secuestro, retro, neta: bruta - secuestro + retro, slcf };
}

// ---------- Indicadores para el puntaje ----------

/** Justicia: 1 − Gini (ponderado por población) de la inversión per cápita entre regiones. */
export function justicia(e: Estado): number {
  const pob = P.poblacion_region as Record<string, number>;
  const regiones = Object.keys(pob).filter((k) => k !== 'fuente');
  const inv: Record<string, number> = {};
  let total = 0;
  for (const [cid, b] of Object.entries(e.edificios)) {
    const r = CELDA_POR_ID.get(cid)!.region;
    if (!(r in pob)) continue;
    inv[r] = (inv[r] ?? 0) + b.nivel; total += b.nivel;
  }
  if (total === 0) return 1;
  const x = regiones.map((r) => ({ p: pob[r], v: (inv[r] ?? 0) / total / pob[r] }));
  const media = x.reduce((s, a) => s + a.p * a.v, 0);
  let g = 0;
  for (const a of x) for (const b of x) g += a.p * b.p * Math.abs(a.v - b.v);
  return clamp(1 - g / (2 * media), 0, 1);
}

/** Diversidad: índice de Shannon de los niveles por solución, normalizado entre 0 y 1. */
export function diversidad(e: Estado): number {
  const n: Record<string, number> = {};
  let t = 0;
  for (const b of Object.values(e.edificios)) { n[b.sol] = (n[b.sol] ?? 0) + b.nivel; t += b.nivel; }
  const k = Object.keys(n).length;
  if (t === 0 || k < 2) return 0;
  const h = -Object.values(n).reduce((s, v) => s + (v / t) * Math.log(v / t), 0);
  return h / Math.log(Math.max(k, 20)); // SUPUESTO: se normaliza contra al menos 20 soluciones
}

export function huella(e: Estado): string[] {
  const n: Record<string, number> = {};
  for (const b of Object.values(e.edificios)) n[b.sol] = (n[b.sol] ?? 0) + b.nivel;
  return Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
}

export interface Puntaje {
  rapidez: number; pico: number; vida: number; esperanza: number; justicia: number; diversidad: number;
  multiplicador: number; total: number;
}

export function puntaje(e: Estado): Puntaje {
  const gano = e.fin === 'victoria';
  const p = {
    rapidez: gano ? Math.max(0, P.anio_fin - e.anio) * 4 : 0,
    pico: Math.max(0, 3 - e.tPico) * 200,
    vida: e.vida * 2,
    esperanza: e.esperanza * 2,
    justicia: justicia(e) * 200,
    diversidad: diversidad(e) * 200,
    multiplicador: P.dificultad_puntaje[d(e)] * (gano ? 1 : 0.5),
    total: 0,
  };
  p.total = Math.round((p.rapidez + p.pico + p.vida + p.esperanza + p.justicia + p.diversidad) * p.multiplicador);
  return p;
}
