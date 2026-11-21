// Un año completo de simulación (estilo BitLife): se aplica todo y se devuelve el resumen del año.
import { CELDAS, CELDA_POR_ID, P, SOL_POR_ID } from './datos';
import { calcularEmisiones, justicia, nivelesDe, rendimiento, type Estado, type EventoAnio, type ResumenDelAnio } from './juego';
import { siguiente } from './rng';

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

function actualizarAdopcion(e: Estado) {
  const { niveles_saturacion: sat, r, arranque } = P.adopcion;
  const ids = new Set([...Object.keys(e.adopcion), ...Object.values(e.edificios).map((b) => b.sol)]);
  for (const id of ids) {
    const meta = Math.min(1, nivelesDe(e, id) / sat);
    const a = e.adopcion[id] ?? 0;
    // Curva en S: arranca lento, se acelera y se satura. Si se demuele, cae rápido.
    const na = meta >= a ? a + r * (meta - a) * (arranque + a) : a + 0.5 * (meta - a);
    if (na < 0.001 && meta === 0) delete e.adopcion[id];
    else e.adopcion[id] = clamp(na, 0, 1);
  }
}

function nivelesPorEfecto(e: Estado, campo: 'efecto_vida' | 'efecto_comunidad'): number {
  let t = 0;
  for (const [cid, b] of Object.entries(e.edificios)) {
    const s = SOL_POR_ID.get(b.sol)!;
    let v = s.juego[campo] * b.nivel;
    if (campo === 'efecto_vida' && e.degradadas.includes(cid)) v *= s.tipo === 'proteger' ? 0.5 : 1.5;
    t += v;
  }
  return t;
}

function eventos(e: Estado, resumen: ResumenDelAnio, dv: (k: string, v: number) => void, de: (k: string, v: number) => void) {
  const ev = P.eventos;
  const calor = Math.max(0, e.temperatura - 1.2) * ev.calor_k;
  const adaptacion = new Set<string>(P.adaptacion_ids);
  for (const [tipo, t] of Object.entries(ev.tipos) as [string, any][]) {
    const prob = t.prob * ev.multiplicador[e.dificultad] * (t.sin_calor ? 1 : 1 + calor);
    if (siguiente(e) >= Math.min(0.95, prob)) continue;
    const candidatas = CELDAS.filter((c) => t.biomas.includes(c.bioma) && (!t.lat_max || Math.abs(c.lat) <= t.lat_max));
    if (!candidatas.length) continue;
    const centro = candidatas[Math.floor(siguiente(e) * candidatas.length)];
    const zona = [centro.id, ...centro.vecinas];
    const protegida = zona.some((z) => e.edificios[z] && adaptacion.has(e.edificios[z].sol));
    const evento: EventoAnio = { tipo, celda: centro.id, region: centro.region, danados: [] };
    for (const z of zona) {
      const b = e.edificios[z];
      if (!b) continue;
      // SUPUESTO: la Vida da resiliencia y los manglares o marismas cercanos amortiguan el golpe.
      const pDano = ev.dano_base * (1 - e.vida / 150) * (protegida ? ev.proteccion_adaptacion : 1);
      if (siguiente(e) < pDano) {
        evento.danados.push(z);
        if (b.nivel > 1) b.nivel--; else delete e.edificios[z];
      }
    }
    if (evento.danados.length) de('desastres', Math.max(-3, P.esperanza.por_edificio_danado * evento.danados.length)); // SUPUESTO: tope por evento
    if (tipo === 'incendio') dv('incendios', -0.5);
    resumen.eventos.push(evento);
  }
}

function revelarTrampas(e: Estado, resumen: ResumenDelAnio, dv: (k: string, v: number) => void, de: (k: string, v: number) => void) {
  for (const b of Object.values(e.edificios)) {
    if (b.revelaAnio !== undefined && b.revelaAnio <= e.anio && !e.reveladas.includes(b.sol)) {
      e.reveladas.push(b.sol);
      resumen.reveladas.push(b.sol);
      de('trampa_descubierta', P.trampas.esperanza_al_revelar);
    }
  }
  // Las trampas reveladas siguen costando Vida cada año mientras existan.
  let dano = 0;
  for (const b of Object.values(e.edificios)) {
    if (!e.reveladas.includes(b.sol)) continue;
    const s = SOL_POR_ID.get(b.sol)!;
    dano += (s.juego.efectos_ocultos.vida ?? 0) * P.trampas.vida_por_nivel_revelada * b.nivel;
  }
  dv('trampas', dano);
}

function inflexiones(e: Estado, resumen: ResumenDelAnio, dv: (k: string, v: number) => void) {
  const inf = P.inflexion;
  const dif = e.dificultad;
  if (!e.inflexiones.permafrost && e.temperatura >= inf.permafrost.umbral[dif]) {
    e.inflexiones.permafrost = true; resumen.inflexiones.push('permafrost');
  }
  if (!e.inflexiones.corales && e.temperatura >= inf.corales.umbral[dif]) {
    e.inflexiones.corales = true; resumen.inflexiones.push('corales'); dv('corales', inf.corales.vida);
  }
  if (!e.inflexiones.amazonia && (e.temperatura >= inf.amazonia.umbral[dif] || e.vida < inf.amazonia.vida_minima)) {
    e.inflexiones.amazonia = true; resumen.inflexiones.push('amazonia');
  }
}

export function siguienteAnio(e: Estado): ResumenDelAnio {
  if (e.fin) throw new Error('La partida terminó');
  const tAntes = e.temperatura;
  const resumen: ResumenDelAnio = {
    anio: e.anio, emisiones: 0, deltaEmisiones: 0, temperatura: 0, deltaTemperatura: 0, energia: 0, materiales: 0,
    vida: 0, esperanza: 0, eventos: [], reveladas: [], inflexiones: [], choqueAerosoles: false, desbloqueoEra2: false,
    dato: null, fin: null, desglose: { vida: [], esperanza: [] }, produccion: { energia: 0, materiales: 0 },
  };
  const dv = (k: string, v: number) => { if (Math.abs(v) >= 0.05) resumen.desglose.vida.push([k, v]); e.vida += v; };
  const de = (k: string, v: number) => { if (Math.abs(v) >= 0.05) resumen.desglose.esperanza.push([k, v]); e.esperanza += v; };

  // 1. La línea base de emisiones (la economía fósil) sigue su tendencia.
  const tend = P.tendencia_emisiones[e.dificultad] + e.tendenciaExtra;
  for (const k of Object.keys(e.base)) e.base[k] *= 1 + tend;

  // 2. Adopción en curva S y emisiones del año.
  actualizarAdopcion(e);
  const em = calcularEmisiones(e);

  // 3. Clima: TCRE para lo de vida larga, relajación para el metano, aerosoles como máscara.
  const co2 = em.neta - em.slcf;
  e.cumCo2 += co2;
  const tco2 = e.tCo2Base + (P.tcre[e.dificultad] * e.cumCo2) / 1000;
  e.tSlcf += (P.slcf.c_por_gt * em.slcf - e.tSlcf) / P.slcf.tau_anios;
  let nivAer = 0;
  for (const b of Object.values(e.edificios)) if (SOL_POR_ID.get(b.sol)!.categoria_juego === 'geoingenieria') nivAer += b.nivel;
  const aerMeta = nivAer * P.trampas.aerosol_enfriamiento_por_nivel;
  if (aerMeta < e.aerosol - 0.05) { resumen.choqueAerosoles = true; dv('choque', P.trampas.choque_vida); }
  e.aerosol = aerMeta;
  e.temperatura = tco2 + e.tSlcf - e.aerosol;

  // 4. Puntos de inflexión.
  inflexiones(e, resumen, dv);

  // 5. Recursos (con tope: lo que no se usa, se pierde).
  let pe = P.recursos.energia.base, pm = P.recursos.materiales.base;
  let prodE = 0, prodM = 0;
  for (const [cid, b] of Object.entries(e.edificios)) {
    const s = SOL_POR_ID.get(b.sol)!;
    const r = rendimiento(e, cid);
    prodE += s.juego.produce.energia * b.nivel + r.energia;
    prodM += s.juego.produce.materiales * b.nivel + r.materiales;
    if (s.id === 'deploy-direct-air-capture') prodE -= 4 * b.nivel; // SUPUESTO: la captura directa se come la energía
  }
  pe += prodE; pm += prodM;
  resumen.produccion = { energia: prodE, materiales: prodM };
  e.energia = clamp(e.energia + pe, 0, P.recursos.energia.tope);
  e.materiales = clamp(e.materiales + pm, 0, P.recursos.materiales.tope);

  // 6. Vida y Esperanza.
  const V = P.vida;
  const ganV = Math.min(V.tope_ganancia_anual, nivelesPorEfecto(e, 'efecto_vida') * V.k_efecto);
  dv('soluciones', ganV);
  dv('degradacion', -V.degradacion_anual * e.degradacionMult);
  dv('calor', -Math.max(0, e.temperatura - V.calor_umbral) * V.calor_k);
  const E = P.esperanza;
  const ganE = Math.min(E.tope_ganancia_anual, nivelesPorEfecto(e, 'efecto_comunidad') * E.k_efecto);
  de('soluciones', ganE);
  de('desanimo', -E.erosion_anual * Math.max(0, em.neta / P.emisiones_inicio_gt.valor)); // SUPUESTO: el desánimo baja con las emisiones
  de(em.neta < e.ultimaEmision ? 'emisiones_bajan' : 'emisiones_suben', em.neta < e.ultimaEmision - 0.05 ? E.si_bajan_emisiones : em.neta > e.ultimaEmision + 0.05 ? E.si_suben_emisiones : 0);
  if (e.temperatura < tAntes) de('temperatura_baja', E.si_baja_temperatura);
  if (Object.keys(e.edificios).length >= 6 && justicia(e) < E.injusticia_umbral) de('injusticia', -E.injusticia_castigo);

  // 7. Eventos de la Tierra y trampas que se revelan.
  eventos(e, resumen, dv, de);
  revelarTrampas(e, resumen, dv, de);
  e.vida = clamp(e.vida, 0, 100);
  e.esperanza = clamp(e.esperanza, 0, 100);

  // 8. Desbloqueo de la era 2.
  const niveles = Object.values(e.edificios).reduce((s, b) => s + b.nivel, 0);
  if (!e.era2 && (e.anio + 1 >= P.eras.era2_anio || niveles >= P.eras.era2_niveles)) { e.era2 = true; resumen.desbloqueoEra2 = true; }

  // 9. Victoria y derrota.
  const vic = P.victoria;
  e.tPico = Math.max(e.tPico, e.temperatura);
  const bajando = e.temperatura < tAntes && (!vic.requiere_emisiones_netas_negativas || em.neta < 0);
  e.racha = bajando ? e.racha + 1 : 0;
  if (e.racha >= vic.anios_bajando) e.fin = 'victoria';
  else if (e.vida <= 0) e.fin = 'derrota_vida';
  else if (e.esperanza <= 0) e.fin = 'derrota_esperanza';
  else if (e.temperatura >= P.derrota.temperatura_max) e.fin = 'derrota_calor';
  else if (e.anio + 1 >= P.anio_fin) e.fin = 'derrota_tiempo';

  // 10. Registro.
  const ids = Object.values(e.edificios).map((b) => b.sol);
  resumen.dato = ids.length ? ids[Math.floor(siguiente(e) * ids.length)] : null;
  Object.assign(resumen, {
    emisiones: em.neta, deltaEmisiones: em.neta - e.ultimaEmision, temperatura: e.temperatura,
    deltaTemperatura: e.temperatura - tAntes, energia: e.energia, materiales: e.materiales, vida: e.vida,
    esperanza: e.esperanza, fin: e.fin,
  });
  e.ultimaEmision = em.neta;
  if (!e.fin) e.anio++;
  e.historia.push({ anio: e.anio, emisiones: em.neta, temperatura: e.temperatura, vida: e.vida, esperanza: e.esperanza });
  return resumen;
}

export { CELDA_POR_ID };
