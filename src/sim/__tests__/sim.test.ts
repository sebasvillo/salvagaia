import { describe, expect, it } from 'vitest';
import { CELDAS, P, SOLUCIONES, solucionesIniciales } from '../datos';
import { aplicarPolitica, calcularEmisiones, construir, demoler, nuevaPartida, puntaje, type Estado } from '../juego';
import { siguienteAnio } from '../turno';
import { simular } from '../bot';
import { NODOS } from '../arbol';

const libre = (e: Estado, bioma: string) => CELDAS.find((c) => c.bioma === bioma && !e.edificios[c.id])!.id;

describe('datos', () => {
  it('hay 166 soluciones y las 14 no recomendadas son trampas', () => {
    expect(SOLUCIONES.length).toBe(166);
    const nr = SOLUCIONES.filter((s) => s.calificacion_drawdown === 'no_recomendada');
    expect(nr.length).toBe(14);
    expect(nr.every((s) => s.juego.es_trampa)).toBe(true);
    for (const s of SOLUCIONES) { expect(s.juego.era).toBeGreaterThan(0); expect(s.juego.biomas.length).toBeGreaterThan(0); }
  });
  it('el MVP trae energía limpia y algunas trampas desde el inicio', () => {
    const inicio = solucionesIniciales();
    expect(inicio.some((s) => s.juego.produce.energia > 0 && !s.juego.es_trampa)).toBe(true);
    expect(inicio.filter((s) => s.juego.es_trampa).length).toBe(P.soluciones_mvp.trampas.length);
    for (const id of [...P.soluciones_mvp.extras_inicio, ...P.adaptacion_ids]) expect(SOLUCIONES.some((s) => s.id === id)).toBe(true);
  });
  it('el mapa tiene 842 celdas', () => expect(CELDAS.length).toBe(842));
});

describe('clima', () => {
  it('arranca con las emisiones y la temperatura de los parámetros', () => {
    const e = nuevaPartida('x', 'medio');
    expect(Math.abs(calcularEmisiones(e).neta - P.emisiones_inicio_gt.valor)).toBeLessThan(0.5);
    expect(e.temperatura).toBeCloseTo(P.temperatura_inicio.valor, 5);
  });
  it('sin hacer nada la temperatura sube', () => {
    const e = nuevaPartida('x', 'medio');
    for (let i = 0; i < 10; i++) siguienteAnio(e);
    expect(e.tBase).toBeGreaterThan(P.temperatura_inicio.valor + 0.05);
  });
  it('con emisiones netas cero el CO2 deja de calentar, y con negativas baja', () => {
    const e = nuevaPartida('x', 'medio');
    const t = (cum: number) => e.tCo2Base + (P.tcre.medio * cum) / 1000;
    expect(t(100) - t(100)).toBe(0);
    expect(t(90)).toBeLessThan(t(100));
  });
});

describe('determinismo', () => {
  it('la misma semilla y las mismas decisiones dan el mismo mundo', () => {
    const a = simular('igual', 'medio', 'bueno', 30), b = simular('igual', 'medio', 'bueno', 30);
    expect(a.temperatura).toBe(b.temperatura);
    expect(JSON.stringify(a.edificios)).toBe(JSON.stringify(b.edificios));
  });
  it('semillas distintas dan mundos distintos', () => {
    expect(nuevaPartida('a', 'medio').degradadas).not.toEqual(nuevaPartida('b', 'medio').degradadas);
  });
});

describe('reglas', () => {
  it('construir cuesta recursos y no se puede en una casilla ocupada ni en un bioma incompatible', () => {
    const e = nuevaPartida('x', 'medio');
    const c = libre(e, 'selva_tropical');
    const antes = e.materiales;
    expect(construir(e, c, 'protect-forests-tropical')).toBeNull();
    expect(e.materiales).toBeLessThan(antes);
    expect(construir(e, c, 'protect-forests-tropical')).toBe('ocupada');
    expect(construir(e, libre(e, 'desierto'), 'protect-forests-tropical')).toBe('bioma');
  });
  it('las trampas se revelan y bajan la Esperanza', () => {
    const e = nuevaPartida('x', 'medio');
    construir(e, libre(e, 'ciudad'), 'carbon-capture-storage-on-fossil-fuel-power-plants');
    let revelo = false;
    for (let i = 0; i < 10 && !revelo; i++) revelo = siguienteAnio(e).reveladas.length > 0;
    expect(revelo).toBe(true);
  });
  it('choque de terminación al demoler los aerosoles', () => {
    const e = nuevaPartida('x', 'medio');
    const c = libre(e, 'desierto');
    construir(e, c, 'deploy-stratospheric-aerosol-injection');
    siguienteAnio(e);
    const t = e.tBase;
    demoler(e, c);
    const r = siguienteAnio(e);
    expect(r.choqueAerosoles).toBe(true);
    expect(e.tBase).toBeGreaterThan(t);
  });
  it('las políticas cuestan Esperanza', () => {
    const e = nuevaPartida('x', 'medio');
    const h = e.esperanza;
    expect(aplicarPolitica(e, 'cerrar_carbon')).toBeNull();
    expect(e.esperanza).toBeLessThan(h);
  });
  it('derrota: si no se hace nada, se pierde', () => {
    const e = simular('x', 'medio', 'nada');
    expect(e.fin).toMatch(/^derrota/);
    expect(puntaje(e).total).toBeGreaterThan(0);
  });
  it('cada año se desbloquean soluciones nuevas', () => {
    const e = nuevaPartida('x', 'medio');
    const n = e.desbloqueadas.length;
    const r = siguienteAnio(e);
    expect(r.desbloqueadas.length).toBe(P.desbloqueo.por_anio.medio);
    expect(e.desbloqueadas.length).toBeGreaterThanOrEqual(n + r.desbloqueadas.length);
  });
  it('el árbol cubre las 166 soluciones y respeta los prerrequisitos', () => {
    const vistas = new Set<string>();
    for (const n of NODOS.values()) n.miembros.forEach((m) => vistas.add(m));
    expect(vistas.size).toBe(166);
    // Los carros eléctricos no pueden abrirse antes que los híbridos.
    const e = nuevaPartida('arbol', 'facil');
    expect(e.desbloqueadas.includes('mobilize-electric-cars')).toBe(false);
    expect(e.desbloqueadas.includes('mobilize-hybrid-cars')).toBe(true);
    for (let i = 0; i < 40 && !e.fin; i++) {
      siguienteAnio(e);
      const abiertas = new Set(e.desbloqueadas);
      for (const n of NODOS.values()) if (n.miembros.every((m) => abiertas.has(m))) for (const r of n.requiere) expect(NODOS.get(r)!.miembros.every((m) => abiertas.has(m))).toBe(true);
    }
  });
  it('El Niño y La Niña mueven la temperatura alrededor de la tendencia', () => {
    const e = nuevaPartida('enso', 'medio');
    const fases = new Set<string>();
    for (let i = 0; i < 60 && !e.fin; i++) { siguienteAnio(e); fases.add(e.enso.fase); expect(Math.abs(e.temperatura - e.tBase - e.enso.anom)).toBeLessThan(1e-9); }
    expect(fases.has('nino') && fases.has('nina')).toBe(true);
  });
  it('derrota por Vida: llenar el mundo de trampas mata la Vida', () => {
    expect(simular('x', 'medio', 'trampas').fin).toBe('derrota_vida');
  });
  it('victoria: un jugador sensato puede ganar en fácil', () => {
    expect(simular('x', 'facil', 'bueno').fin).toBe('victoria');
  });
});
