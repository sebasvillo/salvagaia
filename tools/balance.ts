// Corre partidas automáticas y muestra cómo terminan. Uso: npm run balance
import { ESTILOS, simular } from '../src/sim/bot';
import { puntaje } from '../src/sim/juego';
import type { Dificultad } from '../src/sim/datos';

for (const dif of ['facil', 'medio', 'dificil'] as Dificultad[]) {
  for (const estilo of ESTILOS) {
    const fines: Record<string, number> = {};
    const anios: number[] = [];
    let tp = 0, pts = 0;
    const N = 6;
    for (let i = 0; i < N; i++) {
      const e = simular('s' + i, dif, estilo);
      fines[e.fin ?? 'sigue'] = (fines[e.fin ?? 'sigue'] ?? 0) + 1;
      anios.push(e.anio); tp += e.tPico; pts += puntaje(e).total;
    }
    anios.sort((a, b) => a - b);
    console.log(dif.padEnd(8), estilo.padEnd(8), JSON.stringify(fines), 'año mediano', anios[N >> 1], 'pico', (tp / N).toFixed(2), 'pts', Math.round(pts / N));
  }
}
