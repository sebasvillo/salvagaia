# Progreso

- **7 nov 2026:** diseño v1, datos v0 de las 166 soluciones y prompts.
- **20 nov 2026: MVP jugable** → https://sebasvillo.github.io/salvagaia/
  - Planeta de 842 hexágonos H3 en pixel-art, que gira con el dedo; biomas y regiones aproximados.
  - Arranca con la era 1, más solar en techos, eólica en tierra, biochar, restaurar bosque tropical y 6 trampas. El resto de la era 2 se desbloquea en 2031, o antes si construyes 12 niveles.
  - Clima con TCRE y metano aparte; Vida y Esperanza; trampas que se revelan; eventos; 3 puntos de inflexión; 5 políticas pagadas con Esperanza; puntaje integrado con récord local; español e inglés; partida guardada en el navegador.
  - 15 tests (`npm test`). Balance con bots (`npm run balance`): el bot sensato gana entre 2053 y 2059 en las tres dificultades; el que solo usa trampas pierde por Vida hacia 2030 y el que no hace nada pierde hacia 2050-2060.
  - Cada push a `main` se publica solo (GitHub Actions → Pages).

## Lo que falta
- Scoreboard compartido (artifact de Claude con base de datos, o Cloudflare D1).
- Biomas reales (WWF) y macrocuencas (HydroBASINS); las eras 3 a 5.
- Calibrar Vida y Esperanza con Regeneration Nexus.
- El guía hippie, la música, la fauna (ahora solo hay aves), animaciones entre años y un tutorial.
- Comparar `soluciones.json` contra el CSV oficial de Drawdown.

## Preguntas para Sebas
1. **El pico se queda bajo** (~1,4 °C) si juegas bien, porque cortar metano enfría rápido. Es bastante honesto (el AR6 lo dice), pero hay poco drama. ¿Lo dejamos así o subimos la inercia?
2. **Victoria:** hoy pide 10 años bajando **con emisiones netas negativas**. ¿Te parece la definición correcta de "revertir"?
3. **Las políticas** (cerrar el carbón y compañía) son invento mío para que la industria y el transporte se puedan bajar con la era 1-2. ¿Te gustan?
4. Las ciudades del mapa son pocas (47 casillas) y casi todas las soluciones de edificios y transporte van ahí. ¿Más ciudades, o varias soluciones por casilla?
