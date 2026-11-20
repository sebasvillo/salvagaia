# SalvaGaia · documento de diseño v1

> El juego lo ganas cuando reviertas el cambio climático… Es importante que el juego se pueda perder, y que haya dificultades… La idea es que el juego se sienta muy natural, simulado, y que el scoreboard sea muy variado, o sea, 2 personas no pueden tener el mismo mundo.
— Sebas, 7 nov 2026

**Qué cambió desde la v0** (`Cuaderno Solarpunk Obsidian/5 Rumbo/Planetica - diseño del juego… (v0).md`): todas tus respuestas del 7 nov están incorporadas abajo. Lo que sigue abierto va al final.

---

## 1. La idea en una frase
Un planeta pequeño, en pixel-art, que gira. Cada turno es un año. Pones, mueves y mejoras infraestructura de las **166 soluciones de Project Drawdown** sobre una cuadrícula fina de casillas, organizadas por **macrocuencas hidrográficas**, no por países. **No hay plata.** Ganas cuando la temperatura llega a su pico y baja diez años seguidos. Pierdes si la **Vida** o la **Comunidad** llegan a cero, o si el planeta pasa de +3 °C.

## 2. Pilares de diseño
1. **Simulado y natural.** Cada número sale de una fuente: Drawdown, IPCC, Regeneration Nexus, En-ROADS, los puntos de inflexión. Los supuestos de juego se marcan como supuestos.
2. **No hay acumulación.** Los recursos tienen tope; ahorrar no da puntos.
3. **Bucles, no villanos.** Los círculos virtuosos (aprendizaje, contagio social, ecosistemas que se recuperan) contra los viciosos (lock-in fósil, incendios, deshielo, trampas).
4. **Se puede perder.** Si construyes demasiados círculos viciosos, la Vida se acaba.
5. **Cada mundo es único.** La semilla del planeta, los eventos y tus decisiones hacen que dos partidas nunca coincidan.
6. **Profundo, pero ganable rápido.** La primera partida dura hasta 2 horas (con tutorial y desbloqueos lentos); un experto la gana en 20 minutos.

## 3. Los recursos y los indicadores
| | Nombre | Tipo | Cómo funciona |
|---|---|---|---|
| ⚡ | **Energía** | Recurso (stock con tope) | La producen la solar, la eólica, la geotermia, etc. Se gasta en construir y electrificar |
| ⛏ | **Materiales** | Recurso (stock con tope) | Salen de la minería (con costo de Vida) o del reciclaje y la economía circular (baratos a largo plazo) |
| ✊ | **Comunidad** *(nombre por decidir)* | **Indicador** (barra, como el hambre de Minecraft) | Si está alta, se construye más rápido y más barato. La suben las victorias visibles, la equidad entre cuencas y las soluciones de gente. La bajan los desastres sin atender, las trampas descubiertas y la injusticia. **En 0 pierdes** |
| 🌱 | **Vida** | **Indicador** (barra) | Biodiversidad. Es un multiplicador: con más Vida, los sumideros capturan más y los desastres pegan menos (**resiliencia**). **En 0 pierdes**: el planeta se muere |

**Nombres posibles para ✊:** Comunidad · Esperanza · Cohesión · Ánimo · Tejido. *(IA: "Comunidad" es el más claro; "Esperanza" el más poético.)*

## 4. El planeta
- **La cuadrícula:** hexágonos sobre la esfera, con la librería H3 de Uber. La resolución 1 da 842 celdas; la 2, unas 5.900. Propuesta: empezar con la resolución 1.
- **Las regiones son macrocuencas hidrográficas.** Se calculan con HydroBASINS (HydroSHEDS), nivel 2 o 3. Cada región tiene su población, sus emisiones de arranque y sus biomas.
- **Los biomas por celda:** los 14 biomas terrestres del WWF (Olson et al. 2001), más el océano y la costa, simplificados a los del juego: selva tropical, bosque subtropical, bosque templado, boreal, turbera, pastizal, desierto, montaña, cultivo, ciudad, río, costa, océano costero y océano.
- **La semilla:** cada partida arranca con una semilla que perturba el mapa (qué celdas están degradadas, dónde hay turberas, dónde hay ciudades más densas). **Dos jugadores nunca tienen el mismo mundo**, pero el mundo sigue siendo la Tierra.
- **La interfaz:** el planetica gira con el dedo o el mouse. Se arrastra una solución desde el cajón inferior a una celda compatible. Se puede mover después, con un pequeño costo, y mejorar por niveles.

## 5. Las soluciones (las 166 de Drawdown)
Están en `data/soluciones.json`. Cada una trae los datos de Drawdown (calificación, potencial en Gt/año y costo en US$/t) y su capa de juego:

| Campo de juego | Regla v0 (ajustable) |
|---|---|
| **Era** de desbloqueo (como los edificios de Clash of Clans) | 1: altamente recomendadas y baratas, más **las trampas** (son tentadoras desde el inicio) · 2: altamente recomendadas caras y las valiosas · 3: las "próximamente" y "en revisión" · 4: "seguir mirando" (tecnologías por investigar) · 5: fusión nuclear |
| **Biomas** compatibles | Según el nombre y el sector |
| **Costo** (⚡, ⛏) | Base según el potencial; más caro si cuesta más de US$100/t; más barato si ahorra plata |
| **Produce** | Las energías producen ⚡; el reciclaje y el compost producen ⛏ |
| **Efectos** en 🌱 y ✊ | Proteger y restaurar suben la Vida; la movilidad, la comida y lo comunitario suben la Comunidad. **Próximo paso: calibrarlos con las calificaciones de Regeneration Nexus** (justicia social, cultura, mujeres, biodiversidad y carbono) |
| **Niveles** | Del 1 al 5. **Maxear o diversificar** es la decisión central: una solución al nivel 5 rinde más, pero un portafolio diverso es más resiliente (el puntaje lo premia, sección 8) |
| **Adopción** | Curva en S: arranca lento, se acelera y se satura |

**Las trampas (14 "No recomendadas"):** baratas y rápidas, con un efecto aparente inmediato. Sus costos ocultos se revelan con los años: captura de carbono en térmicas, hidrógeno azul, etanol de maíz, granjas verticales, ganadería expandida, fertilización del océano, captura directa del aire, aerosoles estratosféricos, etc. Ejemplos: el lock-in fósil (cerrar se encarece), la Vida baja y la Comunidad cae cuando "se descubre". Los aerosoles enfrían rápido, pero si se suspenden hay un **choque de terminación**.

**Los círculos viciosos (cómo se pierde):**
- Deforestar para biocombustibles → baja la Vida → los sumideros se debilitan → más incendios → más emisiones.
- Lock-in fósil → la Comunidad se frustra → se construye más lento → más emisiones.
- Calor → desastres → se destruye infraestructura → menos ⚡ y ⛏.

## 6. El tiempo y el ritmo (estilo BitLife)
1. **La fase de construcción:** pones, mueves, mejoras e investigas.
2. **"Siguiente año":** se simula el año.
3. **El resumen del año:** una tarjeta con lo que pasó.
   - emisiones, temperatura, ⚡ ⛏ ✊ 🌱;
   - los eventos (un huracán en la cuenca del Caribe, un terremoto en los Andes);
   - las trampas que se revelaron;
   - un dato real ("en 2026, la solar ya…").
4. De vuelta a la construcción.

La partida arranca en 2026 y, como tope, termina en 2150.

## 7. El modelo climático (simple pero honesto)
- **Emisiones de arranque:** unas 55 GtCO₂e/año #por-verificar, con una tendencia que sube un poco.
- **Temperatura:** sigue a las emisiones acumuladas de CO₂ con la **TCRE** del IPCC AR6: unos 0,45 °C por cada 1.000 GtCO₂ (rango probable de 0,27 a 0,63). Los gases distintos del CO₂ van como un forzamiento aparte y simplificado.
- **Si las emisiones netas llegan a cero,** el calentamiento se detiene (el compromiso de emisiones cero es cercano a 0, según el AR6 y Rogelj). **Si son negativas, la temperatura baja despacio.** Eso es "revertir".
- **Los sumideros naturales** dependen de la Vida y de la temperatura: con calor y poca Vida, capturan menos.
- **Mejora futura:** reemplazar la regla lineal por un modelo de dos cajas calibrado con FaIR (Smith et al. 2018), un modelo climático simple de código abierto. La referencia de comportamiento es En-ROADS (Climate Interactive): lo que hace el juego es En-ROADS con mapa y gamificación.
- **Los puntos de inflexión** (Armstrong McKay et al. 2022, *Science* #por-verificar los umbrales exactos), cada uno con un umbral y un efecto irreversible:
  - Arrecifes de coral tropicales (~1,5 °C): baja la Vida en las costas.
  - Deshielo abrupto del permafrost boreal (~1,5 °C): emisiones extra que no se pueden apagar.
  - Groenlandia y la Antártida Occidental (~1,5 °C): suben los mares y se pierden celdas costeras.
  - Sabanización de la Amazonía (~3,5 °C, o antes con deforestación): las selvas pasan a pastizales.
  - Colapso de la circulación del Atlántico (AMOC, ~4 °C).

## 8. Eventos aleatorios
Solo eventos de la Tierra: **huracanes, terremotos, sequías, incendios, inundaciones, olas de calor marinas**. Nada de elecciones ni pandemias. La probabilidad sube con la temperatura (salvo los terremotos), y el daño lo reducen la Vida (resiliencia) y las soluciones de adaptación, como manglares, microrredes y humedales.

## 9. Dificultad
| | Fácil | Medio | Difícil |
|---|---|---|---|
| Sensibilidad climática (TCRE) | Baja del rango (0,35) | Central (0,45) | Alta (0,60) |
| Tendencia de emisiones al inicio | Plana | Sube un poco | Sube fuerte |
| Eventos | Pocos | Normal | Muchos |
| Umbrales de inflexión | Altos | Centrales | Bajos |
| Multiplicador de puntaje | ×0,7 | ×1 | ×1,5 |

## 10. El puntaje (como Polytopia: todo integrado)
**Puntaje = (A + B + C + D + E + F) × dificultad**
- **A · Rapidez:** el año del pico de temperatura (antes es mejor) y el año de la victoria.
- **B · Temperatura pico:** cuanto más baja, mejor.
- **C · Vida final.**
- **D · Comunidad final.**
- **E · Justicia:** qué tan parejo quedó el bienestar entre las cuencas (un índice de Gini invertido).
- **F · Diversidad:** el índice de Shannon de tu mezcla de soluciones (premia diversificar; un portafolio maxeado en dos edificios puntúa menos aquí).

**En el scoreboard global** se ve el nombre, el apodo, el puntaje, la dificultad, la semilla, el año de victoria, una miniatura del planeta final y **la huella**: las 5 soluciones que más usaste. Así cada fila es un mundo distinto.

## 11. Tono y estética
- **Pixel-art muy solarpunk, como animación:** el planeta pasa de café-naranja a verde-azul cuando se recupera; aparecen aves, castores y ballenas a medida que sube la Vida.
- **Música:** ambient solarpunk (¿tuya?).
- **El guía:** un hippie solarpunk que aparece poco, como la constructora de Clash of Clans. Nombre por decidir.
- **Idiomas:** español e inglés desde el primer día (todos los textos en `i18n/es.json` y `i18n/en.json`).

## 12. Preguntas que siguen abiertas
1. El nombre (las sugerencias van en el chat) y el nombre del indicador ✊.
2. El nombre y el diseño del hippie guía.
3. ¿Resolución H3 1 (842 celdas) o 2 (~5.900)?
4. ¿El scoreboard público pide correo o solo nombre y apodo? (Afecta la privacidad y las trampas en el puntaje.)
5. ¿Tu música, o ambient libre de derechos al principio?
