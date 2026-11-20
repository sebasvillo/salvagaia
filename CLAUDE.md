# SalvaGaia · instrucciones para Claude Code

Juego de estrategia por turnos (un turno = un año) en un planeta pixel-art. Objetivo: revertir el cambio climático con las 166 soluciones de Project Drawdown. Diseño completo: `DISENO.md`. Datos: `data/`.

## Reglas del proyecto
- **Idiomas:** todo texto visible va en `src/i18n/es.json` y `src/i18n/en.json`. Nada de texto quemado en el código.
- **La ciencia manda:** cada número del modelo climático o de las soluciones viene de `data/` y cita su fuente. Si inventas un supuesto de juego, márcalo con `// SUPUESTO:` y agrégalo a `data/supuestos.md`.
- **Los datos de soluciones** se editan solo en `data/soluciones.json` (o se regeneran con `tools/gen_soluciones.py`). El código nunca tiene cifras de soluciones escritas a mano.
- **Simulación separada de la interfaz:** `src/sim/` es TypeScript puro, sin DOM, testeable y determinista con semilla (el mismo seed y las mismas decisiones dan el mismo resultado; así se validan los puntajes). `src/ui/` dibuja.
- **Tests:** cada regla de simulación nueva lleva su test en `src/sim/__tests__/`.
- **Rendimiento:** debe correr en un celular de gama media a 60 fps.
- **Estilo:** pixel-art, paleta solarpunk (verdes, dorados, turquesas, terracota). Sin sangre ni catastrofismo gráfico.

## Stack propuesto (cámbialo solo si Sebas lo aprueba)
- TypeScript + Vite.
- El planeta: canvas 2D con proyección ortográfica y una celda H3 por "píxel grande" (`h3-js`), o Three.js con un shader de pixelado si la esfera 2D se queda corta.
- La interfaz y los menús: HTML/CSS encima del canvas, o Phaser 3 si hace falta.
- **El scoreboard:** primero como **artifact de Claude** con base de datos compartida (para probar con amigos). Después, en sebasvillo.com con Cloudflare Pages + Workers + D1.
- Las tiendas, más adelante: Capacitor (Android/iOS).

## Comandos
- `npm run dev` · `npm test` · `npm run build`

## Al terminar cada tarea
Actualiza `PROGRESO.md` con lo hecho, lo que falta y las decisiones que necesitan a Sebas.
