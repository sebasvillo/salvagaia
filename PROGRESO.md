# Progreso

- **7 nov 2026:** diseño v1, datos v0 de las 166 soluciones y prompts.
- **20 nov 2026: MVP jugable** → https://sebasvillo.github.io/salvagaia/
  - Planeta de 842 hexágonos H3 en pixel-art, que gira con el dedo; biomas y regiones aproximados.
  - Arranca con la era 1, más solar en techos, eólica en tierra, biochar, restaurar bosque tropical y 6 trampas. El resto de la era 2 se desbloquea en 2031, o antes si construyes 12 niveles.
  - Clima con TCRE y metano aparte; Vida y Esperanza; trampas que se revelan; eventos; 3 puntos de inflexión; 5 políticas pagadas con Esperanza; puntaje integrado con récord local; español e inglés; partida guardada en el navegador.
  - 15 tests (`npm test`). Balance con bots (`npm run balance`): el bot sensato gana entre 2053 y 2059 en las tres dificultades; el que solo usa trampas pierde por Vida hacia 2030 y el que no hace nada pierde hacia 2050-2060.
  - Cada push a `main` se publica solo (GitHub Actions → Pages).

- **21 nov 2026: rediseño, guía y tabla compartida.**
  - Dirección visual nueva: página de cuaderno cuadriculado impresa en riso. Íconos pixel-art propios en vez de emojis, tinta y sombras duras, sin degradados ni vidrio, tramado en el lado de noche del planeta. Se basa en guías anti "AI slop" (una sola referencia fuerte, nada de defaults).
  - **Guía de Ceiba** (nombre provisional) en 11 pasos, que enseña de a una cosa: temperatura, Gt, la meta, Vida y Esperanza, tocar una ciudad, qué es Project Drawdown, recursos, pasar el año y mejorar. Después salen avisos de contexto una sola vez (primera trampa, era 2, desastres, Esperanza baja, emisiones negativas…). Tocar cualquier medidor lo explica. Hay glosario ("¿Qué es todo esto?") y un botón para repetir la guía.
  - Las fichas dicen "Evita hasta X Gt al año" y muestran el objeto concreto ("Techo solar comunitario").
  - **Tabla de mundos compartida:** artifact de Claude con base de datos → https://claude.ai/artifact/Gp976b6GhFK42sfux2JvBb. Cada jugador guarda solo su mejor puntaje, en un documento con su id, y nadie puede escribir el de otro. La versión de GitHub Pages guarda la tabla en el dispositivo y enlaza a la compartida. Build: `npm run build:artifact`.

- **21 nov 2026 (tarde): ronda de cambios de Sebas.**
  - Portada: lema nuevo sin fondo, "Nombre del mundo" (el nombre es la semilla), **varios mundos guardados a la vez**, con lista para jugar o borrar. Se guardan en el navegador (localStorage).
  - "Cómo se juega" con íconos: meta, GEI y Gt, turnos, recursos, Vida, Esperanza, trampas sin decir cuáles, políticas, Drawdown y qué significa cada color.
  - Ficha "i" en cada solución, contada por Ceiba: la frase de la ficha del cuaderno (117 fichas, `tools/fichas.py`), los números de Drawdown, la evaluación sí/no cuando no hay número, quién lo hace, link a Drawdown y lo que hace en tu mundo. Nunca dice "trampa".
  - Recursos tipo Catan: cada terreno produce algo (bosques y cultivos dan materiales; desiertos, pastos y mar, energía), más con el nivel. Comercio 3 por 1, o 2 por 1 con puerto en la costa.
  - La tarjeta del año explica por qué cambiaron la Vida y la Esperanza, cuánto produjeron tus edificios, y trae un comentario de Ceiba.
  - Barra de arriba: temperatura y emisiones en grande, con cuánto subieron o bajaron; los recursos, compactos. Íconos de 12×12 y una Ceiba de 16×16.
  - Arranque en 1,5 °C; tutorial que enseña GEI. Se distingue "en tu mundo" de "en el mundo real".
  - Fauna migratoria (aguja colipinta, charrán ártico, golondrina, monarca, ballena jorobada, tortuga laúd): al tocarla, Ceiba cuenta su ruta. `data/fauna.json`.
  - Sugerencia tras 60 s quieto (como Polytopia): resalta una casilla, un edificio, el comercio o "Pasar el año".
  - CDR marino: alcalinizar el océano, captura electroquímica, cultivo de algas y meteorización mejorada entran en la era 2. Resumen de The State of CDR en `data/cdr/STATE_OF_CDR.md`.
  - `ESTRATEGIA.md`: cómo gana el bot y qué revela del balance.

## Lo que falta
- Scoreboard público de verdad (sin cuenta de Claude): Cloudflare D1 o Supabase, con tu cuenta.
- Biomas reales (WWF) y macrocuencas (HydroBASINS); las eras 3 a 5.
- Calibrar Vida y Esperanza con Regeneration Nexus.
- El guía hippie, la música, la fauna (ahora solo hay aves), animaciones entre años y un tutorial.
- Comparar `soluciones.json` contra el CSV oficial de Drawdown.

## Preguntas para Sebas
0. **Balance:** las soluciones de comida y tierra están demasiado baratas (ver `ESTRATEGIA.md`). ¿Las encarecemos?
0b. **Mundos en varios dispositivos:** hoy viven en el navegador. En la versión de claude.ai se podrían guardar en tu espacio privado de la base de datos del artifact y verse desde cualquier dispositivo. ¿Lo hacemos?
1. **El pico se queda bajo** (~1,4 °C) si juegas bien, porque cortar metano enfría rápido. Es bastante honesto (el AR6 lo dice), pero hay poco drama. ¿Lo dejamos así o subimos la inercia?
2. **Victoria:** hoy pide 10 años bajando **con emisiones netas negativas**. ¿Te parece la definición correcta de "revertir"?
3. **Las políticas** (cerrar el carbón y compañía) son invento mío para que la industria y el transporte se puedan bajar con la era 1-2. ¿Te gustan?
5. **Ceiba:** ¿te gusta como guía? ¿Nombre y diseño?
6. **Tabla compartida:** para escribir en ella, tus amigos necesitan acceso de colaborador al artifact; con acceso de solo lectura ven la tabla pero no aparecen.
4. Las ciudades del mapa son pocas (47 casillas) y casi todas las soluciones de edificios y transporte van ahí. ¿Más ciudades, o varias soluciones por casilla?
