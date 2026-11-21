// La interfaz: pantallas, barra superior, cajón de soluciones, tarjetas del año.
import './estilo.css';
import es from './i18n/es.json';
import en from './i18n/en.json';
import { CELDA_POR_ID, P, SOL_POR_ID, compatible, type Dificultad, type Solucion } from './sim/datos';
import {
  POLITICAS, aplicarPolitica, calcularEmisiones, construir, costoConstruir, costoMejorar, costoPolitica, demoler,
  huella, mejorar, nuevaPartida, puntaje, solucionesDisponibles, type Estado, type ResumenDelAnio,
} from './sim/juego';
import { siguienteAnio } from './sim/turno';
import { ICONO_CATEGORIA, Planeta } from './ui/planeta';

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

let estado: Estado | null = null;
let planeta: Planeta;
let mensaje = '';

function guardar() { if (estado) guardado.escribir('partida', JSON.stringify(estado)); }

// ---------- Pantalla de inicio ----------
function inicio() {
  const hay = guardado.leer('partida');
  const record = guardado.leer('record');
  $('#ui').innerHTML = `
    <div class="inicio">
      <h1>${t('titulo')}</h1>
      <p class="sub">${t('subtitulo')}</p>
      <label>${t('dificultad')}</label>
      <div class="seg" id="dif">
        ${(['facil', 'medio', 'dificil'] as const).map((d) => `<button data-d="${d}" class="${d === 'medio' ? 'on' : ''}">${t(d)}</button>`).join('')}
      </div>
      <label for="semilla">${t('semilla')}</label>
      <input id="semilla" value="${Math.random().toString(36).slice(2, 8)}" maxlength="24" autocomplete="off">
      <small>${t('semilla_ayuda')}</small>
      <button class="grande" id="jugar">${t('jugar')}</button>
      ${hay ? `<button class="sec" id="continuar">${t('continuar')}</button>` : ''}
      <div class="fila">
        <button class="link" id="ayuda">${t('ayuda')}</button>
        <button class="link" id="idioma">${t('idioma')}</button>
      </div>
      ${record ? `<p class="record">${t('record', { n: record })}</p>` : ''}
    </div>`;
  let dif: Dificultad = 'medio';
  document.querySelectorAll<HTMLButtonElement>('#dif button').forEach((b) => (b.onclick = () => {
    dif = b.dataset.d as Dificultad;
    document.querySelectorAll('#dif button').forEach((x) => x.classList.toggle('on', x === b));
  }));
  $('#jugar').onclick = () => {
    estado = nuevaPartida(($('#semilla') as HTMLInputElement).value.trim() || 'gaia', dif);
    guardar(); juego();
  };
  const c = document.getElementById('continuar');
  if (c) c.onclick = () => { try { estado = JSON.parse(hay!); juego(); } catch { guardado.borrar('partida'); inicio(); } };
  $('#ayuda').onclick = ayuda;
  $('#idioma').onclick = () => { idioma = idioma === 'es' ? 'en' : 'es'; guardado.escribir('idioma', idioma); inicio(); };
}

function ayuda() {
  modal(`<h2>${t('ayuda')}</h2><p>${t('ayuda_txt')}</p><button class="grande" data-cerrar>${t('cerrar')}</button>`);
}

function modal(html: string, alCerrar?: () => void) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="tarjeta">${html}</div>`;
  document.body.appendChild(m);
  m.querySelectorAll<HTMLElement>('[data-cerrar]').forEach((b) => (b.onclick = () => { m.remove(); alCerrar?.(); }));
  return m;
}

// ---------- El juego ----------
function juego() {
  $('#ui').innerHTML = `
    <header id="hud"></header>
    <canvas id="spark" height="34"></canvas>
    <section id="cajon"></section>
    <footer>
      <button class="sec" id="btn-pol">${t('politicas')}</button>
      <button class="sec" id="btn-ayuda">?</button>
      <button class="grande" id="btn-sig">${t('siguiente')}</button>
    </footer>`;
  $('#btn-sig').onclick = pasarAnio;
  $('#btn-pol').onclick = politicas;
  $('#btn-ayuda').onclick = ayuda;
  planeta.seleccion = null;
  planeta.onTocar = () => { mensaje = ''; pintar(); };
  pintar();
}

function barra(valor: number, clase: string) {
  return `<span class="barra ${clase}"><i style="width:${Math.max(0, Math.min(100, valor))}%"></i></span>`;
}

function pintar() {
  if (!estado) return;
  const e = estado;
  const em = calcularEmisiones(e);
  $('#hud').innerHTML = `
    <div class="h1"><b>${e.anio}</b>
      <span title="${t('temperatura')}">🌡 ${fmt(e.temperatura, 2)} °C</span>
      <span title="${t('emisiones')}">☁ ${fmt(em.neta)} ${t('gt')}</span>
      ${e.racha > 0 ? `<span class="racha">${t('racha', { n: e.racha })}</span>` : ''}
    </div>
    <div class="h2">
      <span title="${t('energia')}">⚡ ${Math.round(e.energia)}/${P.recursos.energia.tope}</span>
      <span title="${t('materiales')}">⛏ ${Math.round(e.materiales)}/${P.recursos.materiales.tope}</span>
      <span class="ind">🌱 ${barra(e.vida, 'vida')}</span>
      <span class="ind">✊ ${barra(e.esperanza, 'esp')}</span>
    </div>`;
  spark();
  cajon();
}

function spark() {
  const c = $('#spark') as HTMLCanvasElement;
  if (!c || !estado) return;
  const w = (c.width = c.clientWidth * 2), h = (c.height = 68);
  const ctx = c.getContext('2d')!;
  const hs = estado.historia;
  const n = Math.max(30, hs.length);
  const linea = (f: (p: (typeof hs)[0]) => number, min: number, max: number, color: string) => {
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath();
    hs.forEach((p, i) => { const x = (i / (n - 1)) * w, y = h - ((f(p) - min) / (max - min)) * (h - 6) - 3; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
  };
  ctx.clearRect(0, 0, w, h);
  const y0 = h - ((0 + 10) / 75) * (h - 6) - 3;
  ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(w, y0); ctx.stroke();
  linea((p) => p.emisiones, -10, 65, '#7fd1c7');
  linea((p) => p.temperatura, 0.8, 3, '#f2a65a');
}

function costoTxt(c: { energia: number; materiales: number }) {
  const e = estado!;
  const cl = (ok: boolean) => (ok ? '' : ' class="falta"');
  return `<span${cl(e.energia >= c.energia)}>⚡${c.energia}</span> <span${cl(e.materiales >= c.materiales)}>⛏${c.materiales}</span>`;
}

function fichaSol(s: Solucion) {
  const pot = s.potencial_gt_min != null && s.potencial_gt_max != null
    ? t('potencial', { a: fmt(s.potencial_gt_min, 2), b: fmt(s.potencial_gt_max, 2) })
    : t('potencial_supuesto');
  const prod = s.juego.produce.energia || s.juego.produce.materiales
    ? ` · ${t('produce')} ${s.juego.produce.energia ? '⚡' + s.juego.produce.energia : ''}${s.juego.produce.materiales ? '⛏' + s.juego.produce.materiales : ''}` : '';
  const efe = `${s.juego.efecto_vida > 0 ? ' 🌱+' + s.juego.efecto_vida : ''}${s.juego.efecto_comunidad > 0 ? ' ✊+' + s.juego.efecto_comunidad : ''}`;
  return `<small>${pot}${prod}${efe}</small>`;
}

function cajon() {
  const e = estado!;
  const caj = $('#cajon');
  const id = planeta.seleccion;
  if (!id) { caj.innerHTML = `<p class="vacio">${mensaje || t('toca_celda')}</p>`; return; }
  const c = CELDA_POR_ID.get(id)!;
  const mar = c.bioma === 'oceano' || c.bioma === 'oceano_costero';
  const titulo = `<div class="cab"><b>${t('b_' + c.bioma)}</b>${mar ? '' : ' · ' + t('r_' + c.region)}${e.degradadas.includes(id) ? ` · <em>${t('degradada')}</em>` : ''}</div>`;
  const msg = mensaje ? `<p class="msg">${mensaje}</p>` : '';
  const b = e.edificios[id];
  if (b) {
    const s = SOL_POR_ID.get(b.sol)!;
    const cm = costoMejorar(e, id);
    const rev = e.reveladas.includes(s.id);
    caj.innerHTML = `${titulo}${msg}
      <div class="edif">
        <div class="ic">${rev ? '⚠️' : ICONO_CATEGORIA[s.categoria_juego]}</div>
        <div><b>${esc(nombre(s))}</b> · ${t('nivel', { n: b.nivel })}
          ${rev ? `<p class="trampa">${t('trampa_revelada')}: ${esc(s.juego.efectos_ocultos.riesgo ?? '')}</p>` : ''}
          ${fichaSol(s)}<br><small>${t('adopcion', { p: Math.round((e.adopcion[s.id] ?? 0) * 100) })}</small>
        </div>
      </div>
      <div class="acc">
        ${cm ? `<button class="grande" id="mej">${t('mejorar', { n: b.nivel + 1 })} · ${costoTxt(cm)}</button>` : `<button disabled>${t('nivel_max')}</button>`}
        <button class="sec peligro" id="dem">${t('demoler')}</button>
      </div>`;
    if (cm) $('#mej').onclick = () => { const r = mejorar(e, id); mensaje = r ? t('err_' + r) : ''; guardar(); pintar(); };
    $('#dem').onclick = () => { demoler(e, id); mensaje = ''; guardar(); pintar(); };
    return;
  }
  const opciones = solucionesDisponibles(e).filter((s) => compatible(s, c.bioma));
  if (!opciones.length) { caj.innerHTML = `${titulo}<p class="vacio">${t('nada_aqui')}</p>`; return; }
  opciones.sort((a, b) => b.juego.potencial_gt_usado - a.juego.potencial_gt_usado);
  caj.innerHTML = `${titulo}${msg}<div class="lista">${opciones.map((s) => {
    const co = costoConstruir(e, s.id);
    return `<button class="sol" data-s="${s.id}">
      <span class="ic">${ICONO_CATEGORIA[s.categoria_juego]}</span>
      <b>${esc(nombre(s))}</b>
      ${fichaSol(s)}
      <span class="costo">${costoTxt(co)}</span>
    </button>`;
  }).join('')}</div>`;
  caj.querySelectorAll<HTMLButtonElement>('.sol').forEach((btn) => (btn.onclick = () => {
    const r = construir(e, id, btn.dataset.s!);
    mensaje = r ? t('err_' + r) : '';
    guardar(); pintar();
  }));
}

function politicas() {
  const e = estado!;
  const html = `<h2>${t('politicas')}</h2><p class="sub">${t('politicas_ayuda')} ✊ ${Math.round(e.esperanza)}</p>
    ${POLITICAS.map((id) => {
      const c = costoPolitica(e, id);
      const usadas = e.politicas[id] ?? 0, veces = P.politicas[id].veces;
      return `<div class="pol"><div><b>${t('pol_' + id)}</b> ${veces > 1 ? `(${usadas}/${veces})` : ''}<br><small>${t('pol_' + id + '_txt')}</small></div>
        ${c === null ? `<button disabled>${t('agotada')}</button>` : `<button data-p="${id}" ${e.esperanza - c < 5 ? 'disabled' : ''}>✊ ${c}</button>`}</div>`;
    }).join('')}
    <button class="sec" data-cerrar>${t('cerrar')}</button>`;
  const m = modal(html, pintar);
  m.querySelectorAll<HTMLButtonElement>('[data-p]').forEach((b) => (b.onclick = () => {
    aplicarPolitica(e, b.dataset.p!); guardar(); m.remove(); pintar(); politicas();
  }));
}

function pasarAnio() {
  if (!estado || estado.fin) return;
  const r = siguienteAnio(estado);
  guardar();
  pintar();
  resumen(r);
}

function resumen(r: ResumenDelAnio) {
  const e = estado!;
  const flecha = (x: number) => (x < -0.005 ? '▼' : x > 0.005 ? '▲' : '=');
  const items: string[] = [];
  if (r.desbloqueoEra2) items.push(`<li class="bueno">🔓 ${t('era2')}</li>`);
  for (const id of r.reveladas) items.push(`<li class="malo">⚠️ ${t('revelada', { nombre: esc(nombre(SOL_POR_ID.get(id)!)) })}</li>`);
  for (const i of r.inflexiones) items.push(`<li class="malo">🧊 ${t('inf_' + i)}</li>`);
  if (r.choqueAerosoles) items.push(`<li class="malo">🌫️ ${t('choque')}</li>`);
  for (const ev of r.eventos) {
    items.push(`<li>🌀 ${t('ev_' + ev.tipo, { region: t('r_' + ev.region) })}: ${ev.danados.length ? t('ev_danos', { n: ev.danados.length }) : t('ev_sin_danos')}</li>`);
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
      <div>☁ <b>${fmt(r.emisiones)}</b> ${t('gt')} <span class="${r.deltaEmisiones < 0 ? 'bueno' : 'malo'}">${flecha(r.deltaEmisiones)} ${fmt(Math.abs(r.deltaEmisiones))}</span></div>
      <div>🌡 <b>${fmt(r.temperatura, 2)} °C</b> <span class="${r.deltaTemperatura < 0 ? 'bueno' : 'malo'}">${flecha(r.deltaTemperatura)} ${fmt(Math.abs(r.deltaTemperatura), 3)}</span></div>
      <div>🌱 ${Math.round(r.vida)} · ✊ ${Math.round(r.esperanza)} · ⚡ ${Math.round(r.energia)} · ⛏ ${Math.round(r.materiales)}</div>
    </div>
    ${items.length ? `<ul>${items.join('')}</ul>` : ''}
    ${dato ? `<p class="dato">${dato}</p>` : ''}
    <button class="grande" data-cerrar>${t('resumen_ok')}</button>`;
  modal(html, () => { if (e.fin) fin(); });
}

function fin() {
  const e = estado!;
  const p = puntaje(e);
  const prev = Number(guardado.leer('record') ?? 0);
  if (p.total > prev) guardado.escribir('record', String(p.total));
  guardado.borrar('partida');
  const fila = (k: string, v: number) => `<tr><td>${t(k)}</td><td>${Math.round(v)}</td></tr>`;
  modal(`<h2>${e.fin === 'victoria' ? '🌍 ' : ''}${t('fin_' + e.fin)}</h2>
    <p>${t('fin_' + e.fin + '_txt')}</p>
    <p class="sub">${e.anio} · ${t('pico', { t: fmt(e.tPico, 2) })} · ${t(e.dificultad)}</p>
    <table>
      ${fila('p_rapidez', p.rapidez)}${fila('p_pico', p.pico)}${fila('p_vida', p.vida)}${fila('p_esperanza', p.esperanza)}
      ${fila('p_justicia', p.justicia)}${fila('p_diversidad', p.diversidad)}
      <tr class="tot"><td>${t('puntaje')} ×${p.multiplicador}</td><td>${p.total}</td></tr>
    </table>
    <p><b>${t('huella')}:</b> ${huella(e).map((id) => esc(nombre(SOL_POR_ID.get(id)!))).join(' · ')}</p>
    <p class="record">${t('record', { n: Math.max(prev, p.total) })}</p>
    <button class="grande" data-cerrar>${t('otra')}</button>`, () => { estado = null; inicio(); });
}

// ---------- Arranque ----------
planeta = new Planeta($('#planeta') as HTMLCanvasElement, () => estado);
window.addEventListener('resize', () => estado && spark());
document.documentElement.lang = idioma;
inicio();
