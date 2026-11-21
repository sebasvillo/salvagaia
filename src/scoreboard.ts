// El scoreboard: una interfaz y dos implementaciones.
// (a) Compartido: la base de datos del artifact de Claude (cuando el juego corre como artifact en claude.ai).
// (b) Local: el navegador (en GitHub Pages o si la base de datos no está disponible).

export interface Registro {
  apodo: string;
  puntaje: number;
  dificultad: string;
  semilla: string;
  anio: number;
  fin: string;
  pico: number;
  huella: string[];
  fecha: string;
}

export interface Fila extends Registro { yo: boolean }

export interface Scoreboard {
  tipo: 'compartido' | 'local';
  /** Puede escribir este jugador (en el compartido, si tiene permiso). */
  puedeEscribir: boolean;
  enviar(r: Registro): Promise<'ok' | 'peor' | 'sin_permiso' | 'error'>;
  top(n: number): Promise<Fila[]>;
}

const COLECCION = 'puntajes';

function limpiar(r: Registro): Registro {
  return {
    apodo: String(r.apodo).slice(0, 20), puntaje: Math.round(Number(r.puntaje) || 0), dificultad: String(r.dificultad),
    semilla: String(r.semilla).slice(0, 24), anio: Number(r.anio) || 0, fin: String(r.fin), pico: Number(r.pico) || 0,
    huella: (r.huella ?? []).slice(0, 5).map(String), fecha: String(r.fecha),
  };
}

// ---------- (b) Local ----------
function local(): Scoreboard {
  const leer = (): Registro[] => { try { return JSON.parse(localStorage.getItem('salvagaia:tabla') ?? '[]'); } catch { return []; } };
  return {
    tipo: 'local', puedeEscribir: true,
    async enviar(r) {
      const t = leer(); t.push(limpiar(r)); t.sort((a, b) => b.puntaje - a.puntaje);
      try { localStorage.setItem('salvagaia:tabla', JSON.stringify(t.slice(0, 20))); } catch { return 'error'; }
      return 'ok';
    },
    async top(n) { return leer().slice(0, n).map((r) => ({ ...r, yo: true })); },
  };
}

// ---------- (a) Compartido (artifact de Claude) ----------
async function compartido(): Promise<Scoreboard | null> {
  const w = window as any;
  if (!w.claude?.use) return null;
  const [db, user] = await Promise.all([w.claude.use('db'), w.claude.use('user')]);
  if (!db || !user) return null;
  const id: string | null = await user.id().catch(() => null);
  const escribe = (await user.can?.('data.write').catch(() => null)) ?? null;
  return {
    tipo: 'compartido',
    puedeEscribir: !!id && escribe !== false,
    async enviar(r) {
      if (!id) return 'sin_permiso';
      try {
        // Un documento por jugador (su id): guarda solo su mejor puntaje.
        const ref = db.collection(COLECCION).doc(id);
        const prev = await ref.get();
        if (prev.exists && Number(prev.data()?.puntaje ?? 0) >= r.puntaje) return 'peor';
        await ref.set(limpiar(r) as any);
        return 'ok';
      } catch (err: any) {
        return err?.code === 'not_granted' || err?.code === 'revoked' ? 'sin_permiso' : 'error';
      }
    },
    async top(n) {
      const snap = await db.collection(COLECCION).orderBy('puntaje', 'desc').limit(n).get();
      return snap.docs.map((d: any) => ({ ...(limpiar(d.data() as Registro)), yo: d.id === id }));
    },
  };
}

let promesa: Promise<Scoreboard> | null = null;
export function scoreboard(): Promise<Scoreboard> {
  if (!promesa) {
    promesa = Promise.race([
      compartido().catch(() => null),
      new Promise<null>((r) => setTimeout(() => r(null), 10000)),
    ]).then((s) => s ?? local());
  }
  return promesa;
}

/** El link al juego con scoreboard compartido (se llena al publicar el artifact). */
export const LINK_COMPARTIDO = 'https://claude.ai/artifact/Gp976b6GhFK42sfux2JvBb';
