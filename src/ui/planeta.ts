// El planeta: proyección ortográfica de las celdas H3, dibujada a baja resolución y escalada sin suavizado.
// Estilo: ilustración de cuaderno impresa en riso — tinta, tramado en el lado de noche, sin brillos ni halos.
import { CELDAS, CELDA_POR_ID, SOL_POR_ID, type Celda } from '../sim/datos';
import type { Estado } from '../sim/juego';
import { imagen } from './sprites';
import faunaJson from '../../data/fauna.json';

interface Animal { id: string; tipo: string; color: string; velocidad: number; ruta: [number, number][] }
const FAUNA = (faunaJson as any).animales as Animal[];

const RAD = Math.PI / 180;

// Paleta riso: pocas tintas, un poco desaturadas, como impresas.
const COLOR_BIOMA: Record<string, [number, number, number]> = {
  selva_tropical: [62, 128, 74], bosque_subtropical: [104, 148, 82], bosque_templado: [82, 124, 78],
  boreal: [60, 96, 80], turbera: [120, 98, 70], pastizal: [196, 172, 96], desierto: [228, 196, 138],
  'montaña': [150, 136, 120], cultivo: [222, 182, 80], ciudad: [210, 108, 74], rio: [74, 150, 168],
  costa: [134, 182, 136], oceano_costero: [76, 146, 160], oceano: [44, 96, 128], hielo: [246, 240, 226],
};
const TINTA = '#25211c';

export const SPRITE_CATEGORIA: Record<string, string> = {
  movilidad: 'movilidad', edificios: 'edificios', comida_y_tierra: 'comida_y_tierra', energia: 'energia',
  naturaleza: 'naturaleza', industria_y_residuos: 'industria_y_residuos', remocion_tecnologica: 'remocion_tecnologica',
  geoingenieria: 'geoingenieria',
};

export class Planeta {
  lon0 = -74;
  lat0 = 8;
  private vel = 0.03;
  private meta: { lon: number; lat: number } | null = null;
  private arrastrando = false;
  private ultimo: { x: number; y: number } | null = null;
  private movido = 0;
  private bajo: HTMLCanvasElement;
  private bctx: CanvasRenderingContext2D;
  private ctx: CanvasRenderingContext2D;
  seleccion: string | null = null;
  zoom = 1;
  private dedos = new Map<number, { x: number; y: number }>();
  private distPellizco = 0;
  resaltar = new Set<string>();
  onTocar: (id: string | null) => void = () => {};
  onAnimal: (id: string) => void = () => {};
  private posAnimales = new Map<string, { x: number; y: number }>();
  private t = 0;

  constructor(private canvas: HTMLCanvasElement, private estado: () => Estado | null) {
    this.ctx = canvas.getContext('2d')!;
    this.bajo = document.createElement('canvas');
    this.bctx = this.bajo.getContext('2d')!;
    canvas.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      this.zoom = Math.max(1, Math.min(4, this.zoom * (ev.deltaY < 0 ? 1.12 : 1 / 1.12)));
    }, { passive: false });
    canvas.addEventListener('pointerdown', (ev) => {
      this.dedos.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (this.dedos.size === 2) {
        const [a, b] = [...this.dedos.values()];
        this.distPellizco = Math.hypot(a.x - b.x, a.y - b.y);
        this.movido = 99; // un pellizco nunca es un toque
      }
      this.arrastrando = true; this.movido = 0; this.meta = null; this.ultimo = { x: ev.clientX, y: ev.clientY };
      canvas.setPointerCapture(ev.pointerId);
    });
    canvas.addEventListener('pointermove', (ev) => {
      if (this.dedos.has(ev.pointerId)) this.dedos.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (this.dedos.size === 2) {
        const [a, b] = [...this.dedos.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.distPellizco > 0) this.zoom = Math.max(1, Math.min(4, this.zoom * (d / this.distPellizco)));
        this.distPellizco = d;
        return;
      }
      if (!this.arrastrando || !this.ultimo) return;
      const dx = ev.clientX - this.ultimo.x, dy = ev.clientY - this.ultimo.y;
      this.movido += Math.abs(dx) + Math.abs(dy);
      const k = 160 / this.radio();
      this.lon0 -= dx * k; this.lat0 = Math.max(-75, Math.min(75, this.lat0 + dy * k));
      this.vel = -dx * k * 0.3;
      this.ultimo = { x: ev.clientX, y: ev.clientY };
    });
    canvas.addEventListener('pointerup', (ev) => {
      this.dedos.delete(ev.pointerId);
      if (this.dedos.size === 1) { const [p] = [...this.dedos.values()]; this.ultimo = { x: p.x, y: p.y }; return; }
      if (!this.arrastrando) return;
      this.arrastrando = false;
      if (this.movido < 8) {
        const r = canvas.getBoundingClientRect();
        const px = ev.clientX - r.left, py = ev.clientY - r.top;
        for (const [aid, p] of this.posAnimales) {
          if (Math.hypot(p.x - px, p.y - py) < 16) { this.onAnimal(aid); return; }
        }
        const id = this.celdaEn(px, py);
        this.seleccion = id;
        this.vel = 0;
        this.onTocar(id);
      }
    });
    canvas.addEventListener('pointercancel', (ev) => { this.dedos.delete(ev.pointerId); this.arrastrando = false; });
    const loop = () => { requestAnimationFrame(loop); try { this.dibujar(); } catch (err) { console.error(err); } };
    requestAnimationFrame(loop);
  }

  /** El planeta ocupa el hueco entre la barra de arriba y el cajón de abajo. */
  portada = false;
  private centro(): { x: number; y: number; R: number } {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (this.portada) {
      const R = Math.min(w * 0.3, h * 0.15, 150);
      return { x: w / 2 + R * 0.55, y: R + 28, R };
    }
    const arriba = 118, abajo = Math.min(300, h * 0.36);
    const alto = h - arriba - abajo;
    return { x: w / 2, y: arriba + alto / 2, R: Math.max(80, Math.min(w * 0.44, alto * 0.48)) * this.zoom };
  }
  private radio() { return this.centro().R; }

  private proyectar(lat: number, lng: number, R: number): [number, number, number] {
    const f = lat * RAD, l = (lng - this.lon0) * RAD, f0 = this.lat0 * RAD;
    const cosc = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l);
    return [R * Math.cos(f) * Math.sin(l), -R * (Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l)), cosc];
  }

  /** Gira suavemente hasta dejar la celda de frente. */
  centrarEn(id: string) {
    const c = CELDA_POR_ID.get(id);
    if (!c) return;
    let lon = c.lng;
    while (lon - this.lon0 > 180) lon -= 360;
    while (lon - this.lon0 < -180) lon += 360;
    this.meta = { lon, lat: Math.max(-55, Math.min(55, c.lat)) };
    this.vel = 0;
  }

  /** Posición en pantalla (px CSS) de una celda, o null si está detrás. */
  posicion(id: string): { x: number; y: number } | null {
    const c = CELDA_POR_ID.get(id);
    if (!c) return null;
    const { x, y, R } = this.centro();
    const [px, py, cc] = this.proyectar(c.lat, c.lng, R);
    return cc > 0.1 ? { x: x + px, y: y + py } : null;
  }

  celdaEn(x: number, y: number): string | null {
    const { x: cx, y: cy, R } = this.centro();
    const px = (x - cx) / R, py = -(y - cy) / R;
    const rho = Math.hypot(px, py);
    if (rho > 1) return null;
    const c = Math.asin(rho), f0 = this.lat0 * RAD;
    const lat = rho === 0 ? f0 : Math.asin(Math.cos(c) * Math.sin(f0) + (py * Math.sin(c) * Math.cos(f0)) / rho);
    const lng = this.lon0 * RAD + Math.atan2(px * Math.sin(c), rho * Math.cos(c) * Math.cos(f0) - py * Math.sin(c) * Math.sin(f0));
    let mejor: Celda | null = null, dmin = Infinity;
    for (const k of CELDAS) {
      const d = Math.acos(Math.min(1, Math.sin(lat) * Math.sin(k.lat * RAD) + Math.cos(lat) * Math.cos(k.lat * RAD) * Math.cos(lng - k.lng * RAD)));
      if (d < dmin) { dmin = d; mejor = k; }
    }
    return mejor?.id ?? null;
  }

  private dibujar() {
    this.t++;
    const e = this.estado();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (w < 10 || h < 10) return;
    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    }
    const ESC = 3;
    const bw = Math.ceil(w / ESC), bh = Math.ceil(h / ESC);
    if (this.bajo.width !== bw || this.bajo.height !== bh) { this.bajo.width = bw; this.bajo.height = bh; }
    if (this.meta) {
      this.lon0 += (this.meta.lon - this.lon0) * 0.12; this.lat0 += (this.meta.lat - this.lat0) * 0.12;
      if (Math.abs(this.meta.lon - this.lon0) < 0.2 && Math.abs(this.meta.lat - this.lat0) < 0.2) this.meta = null;
    } else if (!this.arrastrando) {
      this.lon0 += this.vel; this.vel = this.vel * 0.95 + (this.seleccion ? 0 : 0.03) * 0.05;
    }

    const { x: CX, y: CY, R: RR } = this.centro();
    const b = this.bctx;
    b.clearRect(0, 0, bw, bh);
    const R = RR / ESC, cx = CX / ESC, cy = CY / ESC;
    const calor = e ? Math.max(0, Math.min(1, (e.temperatura - 1.2) / 1.5)) : 0.1;
    const vida = e ? e.vida / 100 : 0.6;
    const degradadas = new Set(e?.degradadas ?? []);

    // Sombra dura del planeta sobre el papel (como un sello desplazado).
    b.fillStyle = 'rgba(37,33,28,0.18)';
    b.beginPath(); b.arc(cx + 3, cy + 3, R + 1, 0, Math.PI * 2); b.fill();

    const pulso = (Math.sin(this.t * 0.12) + 1) / 2;
    for (const c of CELDAS) {
      const [, , cc] = this.proyectar(c.lat, c.lng, R);
      if (cc < 0.0) continue;
      let [r, g, bl] = COLOR_BIOMA[c.bioma] ?? [128, 128, 128];
      const tierra = c.bioma !== 'oceano' && c.bioma !== 'oceano_costero' && c.bioma !== 'hielo';
      if (tierra) {
        const seco = calor * 0.55 + (1 - vida) * 0.35 + (degradadas.has(c.id) ? 0.22 : 0);
        r += (176 - r) * seco; g += (112 - g) * seco; bl += (62 - bl) * seco;
      }
      if (this.resaltar.has(c.id)) { r += (255 - r) * pulso * 0.6; g += (236 - g) * pulso * 0.6; bl += (150 - bl) * pulso * 0.6; }
      b.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(bl)})`;
      b.beginPath();
      c.contorno.forEach(([la, lo], i) => {
        const [x, y] = this.proyectar(la, lo, R);
        i ? b.lineTo(cx + x, cy + y) : b.moveTo(cx + x, cy + y);
      });
      b.closePath(); b.fill();
    }
    // Tramado del lado de noche (luz desde arriba a la izquierda), píxel a píxel.
    b.fillStyle = 'rgba(37,33,28,0.55)';
    const lx = -0.55, ly = -0.6, lz = 0.58;
    for (let py = Math.max(0, Math.floor(cy - R)); py <= Math.min(bh, cy + R); py++) {
      for (let px = Math.max(0, Math.floor(cx - R)); px <= Math.min(bw, cx + R); px++) {
        const nx = (px - cx) / R, ny = (py - cy) / R, n2 = nx * nx + ny * ny;
        if (n2 > 1) continue;
        const luz = nx * lx + ny * ly + Math.sqrt(1 - n2) * lz;
        if (luz < -0.15 || (luz < 0.12 && (px + py) % 2 === 0) || (luz < 0.3 && px % 2 === 0 && py % 2 === 0)) b.fillRect(px, py, 1, 1);
      }
    }
    // Contorno de tinta.
    b.strokeStyle = TINTA; b.lineWidth = 1;
    b.beginPath(); b.arc(cx, cy, R + 0.5, 0, Math.PI * 2); b.stroke();
    // Selección: contorno de la celda en tinta.
    if (this.seleccion) {
      const c = CELDA_POR_ID.get(this.seleccion);
      if (c && this.proyectar(c.lat, c.lng, R)[2] > 0) {
        b.strokeStyle = '#fafaf0'; b.lineWidth = 1;
        b.beginPath();
        c.contorno.forEach(([la, lo], i) => { const [x, y] = this.proyectar(la, lo, R); i ? b.lineTo(cx + x, cy + y) : b.moveTo(cx + x, cy + y); });
        b.closePath(); b.stroke();
      }
    }
    // Fauna migratoria (easter eggs): siguen rutas reales de ida y vuelta. Con más Vida, hay más.
    this.posAnimales.clear();
    if (!this.portada) {
      const visibles = Math.max(2, Math.round(FAUNA.length * Math.min(1, vida + 0.2)));
      FAUNA.slice(0, visibles).forEach((a, n) => {
        const L = a.ruta.length - 1;
        const fase = (this.t * a.velocidad + n * 0.37) % (2 * L);
        const u = fase <= L ? fase : 2 * L - fase;
        const i0 = Math.min(L - 1, Math.floor(u)), f = u - i0;
        const [la0, lo0] = a.ruta[i0], [la1, lo1] = a.ruta[i0 + 1];
        let dlo = lo1 - lo0; if (dlo > 180) dlo -= 360; if (dlo < -180) dlo += 360;
        const [x, y, cc] = this.proyectar(la0 + (la1 - la0) * f, lo0 + dlo * f, R);
        if (cc < 0.1) return;
        const ax = Math.round(cx + x), ay = Math.round(cy + y);
        b.fillStyle = TINTA;
        if (a.tipo === 'ave') {
          const ala = (this.t >> 3) % 2;
          b.fillRect(ax - 2, ay - 1 + ala, 1, 1); b.fillRect(ax + 2, ay - 1 + ala, 1, 1);
          b.fillStyle = a.color; b.fillRect(ax - 1, ay, 3, 1); b.fillRect(ax, ay - 1, 1, 1);
        } else if (a.tipo === 'mariposa') {
          const ala = (this.t >> 2) % 2;
          b.fillStyle = a.color; b.fillRect(ax - 1 - ala, ay - 1, 1 + ala, 2); b.fillRect(ax + 1, ay - 1, 1 + ala, 2);
          b.fillStyle = TINTA; b.fillRect(ax, ay - 1, 1, 2);
        } else if (a.tipo === 'ballena') {
          b.fillRect(ax - 3, ay, 6, 2); b.fillRect(ax + 3, ay - 1, 1, 1); b.fillRect(ax + 3, ay + 2, 1, 1);
          b.fillStyle = a.color; b.fillRect(ax - 2, ay, 4, 1);
          if ((this.t >> 5) % 3 === 0) { b.fillStyle = '#fafaf0'; b.fillRect(ax - 2, ay - 2, 1, 1); b.fillRect(ax - 3, ay - 3, 1, 1); b.fillRect(ax - 1, ay - 3, 1, 1); }
        } else {
          b.fillStyle = a.color; b.fillRect(ax - 1, ay - 1, 3, 2); b.fillStyle = TINTA; b.fillRect(ax + 2, ay - 1, 1, 1);
        }
        this.posAnimales.set(a.id, { x: CX + x * ESC, y: CY + y * ESC });
      });
    }

    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.bajo, 0, 0, bw * ESC * dpr, bh * ESC * dpr);

    if (!e) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    for (const [cid, ed] of Object.entries(e.edificios)) {
      const c = CELDA_POR_ID.get(cid)!;
      const [x, y, cc] = this.proyectar(c.lat, c.lng, RR);
      if (cc < 0.2) continue;
      const s = SOL_POR_ID.get(ed.sol)!;
      const img = imagen(e.reveladas.includes(ed.sol) ? 'trampa' : SPRITE_CATEGORIA[s.categoria_juego] ?? 'trampa');
      const tam = Math.round(14 + 6 * cc);
      ctx.fillStyle = '#fafaf0';
      ctx.fillRect(Math.round(CX + x - tam / 2 - 2), Math.round(CY + y - tam / 2 - 2), tam + 4, tam + 4);
      ctx.strokeStyle = TINTA; ctx.lineWidth = 1.5;
      ctx.strokeRect(Math.round(CX + x - tam / 2 - 2), Math.round(CY + y - tam / 2 - 2), tam + 4, tam + 4);
      if (img.complete) ctx.drawImage(img, Math.round(CX + x - tam / 2), Math.round(CY + y - tam / 2), tam, tam);
      ctx.fillStyle = TINTA;
      for (let i = 0; i < ed.nivel; i++) ctx.fillRect(Math.round(CX + x - tam / 2 + i * 4), Math.round(CY + y + tam / 2 + 4), 3, 3);
    }
  }
}
