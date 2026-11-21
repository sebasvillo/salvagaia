// La guía: enseña de a una cosa, en el momento en que importa (divulgación progresiva).
// Pasos del tutorial en orden + avisos de contexto que salen una sola vez cuando pasa algo nuevo.
import { CELDAS, CELDA_POR_ID } from '../sim/datos';
import type { Estado, ResumenDelAnio } from '../sim/juego';
import { sprite } from './sprites';
import type { Planeta } from './planeta';

type Espera = 'boton' | 'tocar_ciudad' | 'construir' | 'siguiente' | 'resumen';
interface Paso { id: string; foco?: string; espera: Espera; donde?: 'arriba' | 'abajo' }

const TUTORIAL: Paso[] = [
  { id: 'hola', espera: 'boton', donde: 'abajo' },
  { id: 'temp', foco: '#m-temp', espera: 'boton', donde: 'abajo' },
  { id: 'emis', foco: '#m-emis', espera: 'boton', donde: 'abajo' },
  { id: 'meta', foco: '#tiras', espera: 'boton', donde: 'abajo' },
  { id: 'barras', foco: '#m-vida, #m-esp', espera: 'boton', donde: 'abajo' },
  { id: 'tocar', espera: 'tocar_ciudad', donde: 'abajo' },
  { id: 'cajon', foco: '#cajon', espera: 'construir', donde: 'arriba' },
  { id: 'recursos', foco: '#m-ener, #m-mat', espera: 'boton', donde: 'abajo' },
  { id: 'siguiente', foco: '#btn-sig', espera: 'siguiente', donde: 'arriba' },
  { id: 'despues', espera: 'resumen', donde: 'abajo' },
  { id: 'mejorar', espera: 'boton', donde: 'abajo' },
];

const guardar = (k: string, v: string) => { try { localStorage.setItem('salvagaia:' + k, v); } catch { /* nada */ } };
const leer = (k: string) => { try { return localStorage.getItem('salvagaia:' + k); } catch { return null; } };

export class Guia {
  private paso = -1;
  private vistos: Set<string>;
  private cola: string[] = [];
  private actual: string | null = null;
  private el: HTMLDivElement;
  private ciudad: string;

  constructor(private planeta: Planeta, private t: (k: string, v?: Record<string, string | number>) => string, private alCambiar: () => void) {
    this.vistos = new Set(JSON.parse(leer('guia') ?? '[]'));
    this.el = document.createElement('div');
    this.el.id = 'guia';
    document.body.appendChild(this.el);
    // La ciudad del tutorial: la más cercana a Bogotá.
    let mejor = CELDAS[0], d = Infinity;
    for (const c of CELDAS) {
      if (c.bioma !== 'ciudad') continue;
      const dd = (c.lat - 4.7) ** 2 + (c.lng + 74.1) ** 2;
      if (dd < d) { d = dd; mejor = c; }
    }
    this.ciudad = mejor.id;
  }

  get enTutorial() { return this.paso >= 0; }

  /** Empieza el tutorial si nunca se ha hecho (o si se pide repetir). */
  empezar(forzar = false) {
    if (!forzar && this.vistos.has('tutorial')) return;
    this.paso = 0;
    this.mostrar();
  }

  saltar() {
    this.paso = -1; this.actual = null; this.cola = [];
    this.vistos.add('tutorial'); this.persistir(); this.limpiar();
  }

  private persistir() { guardar('guia', JSON.stringify([...this.vistos])); }

  private limpiar() {
    this.el.innerHTML = '';
    document.querySelectorAll('.foco').forEach((x) => x.classList.remove('foco'));
    this.planeta.resaltar.clear();
  }

  private avanzar() {
    this.paso++;
    if (this.paso >= TUTORIAL.length) { this.paso = -1; this.vistos.add('tutorial'); this.persistir(); this.limpiar(); this.siguienteAviso(); return; }
    this.mostrar();
  }

  /** Vuelve a poner el foco después de que la interfaz se redibuja. */
  refrescar() {
    if (this.paso < 0) return;
    const p = TUTORIAL[this.paso];
    document.querySelectorAll('.foco').forEach((x) => x.classList.remove('foco'));
    if (p.foco) document.querySelectorAll(p.foco).forEach((x) => x.classList.add('foco'));
  }

  private globo(texto: string, opciones: { donde?: 'arriba' | 'abajo'; contador?: string; boton?: string; alBoton?: () => void; saltable?: boolean }) {
    const top = opciones.donde === 'arriba';
    this.el.style.top = top ? 'calc(130px + env(safe-area-inset-top))' : '';
    this.el.style.bottom = top ? '' : 'calc(86px + env(safe-area-inset-bottom))';
    this.el.innerHTML = `
      <img class="retrato" src="${sprite('ceiba')}" alt="">
      <div class="globo" role="dialog" aria-live="polite">
        <b class="quien">CEIBA</b>
        <div>${texto}</div>
        <div class="bot">
          <span>${opciones.saltable ? `<button class="link" data-saltar>${this.t('g_saltar')}</button>` : ''}
            ${opciones.contador ? `<span class="paso">${opciones.contador}</span>` : ''}</span>
          ${opciones.boton ? `<button class="prim" data-ok>${opciones.boton}</button>` : ''}
        </div>
      </div>`;
    this.el.querySelector<HTMLButtonElement>('[data-ok]')?.addEventListener('click', () => opciones.alBoton?.());
    this.el.querySelector<HTMLButtonElement>('[data-saltar]')?.addEventListener('click', () => this.saltar());
  }

  private mostrar() {
    this.limpiar();
    const p = TUTORIAL[this.paso];
    if (p.id === 'tocar') {
      this.planeta.centrarEn(this.ciudad);
      this.planeta.seleccion = null;
      CELDAS.filter((c) => c.bioma === 'ciudad').forEach((c) => this.planeta.resaltar.add(c.id));
      this.alCambiar();
    }
    this.globo(this.t('g_' + p.id), {
      donde: p.donde, contador: `${this.paso + 1}/${TUTORIAL.length}`, saltable: true,
      boton: p.espera === 'boton' ? this.t(this.paso === TUTORIAL.length - 1 ? 'g_listo' : 'g_sigue') : undefined,
      alBoton: () => this.avanzar(),
    });
    this.refrescar();
  }

  // ---------- Lo que hace el jugador ----------
  tocar(celda: string | null) {
    if (this.paso < 0) return;
    const p = TUTORIAL[this.paso];
    if (p.espera === 'tocar_ciudad' && celda && CELDA_POR_ID.get(celda)?.bioma === 'ciudad') this.avanzar();
  }
  construyo() { if (this.paso >= 0 && TUTORIAL[this.paso].espera === 'construir') this.avanzar(); }
  paso_anio() { if (this.paso >= 0 && TUTORIAL[this.paso].espera === 'siguiente') { this.limpiar(); this.paso++; } }
  cerroResumen() {
    if (this.paso >= 0 && TUTORIAL[this.paso].espera === 'resumen') { this.avanzar(); return; }
    if (this.paso >= 0) this.mostrar();
    else this.siguienteAviso();
  }

  // ---------- Avisos de contexto (una sola vez cada uno) ----------
  revisar(e: Estado, r?: ResumenDelAnio) {
    const nuevo = (id: string, cond: boolean) => { if (cond && !this.vistos.has(id) && !this.cola.includes(id) && this.actual !== id) this.cola.push(id); };
    if (r) {
      nuevo('a_trampa', r.reveladas.length > 0);
      nuevo('a_era2', r.desbloqueoEra2);
      nuevo('a_evento', r.eventos.some((x) => x.danados.length > 0));
      nuevo('a_inflexion', r.inflexiones.length > 0);
    }
    nuevo('a_esperanza', e.esperanza < 38);
    nuevo('a_vida', e.vida < 40);
    nuevo('a_negativas', e.historia.length > 1 && e.historia[e.historia.length - 1].emisiones < 0);
    nuevo('a_racha', e.racha >= 2);
    nuevo('a_recursos', e.anio >= 2029 && e.energia >= 140);
  }

  siguienteAviso() {
    if (this.paso >= 0 || this.actual || !this.cola.length || document.querySelector('.modal')) return;
    const id = this.cola.shift()!;
    this.actual = id;
    this.limpiar();
    const foco = id === 'a_esperanza' ? '#btn-pol' : id === 'a_vida' ? '#m-vida' : id === 'a_racha' ? '#tiras' : null;
    if (foco) document.querySelectorAll(foco).forEach((x) => x.classList.add('foco'));
    this.globo(this.t('g_' + id), {
      donde: 'abajo', boton: this.t('g_entendido'),
      alBoton: () => { this.vistos.add(id); this.persistir(); this.actual = null; this.limpiar(); this.siguienteAviso(); },
    });
  }

  saltarSiTutorial() { this.limpiar(); this.paso = -1; this.actual = null; }

  get ocupada() { return this.paso >= 0 || this.actual !== null; }

  /** Ceiba dice algo cualquiera (sugerencias, animales). */
  decir(html: string, donde: 'arriba' | 'abajo' = 'abajo') {
    if (this.paso >= 0) return;
    this.actual = 'decir';
    this.limpiar();
    this.globo(html, { donde, boton: this.t('g_entendido'), alBoton: () => { this.actual = null; this.limpiar(); this.planeta.resaltar.clear(); this.siguienteAviso(); } });
  }

  callar() { if (this.actual === 'decir' || this.actual === 'tip') { this.actual = null; this.limpiar(); } }

  /** Explicación corta de un medidor (al tocarlo). */
  explicar(clave: string) {
    if (this.paso >= 0) return;
    this.actual = 'tip';
    this.limpiar();
    this.globo(this.t('tip_' + clave), { donde: 'abajo', boton: this.t('g_entendido'), alBoton: () => { this.actual = null; this.limpiar(); this.siguienteAviso(); } });
  }
}
