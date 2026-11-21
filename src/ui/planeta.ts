// El planeta: proyección ortográfica de las celdas H3, dibujada a baja resolución y escalada sin suavizado (pixel-art).
import { CELDAS, CELDA_POR_ID, SOL_POR_ID, type Celda } from '../sim/datos';
import type { Estado } from '../sim/juego';

const RAD = Math.PI / 180;

const COLOR_BIOMA: Record<string, [number, number, number]> = {
  selva_tropical: [38, 140, 76], bosque_subtropical: [86, 156, 84], bosque_templado: [64, 128, 72],
  boreal: [46, 98, 74], turbera: [110, 92, 62], pastizal: [190, 178, 92], desierto: [222, 190, 128],
  'montaña': [140, 128, 118], cultivo: [214, 196, 84], ciudad: [226, 132, 92], rio: [70, 170, 200],
  costa: [120, 196, 150], oceano_costero: [52, 150, 172], oceano: [28, 92, 140], hielo: [236, 244, 246],
};

export const ICONO_CATEGORIA: Record<string, string> = {
  movilidad: '🚲', edificios: '🏠', comida_y_tierra: '🌾', energia: '☀️', naturaleza: '🌳',
  industria_y_residuos: '♻️', remocion_tecnologica: '🏭', geoingenieria: '🌫️',
};

export class Planeta {
  lon0 = -60;
  lat0 = 10;
  private vel = 0.04;
  private arrastrando = false;
  private ultimo: { x: number; y: number } | null = null;
  private movido = 0;
  private bajo: HTMLCanvasElement;
  private bctx: CanvasRenderingContext2D;
  private ctx: CanvasRenderingContext2D;
  seleccion: string | null = null;
  onTocar: (id: string | null) => void = () => {};
  private t = 0;

  constructor(private canvas: HTMLCanvasElement, private estado: () => Estado | null) {
    this.ctx = canvas.getContext('2d')!;
    this.bajo = document.createElement('canvas');
    this.bctx = this.bajo.getContext('2d')!;
    canvas.addEventListener('pointerdown', (ev) => {
      this.arrastrando = true; this.movido = 0; this.ultimo = { x: ev.clientX, y: ev.clientY };
      canvas.setPointerCapture(ev.pointerId);
    });
    canvas.addEventListener('pointermove', (ev) => {
      if (!this.arrastrando || !this.ultimo) return;
      const dx = ev.clientX - this.ultimo.x, dy = ev.clientY - this.ultimo.y;
      this.movido += Math.abs(dx) + Math.abs(dy);
      const k = 160 / this.radio();
      this.lon0 -= dx * k; this.lat0 = Math.max(-80, Math.min(80, this.lat0 + dy * k));
      this.vel = -dx * k * 0.3;
      this.ultimo = { x: ev.clientX, y: ev.clientY };
    });
    const soltar = (ev: PointerEvent) => {
      if (!this.arrastrando) return;
      this.arrastrando = false;
      if (this.movido < 8) {
        const r = canvas.getBoundingClientRect();
        const id = this.celdaEn(ev.clientX - r.left, ev.clientY - r.top);
        this.seleccion = id;
        this.vel = 0;
        this.onTocar(id);
      }
    };
    canvas.addEventListener('pointerup', soltar);
    canvas.addEventListener('pointercancel', () => (this.arrastrando = false));
    const loop = () => { requestAnimationFrame(loop); try { this.dibujar(); } catch (err) { console.error(err); } };
    requestAnimationFrame(loop);
  }

  private radio() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    return Math.min(w, h) * 0.44;
  }

  private proyectar(lat: number, lng: number, R: number): [number, number, number] {
    const f = lat * RAD, l = (lng - this.lon0) * RAD, f0 = this.lat0 * RAD;
    const cosc = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l);
    return [R * Math.cos(f) * Math.sin(l), -R * (Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l)), cosc];
  }

  centrarEn(id: string) {
    const c = CELDAS.find((x) => x.id === id);
    if (c) { this.lon0 = c.lng; this.lat0 = Math.max(-60, Math.min(60, c.lat)); this.vel = 0; }
  }

  celdaEn(x: number, y: number): string | null {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const R = this.radio();
    const px = (x - w / 2) / R, py = -(y - h / 2) / R;
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
    const ESC = 3; // tamaño del píxel grande
    const bw = Math.ceil(w / ESC), bh = Math.ceil(h / ESC);
    if (this.bajo.width !== bw || this.bajo.height !== bh) { this.bajo.width = bw; this.bajo.height = bh; }
    if (!this.arrastrando) { this.lon0 += this.vel; this.vel = this.vel * 0.96 + (this.seleccion ? 0 : 0.04) * 0.04; }

    const b = this.bctx;
    b.clearRect(0, 0, bw, bh);
    const R = this.radio() / ESC;
    const cx = bw / 2, cy = bh / 2;
    const calor = e ? Math.max(0, Math.min(1, (e.temperatura - 1.1) / 1.6)) : 0.2;
    const vida = e ? e.vida / 100 : 0.6;
    const degradadas = new Set(e?.degradadas ?? []);

    // Atmósfera: turquesa si está sano, naranja si se calienta.
    const halo = b.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.15);
    halo.addColorStop(0, `rgba(${Math.round(120 + 130 * calor)},${Math.round(220 - 100 * calor)},${Math.round(210 - 150 * calor)},0.55)`);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    b.fillStyle = halo; b.beginPath(); b.arc(cx, cy, R * 1.15, 0, Math.PI * 2); b.fill();

    for (const c of CELDAS) {
      const [, , cc] = this.proyectar(c.lat, c.lng, R);
      if (cc < 0.02) continue;
      let [r, g, bl] = COLOR_BIOMA[c.bioma] ?? [128, 128, 128];
      const tierra = c.bioma !== 'oceano' && c.bioma !== 'oceano_costero' && c.bioma !== 'hielo';
      if (tierra) {
        const seco = calor * 0.5 + (1 - vida) * 0.35 + (degradadas.has(c.id) ? 0.2 : 0);
        r = r + (170 - r) * seco; g = g + (110 - g) * seco; bl = bl + (60 - bl) * seco;
      }
      const luz = 0.55 + 0.45 * cc;
      b.fillStyle = `rgb(${Math.round(r * luz)},${Math.round(g * luz)},${Math.round(bl * luz)})`;
      b.beginPath();
      c.contorno.forEach(([la, lo], i) => {
        const [x, y] = this.proyectar(la, lo, R);
        i ? b.lineTo(cx + x, cy + y) : b.moveTo(cx + x, cy + y);
      });
      b.closePath(); b.fill();
      if (c.id === this.seleccion) { b.strokeStyle = '#fff6c8'; b.lineWidth = 1; b.stroke(); }
    }

    // Aves: aparecen cuando la Vida está alta.
    if (vida > 0.65) {
      b.fillStyle = '#fffbe8';
      const n = Math.round((vida - 0.65) * 30);
      for (let i = 0; i < n; i++) {
        const a = this.t * 0.01 + i * 2.1;
        b.fillRect(Math.round(cx + Math.cos(a) * R * (1.05 + (i % 3) * 0.04)), Math.round(cy + Math.sin(a * 1.3) * R * 0.7), 1, 1);
      }
    }

    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.bajo, 0, 0, bw * ESC * dpr, bh * ESC * dpr);

    // Edificios: íconos encima, a resolución normal.
    if (!e) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const Rr = this.radio();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [cid, ed] of Object.entries(e.edificios)) {
      const c = CELDA_POR_ID.get(cid)!;
      const [x, y, cc] = this.proyectar(c.lat, c.lng, Rr);
      if (cc < 0.25) continue;
      const s = SOL_POR_ID.get(ed.sol)!;
      const tam = 9 + 6 * cc;
      ctx.font = `${tam}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
      const icono = e.reveladas.includes(ed.sol) ? '⚠️' : ICONO_CATEGORIA[s.categoria_juego] ?? '•';
      ctx.fillText(icono, w / 2 + x, h / 2 + y);
      ctx.fillStyle = '#fff6c8';
      for (let i = 0; i < ed.nivel; i++) ctx.fillRect(w / 2 + x - 6 + i * 3, h / 2 + y + tam * 0.6, 2, 2);
    }
  }
}
