// Cargador tipado de los datos del juego. Ninguna cifra de soluciones vive en el código.
import solucionesJson from '../../data/soluciones.json';
import parametrosJson from '../../data/parametros.json';
import mapaJson from '../../data/mapa_h3_r1.json';

export type Dificultad = 'facil' | 'medio' | 'dificil';
export type Bioma =
  | 'selva_tropical' | 'bosque_subtropical' | 'bosque_templado' | 'boreal' | 'turbera' | 'pastizal'
  | 'desierto' | 'montaña' | 'cultivo' | 'ciudad' | 'rio' | 'costa' | 'oceano_costero' | 'oceano' | 'hielo';
export type Categoria =
  | 'movilidad' | 'edificios' | 'comida_y_tierra' | 'remocion_tecnologica' | 'energia' | 'geoingenieria'
  | 'naturaleza' | 'industria_y_residuos';

export interface Solucion {
  id: string;
  nombre_es: string;
  nombre_en: string;
  sector_drawdown: string;
  categoria_juego: Categoria;
  tipo: 'reducir' | 'proteger' | 'secuestrar';
  calificacion_drawdown: string;
  calificacion_drawdown_en: string;
  potencial_gt_min: number | null;
  potencial_gt_max: number | null;
  costo_usd_t: number | null;
  juego: {
    era: number;
    biomas: (Bioma | 'cualquiera')[];
    potencial_gt_usado: number;
    potencial_es_supuesto: boolean;
    costo: { energia: number; materiales: number };
    produce: { energia: number; materiales: number };
    efecto_vida: number;
    efecto_comunidad: number;
    es_trampa: boolean;
    efectos_ocultos: { vida?: number; comunidad?: number; lock_in_fosil?: number; riesgo?: string };
    niveles: number;
    adopcion: string;
    objeto_juego?: string;
  };
  fuente: string;
  ficha?: string;
  pdf?: string;
  emprendimientos?: string[];
}

export interface Celda {
  id: string;
  lat: number;
  lng: number;
  bioma: Bioma;
  region: string;
  vecinas: string[];
  contorno: [number, number][];
}

export const SOLUCIONES = solucionesJson as unknown as Solucion[];
export const P = parametrosJson as any;
export const CELDAS = (mapaJson as any).celdas as Celda[];
export const CELDA_POR_ID = new Map(CELDAS.map((c) => [c.id, c]));
export const SOL_POR_ID = new Map(SOLUCIONES.map((s) => [s.id, s]));

/** Las soluciones del MVP: era 1 sin trampas + extras + trampas elegidas + el resto de la era 2 (bloqueada al inicio). */
export function solucionesMvp(): { inicio: Solucion[]; era2: Solucion[] } {
  const extras = new Set<string>(P.soluciones_mvp.extras_inicio);
  const trampas = new Set<string>(P.soluciones_mvp.trampas);
  const inicio = SOLUCIONES.filter(
    (s) => (s.juego.era === 1 && !s.juego.es_trampa) || extras.has(s.id) || trampas.has(s.id),
  );
  const ids = new Set(inicio.map((s) => s.id));
  const era2 = SOLUCIONES.filter((s) => s.juego.era === 2 && !s.juego.es_trampa && !ids.has(s.id));
  return { inicio, era2 };
}

/** Sector del modelo de emisiones al que reduce una solución. */
export function sectorDe(s: Solucion): string | null {
  if (s.tipo === 'secuestrar') return null;
  if (s.categoria_juego === 'geoingenieria' || s.categoria_juego === 'remocion_tecnologica') return null;
  return s.categoria_juego;
}

// SUPUESTO: algunos biomas también aceptan las soluciones de sus vecinos ecológicos (las vegas de los ríos se cultivan, etc.).
const ALIAS: Partial<Record<Bioma, Bioma[]>> = {
  rio: ['cultivo'], 'montaña': ['pastizal', 'bosque_templado'], costa: ['pastizal'], turbera: [], desierto: [],
};

export function compatible(s: Solucion, b: Bioma): boolean {
  if (b === 'hielo') return false;
  const bs = s.juego.biomas;
  return bs.includes('cualquiera') || bs.includes(b) || (ALIAS[b] ?? []).some((x) => bs.includes(x));
}
