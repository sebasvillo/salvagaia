# SalvaGaia · MVP del 20 nov 2026

Decisiones de Sebas (20 nov):
- **Nombre:** SalvaGaia.
- **Indicador ✊:** se llama **Esperanza**.
- **Alcance:** loop completo con las soluciones de la **era 1** (unas 25, con 3-4 trampas). Sin scoreboard compartido todavía (puntaje local).
- **Dónde vive:** repo público en GitHub, publicado en **GitHub Pages**, jugable desde el celular.

## Qué tiene que traer
1. Pantalla de inicio: nombre, dificultad (fácil, medio, difícil), semilla (aleatoria o escrita), idioma es/en.
2. Planeta de hexágonos que gira con el dedo o el mouse (H3 resolución 1 o una aproximación propia si h3-js complica el build). Biomas aproximados por latitud y continente, con un `TODO` para HydroBASINS y WWF.
3. Barra superior: año, °C, GtCO₂e/año, ⚡, ⛏, barras de Esperanza y Vida.
4. Cajón inferior con las soluciones de la era 1 compatibles con la celda tocada. Tocar para construir, tocar el edificio para subir de nivel (1-5).
5. Botón "Siguiente año" → tarjeta de resumen (estilo BitLife): emisiones, temperatura, recursos, eventos, trampas reveladas y un dato real.
6. Clima: TCRE por dificultad (0,35 / 0,45 / 0,60 °C por 1.000 GtCO₂), arranque 2026 con ~55 GtCO₂e/año (#por-verificar), cero neto = se estabiliza, negativo = baja despacio, sumideros que dependen de Vida y temperatura.
7. Trampas con efectos ocultos que se revelan con los años.
8. Eventos de la Tierra (huracán, sequía, incendio, inundación, terremoto) con probabilidad que sube con la temperatura.
9. Ganar: la temperatura llega al pico y baja 10 años seguidos. Perder: Vida o Esperanza en 0, o más de +3 °C.
10. Puntaje integrado (DISENO.md §10) y récord local.
11. **Feo pero jugable.** Paleta solarpunk básica; la estética fina viene después.

## Reglas
Las de `CLAUDE.md`: TS + Vite, `src/sim` puro y testeado con semilla, textos en `src/i18n`, supuestos marcados con `// SUPUESTO:` y anotados en `data/supuestos.md`. Al terminar, actualizar `PROGRESO.md` con el link jugable y las preguntas para Sebas.
