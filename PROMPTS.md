# Prompts para arrancar en Claude Code

Abre Claude Code **en esta carpeta** (`Solarpunk/juego-gaia/`), para que lea `CLAUDE.md`. Pega los prompts en orden; cada uno es una sesión corta. Antes de pasar al siguiente, revisa que el anterior funcione.

---

### Prompt 1 · Esqueleto y datos
```
Lee CLAUDE.md, DISENO.md y data/README_datos.md. Arma el proyecto: TypeScript + Vite, con las carpetas src/sim, src/ui, src/i18n, tests con Vitest y git init. Escribe en src/sim/datos.ts un cargador tipado de data/soluciones.json, con una interfaz Solucion que siga exactamente los campos del JSON, y un test que verifique que hay 166 soluciones, que cada una tiene era, biomas y costo, y que las 14 "no_recomendada" tienen es_trampa=true. No hagas interfaz todavía. Al final actualiza PROGRESO.md.
```

### Prompt 2 · El modelo climático mínimo
```
En src/sim/clima.ts implementa el modelo climático de DISENO.md sección 7: emisiones anuales → acumuladas → temperatura con TCRE (parámetro por dificultad: 0.35/0.45/0.60 °C por 1000 GtCO2), forzamiento no-CO2 simplificado, compromiso de emisiones cero ≈ 0 y sumideros naturales que dependen de Vida y temperatura. Todo determinista con semilla. Tests: (1) con emisiones constantes la temperatura sube; (2) con emisiones netas 0 la temperatura se estabiliza; (3) con emisiones negativas baja. Marca cada supuesto con // SUPUESTO: y anótalo en data/supuestos.md.
```

### Prompt 3 · El planeta de celdas
```
Genera el planeta: celdas H3 de resolución 1 con h3-js. Escribe tools/preparar_mapa.ts, que asigna a cada celda un bioma del juego (DISENO.md sección 4) y una macrocuenca. Como todavía no tenemos HydroBASINS ni los biomas WWF, usa una aproximación por latitud y continentes y deja un TODO claro para reemplazarla con los datos reales. Guarda el resultado en data/mapa_h3_r1.json. Agrega la semilla, que perturba el estado inicial (degradación, densidad urbana) sin cambiar la geografía.
```

### Prompt 4 · El turno (estilo BitLife) y los indicadores
```
En src/sim/turno.ts implementa un año completo: aplicar construcciones (costos de Energía y Materiales; si Comunidad está alta, construir es más rápido y barato), adopción en curva S por solución y región, producción de recursos con tope, efectos en Vida y Comunidad, revelación gradual de los efectos ocultos de las trampas, eventos aleatorios (huracanes, terremotos, sequías, incendios, inundaciones; probabilidad según temperatura, daño mitigado por Vida), puntos de inflexión con umbrales por dificultad y condiciones de victoria y derrota (DISENO.md secciones 5 a 9). Devuelve un objeto ResumenDelAño. Tests para victoria, derrota por Vida = 0, derrota por Comunidad = 0 y el choque de terminación de los aerosoles.
```

### Prompt 5 · La primera interfaz jugable
```
Haz la primera interfaz: el planeta pixel-art que gira con mouse o dedo, una barra superior con el año, la temperatura, las emisiones, ⚡ ⛏ y las barras de Comunidad y Vida, un cajón inferior con las soluciones desbloqueadas filtradas por la celda seleccionada, arrastrar para construir, tocar para mejorar (niveles 1-5) y el botón "Siguiente año", que muestra la tarjeta del resumen. Textos en es/en con un selector de idioma. Pantalla inicial con la dificultad (fácil, medio, difícil). Que sea feo pero jugable; la estética viene después.
```

### Prompt 6 · El puntaje y el scoreboard
```
Implementa el puntaje integrado de DISENO.md sección 10 (rapidez, temperatura pico, Vida, Comunidad, justicia como Gini invertido entre cuencas y diversidad como índice de Shannon, por el multiplicador de dificultad). Guarda una "huella" de la partida (semilla, decisiones, top 5 de soluciones). Prepara un módulo scoreboard.ts con una interfaz común y dos implementaciones: (a) almacenamiento local para desarrollo y (b) un adaptador para la base de datos compartida de un artifact de Claude. Deja el (b) como esqueleto documentado; lo conectamos cuando publiquemos.
```

### Prompt 7 · Estética y guía
```
Pasa la interfaz a pixel-art solarpunk animado: paleta, celdas que cambian de color según su salud, fauna que aparece cuando sube Vida, transiciones suaves entre años. Agrega el guía (un hippie solarpunk) que aparece solo en el tutorial y en momentos clave, como la constructora de Clash of Clans, con sus textos en i18n. Agrega música ambient con un botón de silencio.
```

---

**Antes del prompt 3 conviene descargar** (yo no puedo hacerlo desde aquí):
- El CSV oficial del Drawdown Explorer (botón "Download CSV" en drawdown.org/explorer) → `data/drawdown_oficial.csv`, para comparar con `soluciones.json`.
- HydroBASINS (hydrosheds.org), niveles 2 y 3.
- Los biomas terrestres del WWF (Olson et al. 2001).
