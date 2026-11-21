// La interfaz: portada, barra de arriba, cajón de soluciones, tarjetas del año, guía y tabla de mundos.
import './estilo.css';
import es from './i18n/es.json';
import en from './i18n/en.json';
import { CELDA_POR_ID, P, SOL_POR_ID, compatible, type Dificultad, type Solucion } from './sim/datos';
import {
  POLITICAS, aplicarPolitica, calcularEmisiones, construir, costoConstruir, costoMejorar, costoPolitica, demoler,
  huella, mejorar, nuevaPartida, puntaje, solucionesDisponibles, type Estado, type ResumenDelAnio,
} from './sim/juego';
import { siguienteAnio } from './sim/turno';
import { Planeta, SPRITE_CATEGORIA } from './ui/planeta';
import { Guia } from './ui/guia';
import { ico } from './ui/sprites';
import { LINK_COMPARTIDO, scoreboard, type Registro } from './scoreboard';

type Idioma = 'es' | 'en';
const TEXTOS: Record<Idioma, Record<string, string>> = { es, en };
const guardado = {
  leer(k: string): string | null { try { return localStorage.getItem('salvagaia:' + k); } catch { return null; } },
  escribir(k: string, v: string) { try { localStorage.setItem('salvagaia:' + k, v); } catch { /* sin almacenamiento */ } },
  borrar(k: string) { try { localStorage.removeItem('salvagaia:' + k); } catch { /* nada */ } },
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
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const icoSol = (s: Solucion, e?: Estado) => ico(e?.reveladas.includes(s.id) ? 'trampa' : SPRITE_CATEGORIA[s.categoria_juego] ?? 'trampa');

let estado: Estado | null = null;
let mensaje = '';
const planeta = new Planeta($('#planeta') as HTMLCanvasElement, () => estado);
const guia = new Guia(planeta, t, () => pintar());

function guardar() { if (estado) guardado.escribir('partida', JSON.stringify(estado)); }

function modal(html: string, alCerrar?: () => void) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="ficha">${html}</div>`;
  document.body.appendChild(m);
  m.querySelectorAll<HTMLElement>('[data-cerrar]').forEach((b) => (b.onclick = () => { m.remove(); alCerrar?.(); }));
  return m;
}

// ---------- Portada ----------
function portada() {
  planeta.portada = true;
  const hay = guardado.leer('partida');
  const record = guardado.leer('record');
  $('#ui').innerHTML = `
    <div class="portada">
      <h1>${t('titulo')}</h1>
      <p class="lema"><span>${t('subtitulo')}</span></p>
      <div class="ficha">
        <label>${t('dificultad')}</label>
        <div class="seg" id="dif">
          ${(['facil', 'medio', 'dificil'] as const).map((d) => `<button data-d="${d}" class="${d === 'medio' ? 'on' : ''}">${t(d)}</button>`).join('')}
        </div>
        <label for="semilla">${t('semilla')}</label>
        <input id="semilla" value="${Math.random().toString(36).slice(2, 8)}" maxlength="24" autocomplete="off" spellcheck="false">
        <small>${t('semilla_ayuda')}</small>
      </div>
      <button class="prim" id="jugar">${t('jugar')}</button>
      ${hay ? `<button id="continuar">${t('continuar')}</button>` : ''}
      <div class="fila">
        <button class="link" id="glosario">${t('glosario')}</button>
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
    estado = nuevaPartida(($('#semilla') as HTMLInputElement).value.trim() || 'gaia', dif);
    guardar(); juego(); guia.empezar();
  };
  const c = document.getElementById('continuar');
  if (c) c.onclick = () => { try { estado = JSON.parse(hay!); juego(); guia.empezar(); } catch { guardado.borrar('partida'); portada(); } };
  $('#glosario').onclick = glosario;
  $('#tabla').onclick = () => tabla();
  $('#idioma').onclick = () => { idioma = idioma === 'es' ? 'en' : 'es'; guardado.escribir('idioma', idioma); document.documentElement.lang = idioma; portada(); };
}

function glosario() {
  const items = ['drawdown', 'gt', 'temp', 'netas', 'adopcion', 'trampas', 'politicas', 'inflexion'];
  modal(`<h2>${t('glosario')}</h2>
    <dl class="glosario">${items.map((k) => `<dt>${t('gl_' + k)}</dt><dd>${t('gl_' + k + '_txt')}</dd>`).join('')}</dl>
    ${estado ? `<button id="repetir">${t('repetir_guia')}</button>` : ''}
    <button class="prim" data-cerrar>${t('cerrar')}</button>`);
  const r = document.getElementById('repetir');
  if (r) r.onclick = () => { document.querySelector('.modal')?.remove(); guia.empezar(true); };
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
function juego() {
  planeta.portada = false;
  $('#ui').innerHTML = `
    <header id="hud"></header>
    <div id="tiras"></div>
    <section id="cajon"></section>
    <footer>
      <button id="btn-pol">${t('politicas')}</button>
      <button id="btn-glo" aria-label="${t('glosario')}">?</button>
      <button class="prim" id="btn-sig">${t('siguiente')} ▸</button>
    </footer>`;
  $('#btn-sig').onclick = pasarAnio;
  $('#btn-pol').onclick = politicas;
  $('#btn-glo').onclick = glosario;
  planeta.seleccion = null;
  planeta.onTocar = (id) => { mensaje = ''; pintar(); guia.tocar(id); };
  pintar();
}

function barra(v: number) { return `<span class="barra"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></span>`; }

function pintar() {
  if (!estado || !document.getElementById('hud')) return;
  const e = estado;
  const em = calcularEmisiones(e);
  $('#hud').innerHTML = `
    <div class="sello"><small>${t('anio_corto')}</small>${e.anio}</div>
    <div class="medidores">
      <div class="med" id="m-temp" data-tip="temp">${ico('temperatura')} ${fmt(e.temperatura, 2)}<span class="unidad">°C</span></div>
      <div class="med" id="m-emis" data-tip="emis">${ico('emisiones')} ${fmt(em.neta)}<span class="unidad">Gt/${idioma === 'es' ? 'año' : 'yr'}</span></div>
      <div class="med" id="m-ener" data-tip="ener">${ico('rayo')} ${Math.round(e.energia)}<span class="unidad">/ ${P.recursos.energia.tope}</span></div>
      <div class="med" id="m-mat" data-tip="mat">${ico('materiales')} ${Math.round(e.materiales)}<span class="unidad">/ ${P.recursos.materiales.tope}</span></div>
      <div class="med vida ${e.vida < 30 ? 'bajo' : ''}" id="m-vida" data-tip="vida">${ico('vida')} ${barra(e.vida)}</div>
      <div class="med esp ${e.esperanza < 30 ? 'bajo' : ''}" id="m-esp" data-tip="esp">${ico('esperanza')} ${barra(e.esperanza)}</div>
    </div>`;
  document.querySelectorAll<HTMLElement>('.med').forEach((m) => (m.onclick = () => guia.explicar(m.dataset.tip!)));
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
  linea((p) => p.temperatura, 0.9, 3, '#d9733e');
}

function costoTxt(c: { energia: number; materiales: number }) {
  const e = estado!;
  return `<span class="${e.energia >= c.energia ? '' : 'falta'}">${ico('rayo')}${c.energia}</span><span class="${e.materiales >= c.materiales ? '' : 'falta'}">${ico('materiales')}${c.materiales}</span>`;
}

function impacto(s: Solucion) {
  if (s.potencial_gt_max == null) return `<span class="imp" style="color:var(--tinta2)">${t('evita_sup')}</span>`;
  return `<span class="imp">${t(s.tipo === 'secuestrar' ? 'captura' : 'evita', { g: fmt(s.potencial_gt_max, s.potencial_gt_max < 1 ? 2 : 1) })}</span>`;
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
        <div><b>${esc(nombre(s))}</b> · ${t('nivel', { n: b.nivel })}<br>
          ${s.juego.objeto_juego && idioma === 'es' ? `<small><i>${esc(s.juego.objeto_juego)}</i></small><br>` : ''}
          ${impacto(s)}<br><small>${t('adopcion', { p: Math.round((e.adopcion[s.id] ?? 0) * 100) })}</small>
          ${rev ? `<div class="aviso-trampa"><b>${t('trampa_revelada')}.</b> ${esc(s.juego.efectos_ocultos.riesgo ?? '')}</div>` : ''}
        </div>
      </div>
      <div class="acc">
        ${cm ? `<button class="prim" id="mej">${t('mejorar', { n: b.nivel + 1 })} <span class="costo">${costoTxt(cm)}</span></button>` : `<button disabled>${t('nivel_max')}</button>`}
        <button class="peligro" id="dem">${t('demoler')}</button>
      </div>`;
    if (cm) $('#mej').onclick = () => { const r = mejorar(e, id); mensaje = r ? t('err_' + r) : ''; guardar(); pintar(); };
    $('#dem').onclick = () => { demoler(e, id); mensaje = ''; guardar(); pintar(); };
    return;
  }
  const opciones = solucionesDisponibles(e).filter((s) => compatible(s, c.bioma));
  if (!opciones.length) { caj.innerHTML = `${cab}<p class="vacio">${t('nada_aqui')}</p>`; return; }
  // Primero lo que alcanza, después por impacto. Las trampas se ven igual que el resto: así enseñan.
  opciones.sort((a, b) => {
    const ca = costoConstruir(e, a.id), cb = costoConstruir(e, b.id);
    const oka = e.energia >= ca.energia && e.materiales >= ca.materiales, okb = e.energia >= cb.energia && e.materiales >= cb.materiales;
    return oka !== okb ? (oka ? -1 : 1) : b.juego.potencial_gt_usado - a.juego.potencial_gt_usado;
  });
  caj.innerHTML = `${cab}${msg}<div class="lista">${opciones.map((s) => `
    <button class="sol" data-s="${s.id}">
      ${icoSol(s)}
      <b>${esc(nombre(s))}</b>
      ${s.juego.objeto_juego && idioma === 'es' ? `<span class="obj">${esc(s.juego.objeto_juego)}</span>` : ''}
      ${impacto(s)}
      <span class="costo">${costoTxt(costoConstruir(e, s.id))}</span>
    </button>`).join('')}</div>`;
  caj.querySelectorAll<HTMLButtonElement>('.sol').forEach((btn) => (btn.onclick = () => {
    const r = construir(e, id, btn.dataset.s!);
    mensaje = r ? t('err_' + r) : '';
    guardar(); pintar();
    if (!r) guia.construyo();
  }));
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
    aplicarPolitica(e, b.dataset.p!); guardar(); m.remove(); pintar(); politicas();
  }));
}

function pasarAnio() {
  if (!estado || estado.fin || document.querySelector('.modal')) return;
  const r = siguienteAnio(estado);
  guardar();
  guia.paso_anio();
  pintar();
  guia.revisar(estado, r);
  resumen(r);
}

function resumen(r: ResumenDelAnio) {
  const e = estado!;
  const flecha = (x: number) => (x < -0.005 ? '▼' : x > 0.005 ? '▲' : '=');
  const items: string[] = [];
  if (r.desbloqueoEra2) items.push(`<li class="bueno">${ico('candado')}<span>${t('era2')}</span></li>`);
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
    if (s.emprendimientos?.length) dato += ' ' + t('dato_emp', { lista: esc(s.emprendimientos.slice(0, 3).join(', ')) });
  }
  const html = `<h2>${t('resumen_titulo', { anio: r.anio })}</h2>
    <div class="nums">
      <div>${ico('emisiones')} ${fmt(r.emisiones)} <span class="${r.deltaEmisiones < 0 ? 'bueno' : 'malo'}">${flecha(r.deltaEmisiones)}${fmt(Math.abs(r.deltaEmisiones))}</span></div>
      <div>${ico('temperatura')} ${fmt(r.temperatura, 2)}° <span class="${r.deltaTemperatura < 0 ? 'bueno' : 'malo'}">${flecha(r.deltaTemperatura)}${fmt(Math.abs(r.deltaTemperatura), 2)}</span></div>
      <div>${ico('vida')} ${Math.round(r.vida)}</div>
      <div>${ico('esperanza')} ${Math.round(r.esperanza)}</div>
    </div>
    ${items.length ? `<ul>${items.join('')}</ul>` : ''}
    ${dato ? `<p class="dato">${dato}</p>` : ''}
    <button class="prim" data-cerrar>${t('resumen_ok')}</button>`;
  modal(html, () => { if (e.fin) fin(); else guia.cerroResumen(); });
}

function fin() {
  const e = estado!;
  const p = puntaje(e);
  const prev = Number(guardado.leer('record') ?? 0);
  if (p.total > prev) guardado.escribir('record', String(p.total));
  guardado.borrar('partida');
  const fila = (k: string, v: number) => `<tr><td>${t(k)}</td><td>${Math.round(v)}</td></tr>`;
  const reg: Registro = {
    apodo: '', puntaje: p.total, dificultad: e.dificultad, semilla: e.semilla, anio: e.anio, fin: e.fin!,
    pico: Math.round(e.tPico * 100) / 100, huella: huella(e), fecha: new Date().toISOString(),
  };
  const m = modal(`<h2>${t('fin_' + e.fin)}</h2>
    <p>${t('fin_' + e.fin + '_txt')}</p>
    <p class="estado-board">${e.anio} · ${t('pico', { t: fmt(e.tPico, 2) })} · ${t(e.dificultad)} · ${t('mundo', { s: esc(e.semilla) })}</p>
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
    <button class="prim" data-cerrar>${t('otra')}</button>`, () => { estado = null; portada(); });
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
    if (r === 'ok' || r === 'peor') { m.remove(); estado = null; portada(); tabla(reg.fecha); }
  };
}

// ---------- Arranque ----------
document.documentElement.lang = idioma;
window.addEventListener('resize', () => estado && spark());
portada();
