/**
 * Genera data/mapa_h3_r1.json: las 842 celdas H3 de resolución 1 con su bioma,
 * su región, sus vecinas y su contorno (lat, lng).
 *
 * Tierra y océano: Natural Earth 1:50m (dominio público) vía el paquete world-atlas.
 * Biomas y regiones: APROXIMACIÓN por latitud, cajas de lon/lat y ciudades conocidas.
 * TODO: reemplazar biomas por WWF (Olson et al. 2001) y regiones por HydroBASINS nivel 2.
 */
import { getRes0Cells, cellToChildren, cellToLatLng, cellToBoundary, gridDisk } from 'h3-js';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';
import { readFileSync, writeFileSync } from 'node:fs';

const topo = JSON.parse(readFileSync('node_modules/world-atlas/land-50m.json', 'utf8'));
const land = feature(topo, topo.objects.land) as any;
const esTierra = (lat: number, lng: number) => geoContains(land, [lng, lat]);

// Hash determinista por celda (la geografía no cambia con la semilla de la partida).
function hash01(s: string, sal = 0): number {
  let h = 2166136261 ^ sal;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
const en = (lat: number, lng: number, la0: number, la1: number, lo0: number, lo1: number) =>
  lat >= la0 && lat <= la1 && lng >= lo0 && lng <= lo1;

const celdas = getRes0Cells().flatMap((c) => cellToChildren(c, 1));

// Fracción de tierra: centro + 6 vértices + 6 puntos intermedios.
function fraccionTierra(id: string): number {
  const [la, lo] = cellToLatLng(id);
  const b = cellToBoundary(id);
  const pts: [number, number][] = [[la, lo], ...b];
  for (const [vla, vlo] of b) {
    let dlo = vlo - lo; if (dlo > 180) dlo -= 360; if (dlo < -180) dlo += 360;
    pts.push([(la + vla) / 2, lo + dlo / 2]);
  }
  return pts.filter(([a, o]) => esTierra(a, o)).length / pts.length;
}

// Ciudades grandes (coordenadas aproximadas de cada área metropolitana).
const CIUDADES: [number, number][] = [
  [35.7, 139.7], [28.6, 77.2], [31.2, 121.5], [-23.5, -46.6], [19.4, -99.1], [30.0, 31.2], [19.1, 72.9],
  [39.9, 116.4], [23.8, 90.4], [34.7, 135.5], [40.7, -74.0], [24.9, 67.0], [-34.6, -58.4], [29.6, 106.5],
  [41.0, 29.0], [22.6, 88.4], [14.6, 121.0], [6.5, 3.4], [-22.9, -43.2], [23.1, 113.3], [34.1, -118.2],
  [55.8, 37.6], [-4.3, 15.3], [39.1, 117.2], [48.9, 2.4], [-12.0, -77.0], [51.5, -0.1], [13.8, 100.5],
  [4.7, -74.1], [35.7, 51.4], [-6.2, 106.8], [41.9, -87.6], [3.1, 101.7], [-33.9, 151.2], [52.5, 13.4],
  [40.4, -3.7], [43.7, -79.4], [33.3, 44.4], [24.7, 46.7], [-1.3, 36.8], [9.0, 38.7], [-26.2, 28.0],
  [37.6, 127.0], [21.0, 105.8], [10.8, 106.7], [45.5, 9.2], [33.7, -84.4], [29.8, -95.4], [-33.4, -70.6],
  [25.3, 55.3], [14.7, -17.4], [5.6, -0.2], [-37.8, 145.0], [10.5, -66.9], [52.2, 21.0], [33.6, 73.1],
];
const RIOS: [number, number][] = [
  [-3.1, -60.0], [-2.0, -55.0], [-1.5, -50.0], [0.3, 18.0], [-4.0, 16.0], [16.0, 32.5], [27.0, 31.0],
  [25.5, 85.0], [30.5, 112.0], [31.5, 118.0], [35.0, -90.0], [31.0, -91.5], [15.0, 105.5], [47.5, 20.0],
  [12.0, -4.0], [47.0, 133.0], [-31.0, -60.0], [60.0, 129.0], [65.0, 73.0],
];

function bioma(id: string, lat: number, lng: number): string {
  const r = hash01(id);
  const a = Math.abs(lat);
  if (lat < -60 || en(lat, lng, 59, 84, -73, -12) || lat > 70) return 'hielo'; // Antártida, Groenlandia, Ártico
  // Montañas
  if (en(lat, lng, 27, 38, 75, 100) || en(lat, lng, -35, 5, -78, -66) && r < 0.6 || en(lat, lng, 37, 55, -122, -108) ||
      en(lat, lng, 44, 48, 5, 15) || en(lat, lng, 6, 14, 36, 41)) return 'montaña';
  // Turberas
  if (en(lat, lng, 55, 68, 55, 90) && r < 0.7 || en(lat, lng, 48, 62, -100, -75) && r < 0.6 || en(lat, lng, -6, 6, 95, 120) && r < 0.7 ||
      en(lat, lng, -5, 3, 14, 24) || en(lat, lng, 52, 62, 20, 40) && r < 0.3) return 'turbera';
  // Desiertos
  if (en(lat, lng, 15, 32, -17, 35) || en(lat, lng, 14, 32, 35, 60) || en(lat, lng, 25, 35, 55, 72) ||
      en(lat, lng, 38, 48, 55, 68) || en(lat, lng, 38, 46, 90, 112) || en(lat, lng, -32, -19, 118, 145) ||
      en(lat, lng, -28, -18, 12, 25) || en(lat, lng, -28, -15, -72, -68) || en(lat, lng, 25, 37, -117, -104)) return 'desierto';
  // Estepas y praderas
  if (en(lat, lng, 45, 55, 30, 90) || en(lat, lng, 33, 52, -105, -96) || en(lat, lng, -50, -38, -72, -63) ||
      en(lat, lng, -6, 12, 30, 42)) return r < 0.25 ? 'cultivo' : 'pastizal';
  // Graneros (cultivo)
  if (en(lat, lng, 38, 48, -97, -82) || en(lat, lng, 20, 32, 72, 88) || en(lat, lng, 30, 40, 110, 120) ||
      en(lat, lng, 44, 54, -2, 30) && r < 0.6 || en(lat, lng, -35, -28, -64, -57)) return 'cultivo';
  if (a < 10) return r < 0.85 ? 'selva_tropical' : 'cultivo';
  if (a < 23) return r < 0.5 ? 'pastizal' : r < 0.75 ? 'selva_tropical' : 'cultivo';
  if (a < 35) return r < 0.6 ? 'bosque_subtropical' : r < 0.75 ? 'cultivo' : 'pastizal';
  if (a < 52) return r < 0.55 ? 'bosque_templado' : r < 0.8 ? 'cultivo' : 'pastizal';
  if (a < 70) return 'boreal';
  return 'hielo';
}

function region(lat: number, lng: number): string {
  if (lat < -60) return 'antartida';
  if (lng >= 110 && lat < -8 || lng >= 150 || lng < -150) return 'oceania';
  if (lng < -25) return lat > 15 ? 'norteamerica' : 'latinoamerica';
  if (lng < 60 && lat >= 36 && !(lng > 40 && lat < 42)) return 'europa';
  if (lng < 52 && lat < 36 && !(lng > 34 && lat > 12)) return 'africa';
  return 'asia';
}

const tierra = new Map<string, boolean>();
for (const id of celdas) tierra.set(id, fraccionTierra(id) >= 0.45);

const salida = celdas.map((id) => {
  const [lat, lng] = cellToLatLng(id);
  const vecinas = gridDisk(id, 1).filter((v) => v !== id);
  const esT = tierra.get(id)!;
  let b: string;
  if (!esT) b = vecinas.some((v) => tierra.get(v)) ? 'oceano_costero' : 'oceano';
  else {
    b = bioma(id, lat, lng);
    const costera = vecinas.some((v) => !tierra.get(v));
    if (costera && Math.abs(lat) < 30 && b !== 'desierto' && b !== 'montaña' && hash01(id, 7) < 0.6) b = 'costa';
  }
  return { id, lat: +lat.toFixed(3), lng: +lng.toFixed(3), bioma: b, region: region(lat, lng), vecinas,
    contorno: cellToBoundary(id).map(([a, o]) => [+a.toFixed(2), +o.toFixed(2)]) };
});

// Ciudades y ríos: la celda de tierra más cercana a cada punto.
function masCercana(lat: number, lng: number) {
  let mejor = salida[0], d = Infinity;
  for (const c of salida) {
    if (!tierra.get(c.id)) continue;
    const dd = (c.lat - lat) ** 2 + ((c.lng - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (dd < d) { d = dd; mejor = c; }
  }
  return mejor;
}
for (const [la, lo] of RIOS) masCercana(la, lo).bioma = 'rio';
for (const [la, lo] of CIUDADES) masCercana(la, lo).bioma = 'ciudad';

const conteo: Record<string, number> = {};
for (const c of salida) conteo[c.bioma] = (conteo[c.bioma] ?? 0) + 1;
console.log(salida.length, 'celdas', conteo);

writeFileSync('data/mapa_h3_r1.json', JSON.stringify({
  fuente: 'H3 resolución 1 (Uber, código abierto); tierra: Natural Earth 1:50m vía world-atlas. Biomas y regiones: aproximación propia (ver tools/preparar_mapa.ts), pendiente WWF y HydroBASINS.',
  celdas: salida,
}));
