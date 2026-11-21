// La interfaz: portada con tus mundos, barra de arriba, cajón de soluciones, tarjetas del año, guía y tabla de mundos.
import './estilo.css';
import es from './i18n/es.json';
import en from './i18n/en.json';
import fichasJson from '../data/fichas.json';
import faunaJson from '../data/fauna.json';
import { CELDAS, CELDA_POR_ID, P, SOLUCIONES, SOL_POR_ID, compatible, type Dificultad, type Solucion } from './sim/datos';
import {
  POLITICAS, aplicarPolitica, calcularEmisiones, comerciar, construir, costoConstruir, costoMejorar, costoPolitica,
  demoler, huella, mejorar, nuevaPartida, puntaje, solucionesDisponibles, tasaComercio, type Estado, type ResumenDelAnio,
} from './sim/juego';
import { siguienteAnio } from './sim/turno';
import { Planeta, SPRITE_CATEGORIA } from './ui/planeta';
import { Guia } from './ui/guia';
import { ico, sprite } from './ui/sprites';
import { LINK_COMPARTIDO, scoreboard, type Registro } from './scoreboard';
import { borrarMundo, guardarMundo, listar, nombreAlAzar, nuevoId } from './mundos';

type Idioma = 'es' | 'en';
const TEXTOS: Record<Idioma, Record<string, string>> = { es, en };
const FICHAS = fichasJson as Record<string, any>;
const FAUNA = (faunaJson as any).animales as any[];
// Remoción actual por método (MtCO₂/año, 2025), The State of CDR 3.ª ed., capítulo 7.
const CDR_HOY: Record<string, number> = { 'use-biochar': 1.46, 'deploy-direct-air-capture': 0.0015, 'deploy-ocean-alkalinity-enhancement': 0.0035, 'deploy-enhanced-rock-weathering': 0.0038, 'deploy-ocean-biomass-sinking': 0 };

const guardado = {
  leer(k: string): string | null { try { return localStorage.getItem('salvagaia:' + k); } catch { return null; } },
  escribir(k: string, v: string) { try { localStorage.setItem('salvagaia:' + k, v); } catch { /* sin almacenamiento */ } },
};

let idioma: Idioma = (guardado.leer('idioma') as Idioma) || (navigator.language?.startsWith('es') ? 'es' : 'en');
function t(k: string, vars: Record<string, string | number> = {}): string {
  let s = TEXTOS[idioma][k] ?? TEXTOS.es[k] ?? k;
  for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, String(b));
  return s;
}
const nombre = (s: Solucion) => (idioma === 'es' ? s.nombre_es : s.nombre_en);
const fmt = (x: number, d = 1) => x.toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const icoSol = (s: Solucion, e?: Estado) => ico(e?.reveladas.includes(s.id) ? 'trampa' : SPRITE_CATEGORIA[s.categoria_juego] ?? 'trampa');

let estado: Estado | null = null;
let mundoId = '';
let mundoNombre = '';
let mensaje = '';
const planeta = new Planeta($('#planeta') as HTMLCanvasElement, () => estado);
const guia = new Guia(planeta, t, () => pintar());

function guardar() { if (estado && mundoId) guardarMundo(mundoId, mundoNombre, estado); }

function modal(html: string, alCerrar?: () => void) {
  guia.callar();
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="ficha">${html}</div>`;
  document.body.appendChild(m);
  const cerrar = () => { if (!m.isConnected) return; m.remove(); alCerrar?.(); };
  m.querySelectorAll<HTMLElement>('[data-cerrar]').forEach((b) => (b.onclick = cerrar));
  // Tocar por fuera de la tarjeta también la cierra.
  m.addEventListener('click', (ev) => { if (ev.target === m) cerrar(); });
  return m;
}

// ---------- Portada ----------
function portada() {
  planeta.portada = true;
  estado = null;
  const mundos = listar();
  const record = guardado.leer('record');
  $('#ui').innerHTML = `
    <div class="portada">
      <h1>${t('titulo')}</h1>
      <p class="lema">${t('subtitulo')}</p>
      ${mundos.length ? `<div class="ficha mundos">
        <label>${t('tus_mundos')}</label>
        ${mundos.map((m) => `<div class="mundo">
          <div><b>${esc(m.nombre)}</b><small>${t('mundo_fila', { anio: m.estado.anio, t: fmt(m.estado.temperatura, 2), d: t(m.estado.dificultad) })}${m.estado.fin ? ' · ' + t(m.estado.fin === 'victoria' ? 'mundo_fin_victoria' : 'mundo_terminado') : ''}</small></div>
          ${m.estado.fin ? '' : `<button class="prim" data-jugar="${m.id}">${t('jugar_mundo')}</button>`}
          <button class="link peligro" data-borrar="${m.id}" aria-label="${t('borrar')} ${esc(m.nombre)}">✕</button>
        </div>`).join('')}
      </div>` : ''}
      <div class="ficha">
        <label for="semilla">${t('semilla')}</label>
        <input id="semilla" value="${esc(nombreAlAzar())}" maxlength="24" autocomplete="off" spellcheck="false">
        <small>${t('semilla_ayuda')}</small>
        <label>${t('dificultad')}</label>
        <div class="seg" id="dif">
          ${(['facil', 'medio', 'dificil'] as const).map((d) => `<button data-d="${d}" class="${d === 'medio' ? 'on' : ''}">${t(d)}</button>`).join('')}
        </div>
      </div>
      <button class="prim" id="jugar">${t(mundos.length ? 'crear' : 'jugar')}</button>
      <div class="fila">
        <button class="link" id="como">${t('como')}</button>
        <button class="link" id="tabla">${t('tabla')}</button>
        <button class="link" id="idioma">${t('idioma')}</button>
      </div>
      ${record ? `<p class="record">${ico('estrella')} ${t('record', { n: record })}</p>` : ''}
    </div>`;
  let dif: Dificultad = 'medio';
  document.querySelectorAll<HTMLButtonElement>('#dif button').forEach((b) => (b.onclick = () => {
    dif = b.dataset.d as Dificultad;
    document.querySelectorAll('#dif button').forEach((x) => x.classList.toggle('on', x === b));
  }));
  $('#jugar').onclick = () => {
    mundoNombre = ($('#semilla') as HTMLInputElement).value.trim() || nombreAlAzar();
    mundoId = nuevoId();
    // El nombre del mundo es la semilla: el mismo nombre da el mismo planeta.
    estado = nuevaPartida(mundoNombre.toLowerCase(), dif);
    guardar(); juego(); guia.empezar();
  };
  document.querySelectorAll<HTMLButtonElement>('[data-jugar]').forEach((b) => (b.onclick = () => {
    const m = listar().find((x) => x.id === b.dataset.jugar);
    if (!m) return;
    mundoId = m.id; mundoNombre = m.nombre; estado = m.estado;
    juego(); guia.empezar();
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-borrar]').forEach((b) => (b.onclick = () => {
    const m = listar().find((x) => x.id === b.dataset.borrar);
    if (!m) return;
    const c = modal(`<p>${t('borrar_seguro', { n: esc(m.nombre) })}</p>
      <div class="fila"><button class="sec" data-cerrar>${t('no')}</button><button class="peligro" id="si">${t('si_borrar')}</button></div>`);
    c.querySelector<HTMLButtonElement>('#si')!.onclick = () => { borrarMundo(m.id); c.remove(); portada(); };
  }));
  $('#como').onclick = comoSeJuega;
  $('#tabla').onclick = () => tabla();
  $('#idioma').onclick = () => { idioma = idioma === 'es' ? 'en' : 'es'; guardado.escribir('idioma', idioma); document.documentElement.lang = idioma; portada(); };
}

function comoSeJuega() {
  const sec = (icono: string, k: string) => `<div class="como"><div>${ico(icono, 'ico g')}</div><div><b>${t('h_' + k)}</b><p>${t('h_' + k + '_txt')}</p></div></div>`;
  const color = (rgb: string, k: string) => `<li><span class="muestra" style="background:${rgb}"></span>${t('c_' + k)}</li>`;
  const m = modal(`<h2>${t('como')}</h2>
    ${sec('temperatura', 'meta')}${sec('emisiones', 'gt')}${sec('estrella', 'turno')}${sec('rayo', 'recursos')}
    ${sec('vida', 'vida')}${sec('esperanza', 'esp')}${sec('info', 'trampas')}${sec('candado', 'politicas')}${sec('naturaleza', 'drawdown')}
    <h3>${t('colores')}</h3>
    <ul class="leyenda-colores">
      ${color('rgb(210,108,74)', 'ciudad')}${color('rgb(62,128,74)', 'bosque')}${color('rgb(222,182,80)', 'cultivo')}
      ${color('rgb(228,196,138)', 'desierto')}${color('rgb(76,146,160)', 'mar')}${color('rgb(134,182,136)', 'costa')}
      ${color('rgb(246,240,226)', 'hielo')}${color('rgb(176,112,62)', 'seco')}
    </ul>
    ${estado ? `<button id="repetir">${t('repetir_guia')}</button>` : ''}
    <button class="prim" data-cerrar>${t('cerrar')}</button>`);
  const r = m.querySelector<HTMLButtonElement>('#repetir');
  if (r) r.onclick = () => { m.remove(); guia.empezar(true); };
}

async function tabla(resaltar?: string) {
  const m = modal(`<h2>${ico('estrella', 'ico g')} ${t('tabla')}</h2><div id="t-cuerpo"><p class="estado-board">${t('tabla_cargando')}</p></div>
    <button class="prim" data-cerrar>${t('cerrar')}</button>`);
  const sb = await scoreboard();
  const filas = await sb.top(20).catch(() => []);
  const cuerpo = m.querySelector('#t-cuerpo');
  if (!cuerpo) return;
  const nota = sb.tipo === 'compartido' ? t('tabla_compartida')
    : t('tabla_local') + (LINK_COMPARTIDO ? ' ' + t('tabla_link', { link: `<a href="${LINK_COMPARTIDO}" target="_blank" rel="noopener">claude.ai</a>` }) : '');
  cuerpo.innerHTML = `<p class="estado-board">${nota}</p>
    ${filas.length ? `<table class="tabla-pts">${filas.map((f, i) => `
      <tr class="${(sb.tipo === 'compartido' ? f.yo : f.fecha === resaltar) ? 'yo' : ''}">
        <td>${i + 1}</td>
        <td>${esc(f.apodo || '—')}<small>${t(f.dificultad)} · ${t('mundo', { s: esc(f.semilla) })} · ${f.fin === 'victoria' ? f.anio : t('fin_' + f.fin)}</small></td>
        <td>${f.puntaje}</td>
      </tr>`).join('')}</table>` : `<p>${t('tabla_vacia')}</p>`}`;
}

// ---------- El juego ----------
let ultimaAccion = Date.now();
function juego() {
  planeta.portada = false;
  ultimaAccion = Date.now();
  $('#ui').innerHTML = `
    <header id="hud"></header>
    <div id="tiras"></div>
    <section id="cajon"></section>
    <footer>
      <button id="btn-menu" aria-label="${t('tus_mundos')}">☰</button>
      <button id="btn-pol">${t('politicas')}</button>
      <button id="btn-glo" aria-label="${t('como')}">?</button>
      <button class="prim" id="btn-sig">${t('siguiente')} ▸</button>
    </footer>`;
  $('#btn-sig').onclick = pasarAnio;
  $('#btn-pol').onclick = politicas;
  $('#btn-glo').onclick = comoSeJuega;
  $('#btn-menu').onclick = () => { guardar(); guia.saltarSiTutorial(); portada(); };
  planeta.seleccion = null;
  planeta.onTocar = (id) => { mensaje = ''; ultimaAccion = Date.now(); pintar(); guia.tocar(id); };
  planeta.onAnimal = (id) => {
    const a = FAUNA.find((x) => x.id === id);
    if (!a) return;
    ultimaAccion = Date.now();
    guia.decir(`<b>${t('animal_titulo')} ${esc(a[idioma].nombre)}</b><br>${esc(a[idioma].dato)}<br><small>${t('fuente')}: ${esc(a.fuente.replace(' #por-verificar', ''))}</small>`);
  };
  pintar();
}

function barra(v: number) { return `<span class="barra"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></span>`; }

function pintar() {
  if (!estado || !document.getElementById('hud')) return;
  const e = estado;
  const em = calcularEmisiones(e);
  const prev = e.historia.length > 1 ? e.historia[e.historia.length - 2] : null;
  const dT = prev ? e.temperatura - prev.temperatura : 0;
  const dE = prev ? em.neta - prev.emisiones : 0;
  const flecha = (d: number, dec: number) => Math.abs(d) < Math.pow(10, -dec) / 2 ? '' : `<span class="delta ${d < 0 ? 'bueno' : 'malo'}">${d < 0 ? '▼' : '▲'}${fmt(Math.abs(d), dec)}</span>`;
  $('#hud').innerHTML = `
    <div class="sello"><small>${t('anio_corto')}</small>${e.anio}</div>
    <div class="grandes">
      <div class="med grande" id="m-temp" data-tip="temp">${ico('temperatura', 'ico g')}<div><span class="valor">${fmt(e.temperatura, 2)} °C</span>${flecha(dT, 2)}<small>${t('temperatura')}</small></div></div>
      <div class="med grande" id="m-emis" data-tip="emis">${ico('emisiones', 'ico g')}<div><span class="valor">${fmt(em.neta)} Gt</span>${flecha(dE, 1)}<small>${t('emisiones')}</small></div></div>
    </div>
    <div class="chicos">
      <div class="med" id="m-ener" data-tip="ener">${ico('rayo')} ${Math.round(e.energia)}</div>
      <div class="med" id="m-mat" data-tip="mat">${ico('materiales')} ${Math.round(e.materiales)}</div>
      <button class="med cambio" id="btn-cambio" aria-label="${t('comerciar')}">${ico('comercio')}</button>
      <div class="med vida ${e.vida < 30 ? 'bajo' : ''}" id="m-vida" data-tip="vida">${ico('vida')} ${barra(e.vida)}</div>
      <div class="med esp ${e.esperanza < 30 ? 'bajo' : ''}" id="m-esp" data-tip="esp">${ico('esperanza')} ${barra(e.esperanza)}</div>
    </div>`;
  document.querySelectorAll<HTMLElement>('.med[data-tip]').forEach((m) => (m.onclick = () => guia.explicar(m.dataset.tip!)));
  $('#btn-cambio').onclick = comercio;
  $('#tiras').innerHTML = `<span class="leyenda"><span class="lt">▬ ${t('temperatura')}</span><span class="le">▬ ${t('emisiones')}</span></span><canvas id="spark"></canvas>${e.racha > 0 ? `<span class="racha">${t('racha', { n: e.racha })}</span>` : ''}`;
  spark();
  cajon();
  guia.refrescar();
}

function spark() {
  const c = document.getElementById('spark') as HTMLCanvasElement | null;
  if (!c || !estado) return;
  const w = (c.width = c.clientWidth * 2), h = (c.height = 60);
  const ctx = c.getContext('2d')!;
  const hs = estado.historia;
  const n = Math.max(40, hs.length);
  const y = (v: number, min: number, max: number) => h - ((v - min) / (max - min)) * (h - 8) - 4;
  ctx.clearRect(0, 0, w, h);
  ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(37,33,28,.45)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, y(0, -10, 65)); ctx.lineTo(w, y(0, -10, 65)); ctx.stroke(); ctx.setLineDash([]);
  const linea = (f: (p: (typeof hs)[0]) => number, min: number, max: number, color: string) => {
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineJoin = 'miter'; ctx.beginPath();
    hs.forEach((p, i) => { const x = Math.round((i / (n - 1)) * w); const yy = Math.round(y(f(p), min, max)); i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); });
    ctx.stroke();
  };
  linea((p) => p.emisiones, -10, 65, '#2a8c80');
  linea((p) => p.temperatura, 1.0, 3.1, '#d9733e');
}

function costoTxt(c: { energia: number; materiales: number }) {
  const e = estado!;
  return `<span class="${e.energia >= c.energia ? '' : 'falta'}">${ico('rayo')}${c.energia}</span><span class="${e.materiales >= c.materiales ? '' : 'falta'}">${ico('materiales')}${c.materiales}</span>`;
}

function potencialDe(s: Solucion) { return s.potencial_gt_max ?? s.juego.potencial_gt_usado; }
function impacto(s: Solucion) {
  const g = potencialDe(s);
  return `<span class="imp">${t(s.tipo === 'secuestrar' ? 'captura' : 'evita', { g: fmt(g, g < 1 ? 2 : 1) })}</span>`;
}

function cajon() {
  const e = estado!;
  const caj = $('#cajon');
  const id = planeta.seleccion;
  if (!id) { caj.innerHTML = `<p class="vacio">${mensaje || t('toca_celda')}</p>`; return; }
  const c = CELDA_POR_ID.get(id)!;
  const mar = c.bioma === 'oceano' || c.bioma === 'oceano_costero';
  const cab = `<div class="cab"><b>${t('b_' + c.bioma)}</b>${mar ? '' : `<span>${t('r_' + c.region)}</span>`}${e.degradadas.includes(id) ? `<span class="etiqueta">${t('degradada')}</span>` : ''}</div>`;
  const msg = mensaje ? `<p class="msg">${mensaje}</p>` : '';
  const b = e.edificios[id];
  if (b) {
    const s = SOL_POR_ID.get(b.sol)!;
    const cm = costoMejorar(e, id);
    const rev = e.reveladas.includes(s.id);
    caj.innerHTML = `${cab}${msg}
      <div class="edif">
        ${ico(rev ? 'trampa' : SPRITE_CATEGORIA[s.categoria_juego], 'ico g')}
        <div><b>${esc(nombre(s))}</b> · ${t('nivel', { n: b.nivel })} <button class="info" data-info="${s.id}" aria-label="info">${ico('info')}</button><br>
          ${s.juego.objeto_juego && idioma === 'es' ? `<small><i>${esc(s.juego.objeto_juego)}</i></small><br>` : ''}
          ${impacto(s)}<br><small>${t('adopcion', { p: Math.round((e.adopcion[s.id] ?? 0) * 100) })}</small>
          ${rev ? `<div class="aviso-trampa"><b>${t('trampa_revelada')}.</b> ${esc(s.juego.efectos_ocultos.riesgo ?? '')}</div>` : ''}
        </div>
      </div>
      <div class="acc">
        ${cm ? `<button class="prim" id="mej">${t('mejorar', { n: b.nivel + 1 })} <span class="costo">${costoTxt(cm)}</span></button>` : `<button disabled>${t('nivel_max')}</button>`}
        <button class="peligro" id="dem">${t('demoler')}</button>
      </div>`;
    if (cm) $('#mej').onclick = () => { const r = mejorar(e, id); mensaje = r ? t('err_' + r) : ''; ultimaAccion = Date.now(); guardar(); pintar(); };
    $('#dem').onclick = () => { demoler(e, id); mensaje = ''; ultimaAccion = Date.now(); guardar(); pintar(); };
    caj.querySelector<HTMLButtonElement>('[data-info]')!.onclick = (ev) => { ev.stopPropagation(); info(s.id, id); };
    return;
  }
  const abiertas = new Set(e.desbloqueadas);
  const opciones = solucionesDisponibles(e).filter((s) => compatible(s, c.bioma));
  const cerradas = SOLUCIONES.filter((s) => !abiertas.has(s.id) && compatible(s, c.bioma));
  if (!opciones.length && !cerradas.length) { caj.innerHTML = `${cab}<p class="vacio">${t('nada_aqui')}</p>`; return; }
  // Primero lo que alcanza, después por impacto. Las trampas se ven igual que el resto: así enseñan.
  opciones.sort((a, b) => {
    const ca = costoConstruir(e, a.id), cb = costoConstruir(e, b.id);
    const oka = e.energia >= ca.energia && e.materiales >= ca.materiales, okb = e.energia >= cb.energia && e.materiales >= cb.materiales;
    return oka !== okb ? (oka ? -1 : 1) : potencialDe(b) - potencialDe(a);
  });
  caj.innerHTML = `${cab}${msg}<div class="lista">${opciones.map((s) => `
    <div class="sol" role="button" tabindex="0" data-s="${s.id}">
      <span class="fila-ico">${icoSol(s)}<button class="info" data-info="${s.id}" aria-label="info">${ico('info')}</button></span>
      <b>${esc(nombre(s))}</b>
      ${s.juego.objeto_juego && idioma === 'es' ? `<span class="obj">${esc(s.juego.objeto_juego)}</span>` : ''}
      ${impacto(s)}
      <span class="costo">${costoTxt(costoConstruir(e, s.id))}</span>
    </div>`).join('')}${cerradas.map((s) => `
    <div class="sol bloqueada" aria-disabled="true">
      <span class="fila-ico">${ico('candado')}<button class="info" data-info="${s.id}" aria-label="info">${ico('info')}</button></span>
      <b>${esc(nombre(s))}</b>
      <span class="obj">${t('bloqueada_txt')}</span>
    </div>`).join('')}</div>`;
  caj.querySelectorAll<HTMLElement>('.sol:not(.bloqueada)').forEach((el) => {
    const hacer = () => {
      const r = construir(e, id, el.dataset.s!);
      mensaje = r ? t('err_' + r) : '';
      ultimaAccion = Date.now();
      guardar(); pintar();
      if (!r) guia.construyo();
    };
    el.onclick = hacer;
    el.onkeydown = (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); hacer(); } };
  });
  caj.querySelectorAll<HTMLButtonElement>('[data-info]').forEach((btn) => (btn.onclick = (ev) => { ev.stopPropagation(); info(btn.dataset.info!, id); }));
}

/** La ficha de una solución, contada por Ceiba. No dice "trampa": muestra lo que dice la ciencia y el jugador decide. */
function info(solId: string, celdaId: string) {
  const s = SOL_POR_ID.get(solId)!;
  const f = FICHAS[solId];
  const e = estado!;
  const bioma = CELDA_POR_ID.get(celdaId)!.bioma;
  const frase = f?.frase ? esc(f.frase) : t('info_sin_ficha', { cat: t('cat_' + s.categoria_juego) });
  const dd: string[] = [];
  if (f?.impacto_actual_gt != null) dd.push(t('info_hoy', { g: fmt(f.impacto_actual_gt, 2) }));
  if (s.potencial_gt_min != null && s.potencial_gt_max != null) dd.push(t('info_alcanzable', { a: fmt(s.potencial_gt_min, 2), b: fmt(s.potencial_gt_max, 2) }));
  if (f?.pct_emisiones) dd.push(t('info_pct', { p: f.pct_emisiones }));
  if (f?.velocidad) dd.push(t('info_velocidad', { v: t('vel_' + f.velocidad) }));
  if (s.potencial_gt_max == null) dd.push(t('info_estimado', { g: fmt(s.juego.potencial_gt_usado, 2) }));
  if (solId in CDR_HOY) dd.push(t('info_cdr', { mt: fmt(CDR_HOY[solId], CDR_HOY[solId] < 0.1 ? 4 : 2) }));
  let preguntas = '';
  if (f?.preguntas) {
    preguntas = `<p>${t('info_preguntas')}</p><table class="preguntas">${Object.entries(f.preguntas as Record<string, string>)
      .map(([q, r]) => `<tr><td>${esc(q)}</td><td class="${(r === 'Sí') !== /riesgos/i.test(q) ? 'si' : 'no'}">${esc(idioma === 'en' ? (r === 'Sí' ? 'Yes' : r) : r)}</td></tr>`).join('')}</table>`;
  }
  const rend = (P.recursos.rendimiento_bioma as any)[bioma] ?? {};
  const juego = [
    `${t('info_costo')}: ${costoTxt(costoConstruir(e, solId))}`,
    (s.juego.produce.energia || s.juego.produce.materiales) ? `${t('info_produce')}: ${s.juego.produce.energia ? ico('rayo') + s.juego.produce.energia + ' ' : ''}${s.juego.produce.materiales ? ico('materiales') + s.juego.produce.materiales : ''}` : '',
    (rend.energia || rend.materiales) ? `${t('info_terreno', { b: t('b_' + bioma) })}: ${rend.energia ? ico('rayo') + rend.energia : ''}${rend.materiales ? ico('materiales') + rend.materiales : ''}` : '',
    s.juego.efecto_vida > 0 ? `${ico('vida')} ${t('info_vida')}` : '',
    s.juego.efecto_comunidad > 0 ? `${ico('esperanza')} ${t('info_esp')}` : '',
  ].filter(Boolean);
  const emp = s.emprendimientos?.filter((x) => !x.startsWith('(') && !x.includes('por-verificar')).slice(0, 3);
  modal(`<div class="ceiba-cab"><img class="retrato-chico" src="${sprite('ceiba')}" alt=""><div><small>${t('info_titulo')}</small><h2>${esc(nombre(s))}</h2></div></div>
    <p class="frase">${frase}</p>
    <h3>${t('info_drawdown')}</h3>
    ${dd.length ? `<ul class="puntos">${dd.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
    ${preguntas}
    ${emp?.length ? `<p>${t('dato_emp', { lista: esc(emp.join(', ')) })}</p>` : ''}
    ${f?.url ? `<p><a href="${esc(f.url)}" target="_blank" rel="noopener">${t('info_link')} ↗</a></p>` : ''}
    <h3>${t('info_juego')}</h3>
    <ul class="puntos">${juego.map((x) => `<li>${x}</li>`).join('')}</ul>
    <button class="prim" data-cerrar>${t('cerrar')}</button>`);
}

function comercio() {
  const e = estado!;
  const tasa = tasaComercio(e);
  const m = modal(`<h2>${ico('comercio', 'ico g')} ${t('comerciar')}</h2>
    <p>${t('comerciar_txt', { n: tasa })}</p>
    <p class="nums"><span>${ico('rayo')} <b id="c-e">${Math.round(e.energia)}</b></span><span>${ico('materiales')} <b id="c-m">${Math.round(e.materiales)}</b></span></p>
    <button id="c1" style="width:100%">${t('dar_energia', { n: tasa })}</button>
    <button id="c2" style="width:100%;margin-top:8px">${t('dar_materiales', { n: tasa })}</button>
    <p id="c-msg" class="msg"></p>
    <button class="prim" data-cerrar>${t('cerrar')}</button>`, pintar);
  const hacer = (de: 'energia' | 'materiales') => {
    const r = comerciar(e, de);
    (m.querySelector('#c-msg') as HTMLElement).textContent = r ? t('err_' + r) : '';
    (m.querySelector('#c-e') as HTMLElement).textContent = String(Math.round(e.energia));
    (m.querySelector('#c-m') as HTMLElement).textContent = String(Math.round(e.materiales));
    ultimaAccion = Date.now(); guardar();
  };
  m.querySelector<HTMLButtonElement>('#c1')!.onclick = () => hacer('energia');
  m.querySelector<HTMLButtonElement>('#c2')!.onclick = () => hacer('materiales');
}

function politicas() {
  const e = estado!;
  const html = `<h2>${t('politicas')}</h2><p>${t('politicas_ayuda')} ${ico('esperanza')} ${Math.round(e.esperanza)}</p>
    ${POLITICAS.map((id) => {
      const c = costoPolitica(e, id);
      const usadas = e.politicas[id] ?? 0, veces = P.politicas[id].veces;
      return `<div class="pol"><div><b>${t('pol_' + id)}</b> ${veces > 1 ? `(${usadas}/${veces})` : ''}<br><small>${t('pol_' + id + '_txt')}</small></div>
        ${c === null ? `<button disabled>${t('agotada')}</button>` : `<button data-p="${id}" ${e.esperanza - c < 5 ? 'disabled' : ''}>${ico('esperanza')} ${c}</button>`}</div>`;
    }).join('')}
    <button class="sec" data-cerrar>${t('cerrar')}</button>`;
  const m = modal(html, pintar);
  m.querySelectorAll<HTMLButtonElement>('[data-p]').forEach((b) => (b.onclick = () => {
    aplicarPolitica(e, b.dataset.p!); ultimaAccion = Date.now(); guardar(); m.remove(); pintar(); politicas();
  }));
}

function pasarAnio() {
  if (!estado || estado.fin || document.querySelector('.modal')) return;
  ultimaAccion = Date.now();
  const r = siguienteAnio(estado);
  guardar();
  guia.paso_anio();
  pintar();
  guia.revisar(estado, r);
  resumen(r);
}

function comentarioCeiba(r: ResumenDelAnio, e: Estado): string {
  if (r.reveladas.length) return t('ceiba_trampa');
  if (r.emisiones < 0) return t('ceiba_negativas');
  if (e.vida < 40) return t('ceiba_vida');
  if (e.esperanza < 35) return t('ceiba_esp');
  return t(r.deltaEmisiones < 0 ? 'ceiba_bien' : 'ceiba_sube');
}

function resumen(r: ResumenDelAnio) {
  const e = estado!;
  const flecha = (x: number) => (x < -0.005 ? '▼' : x > 0.005 ? '▲' : '=');
  const items: string[] = [];
  if (r.enso.fase !== 'neutro') items.push(`<li>${ico(r.enso.fase === 'nino' ? 'temperatura' : 'hielo')}<span>${t('enso_' + r.enso.fase, { t: fmt(Math.abs(r.enso.anom), 2) })}</span></li>`);
  if (r.desbloqueadas.length) {
    const nombres = r.desbloqueadas.slice(0, 3).map((id) => esc(nombre(SOL_POR_ID.get(id)!)));
    items.push(`<li class="bueno">${ico('candado')}<span>${t('nuevas', { lista: nombres.join(', ') })}${r.desbloqueadas.length > 3 ? ' ' + t('y_mas', { n: r.desbloqueadas.length - 3 }) : ''}</span></li>`);
  }
  for (const id of r.reveladas) items.push(`<li class="malo">${ico('trampa')}<span>${t('revelada', { nombre: esc(nombre(SOL_POR_ID.get(id)!)) })}</span></li>`);
  for (const i of r.inflexiones) items.push(`<li class="malo">${ico('hielo')}<span>${t('inf_' + i)}</span></li>`);
  if (r.choqueAerosoles) items.push(`<li class="malo">${ico('geoingenieria')}<span>${t('choque')}</span></li>`);
  for (const ev of r.eventos) {
    items.push(`<li>${ico(ev.tipo === 'incendio' ? 'energia' : ev.tipo === 'sequia' ? 'temperatura' : ev.tipo === 'terremoto' ? 'materiales' : 'huracan')}<span>${t('ev_' + ev.tipo, { region: t('r_' + ev.region) })}: ${ev.danados.length ? `<b class="malo">${t('ev_danos', { n: ev.danados.length })}</b>` : t('ev_sin_danos')}</span></li>`);
  }
  let dato = '';
  if (r.dato) {
    const s = SOL_POR_ID.get(r.dato)!;
    dato = s.potencial_gt_min != null && s.potencial_gt_max != null
      ? t('dato', { nombre: esc(nombre(s)), a: fmt(s.potencial_gt_min, 2), b: fmt(s.potencial_gt_max, 2) })
      : t('dato_sin', { nombre: esc(nombre(s)) });
    const emp = s.emprendimientos?.filter((x) => !x.startsWith('(') && !x.includes('por-verificar'));
    if (emp?.length) dato += ' ' + t('dato_emp', { lista: esc(emp.slice(0, 3).join(', ')) });
  }
  const desg = (lista: [string, number][], icono: string) => lista.length ? `<div class="desglose">${ico(icono)}<span>${lista
    .slice().sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 4)
    .map(([k, v]) => `<span class="${v > 0 ? 'bueno' : 'malo'}">${v > 0 ? '+' : '−'}${fmt(Math.abs(v), 1)} ${t('d_' + k)}</span>`).join(' · ')}</span></div>` : '';
  const html = `<h2>${t('resumen_titulo', { anio: r.anio })}</h2>
    <div class="nums">
      <div>${ico('emisiones')} ${fmt(r.emisiones)} Gt <span class="${r.deltaEmisiones < 0 ? 'bueno' : 'malo'}">${flecha(r.deltaEmisiones)}${fmt(Math.abs(r.deltaEmisiones))}</span></div>
      <div>${ico('temperatura')} ${fmt(r.temperatura, 2)}° <span class="${r.deltaTemperatura < 0 ? 'bueno' : 'malo'}">${flecha(r.deltaTemperatura)}${fmt(Math.abs(r.deltaTemperatura), 2)}</span></div>
      <div>${ico('vida')} ${Math.round(r.vida)}</div>
      <div>${ico('esperanza')} ${Math.round(r.esperanza)}</div>
    </div>
    <p class="estado-board">${t('produccion', { e: Math.round(r.produccion.energia), m: Math.round(r.produccion.materiales) })}</p>
    ${(r.desglose.vida.length || r.desglose.esperanza.length) ? `<h3>${t('por_que')}</h3>${desg(r.desglose.vida, 'vida')}${desg(r.desglose.esperanza, 'esperanza')}` : ''}
    ${items.length ? `<ul>${items.join('')}</ul>` : ''}
    ${dato ? `<p class="dato">${dato}</p>` : ''}
    <div class="ceiba-dice"><img class="retrato-chico" src="${sprite('ceiba')}" alt=""><p>${comentarioCeiba(r, e)}</p></div>
    <button class="prim" data-cerrar>${t('resumen_ok')}</button>`;
  modal(html, () => { if (e.fin) fin(); else guia.cerroResumen(); });
}

function fin() {
  const e = estado!;
  const p = puntaje(e);
  const prev = Number(guardado.leer('record') ?? 0);
  if (p.total > prev) guardado.escribir('record', String(p.total));
  guardar();
  const fila = (k: string, v: number) => `<tr><td>${t(k)}</td><td>${Math.round(v)}</td></tr>`;
  const reg: Registro = {
    apodo: '', puntaje: p.total, dificultad: e.dificultad, semilla: mundoNombre, anio: e.anio, fin: e.fin!,
    pico: Math.round(e.tPico * 100) / 100, huella: huella(e), fecha: new Date().toISOString(),
  };
  const m = modal(`<h2>${t('fin_' + e.fin)}</h2>
    <p>${t('fin_' + e.fin + '_txt')}</p>
    <p class="estado-board">${e.anio} · ${t('pico', { t: fmt(e.tPico, 2) })} · ${t(e.dificultad)} · ${t('mundo', { s: esc(mundoNombre) })}</p>
    <table>
      ${fila('p_rapidez', p.rapidez)}${fila('p_pico', p.pico)}${fila('p_vida', p.vida)}${fila('p_esperanza', p.esperanza)}
      ${fila('p_justicia', p.justicia)}${fila('p_diversidad', p.diversidad)}
      <tr class="tot"><td>${t('puntaje')} ×${p.multiplicador}</td><td>${p.total}</td></tr>
    </table>
    <p><b>${t('huella')}:</b> ${huella(e).map((id) => esc(nombre(SOL_POR_ID.get(id)!))).join(' · ')}</p>
    <div class="ficha" style="box-shadow:none;margin:10px 0">
      <label for="apodo">${t('apodo')}</label>
      <input id="apodo" maxlength="20" value="${esc(guardado.leer('apodo') ?? '')}" autocomplete="nickname">
      <button id="enviar" style="width:100%;margin-top:8px">${t('guardar_pts')}</button>
      <p id="pts-msg" class="estado-board"></p>
    </div>
    <button class="prim" data-cerrar>${t('otra')}</button>`, () => portada());
  const btn = m.querySelector<HTMLButtonElement>('#enviar')!;
  btn.onclick = async () => {
    const apodo = (m.querySelector('#apodo') as HTMLInputElement).value.trim();
    if (!apodo) { (m.querySelector('#apodo') as HTMLInputElement).focus(); return; }
    guardado.escribir('apodo', apodo);
    btn.disabled = true;
    const sb = await scoreboard();
    const r = await sb.enviar({ ...reg, apodo });
    (m.querySelector('#pts-msg') as HTMLElement).textContent = t('pts_' + (r === 'ok' ? 'ok' : r));
    if (r === 'error') btn.disabled = false;
    if (r === 'ok' || r === 'peor') { m.remove(); portada(); tabla(reg.fecha); }
  };
}

// ---------- Sugerencia si el jugador lleva un minuto quieto (como en Polytopia) ----------
setInterval(() => {
  if (!estado || estado.fin || guia.ocupada || document.querySelector('.modal') || planeta.portada) return;
  if (Date.now() - ultimaAccion < 60000) return;
  ultimaAccion = Date.now();
  const e = estado;
  const mejorable = Object.keys(e.edificios).find((cid) => {
    const c = costoMejorar(e, cid);
    return c && c.energia <= e.energia && c.materiales <= e.materiales && !e.reveladas.includes(e.edificios[cid].sol);
  });
  let mejor: { celda: string; pot: number } | null = null;
  for (const s of solucionesDisponibles(e)) {
    if (s.juego.es_trampa) continue;
    const c = costoConstruir(e, s.id);
    if (c.energia > e.energia || c.materiales > e.materiales) continue;
    if (mejor && potencialDe(s) <= mejor.pot) continue;
    const celda = CELDAS.find((x) => !e.edificios[x.id] && compatible(s, x.bioma) && planeta.posicion(x.id));
    if (celda) mejor = { celda: celda.id, pot: potencialDe(s) };
  }
  if (mejor) { guia.decir(t('inactivo_construir')); planeta.resaltar.add(mejor.celda); }
  else if (mejorable) { guia.decir(t('inactivo_mejorar')); planeta.resaltar.add(mejorable); }
  else if (Math.max(e.energia, e.materiales) > 3 * Math.min(e.energia, e.materiales) + 20) {
    guia.decir(t('inactivo_cambiar')); document.getElementById('btn-cambio')?.classList.add('foco');
  } else { guia.decir(t('inactivo_pasar')); document.getElementById('btn-sig')?.classList.add('foco'); }
}, 5000);

// ---------- Arranque ----------
document.documentElement.lang = idioma;
window.addEventListener('resize', () => estado && spark());
portada();
