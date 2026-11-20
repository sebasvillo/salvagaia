# Datos del juego

## `soluciones.json` y `soluciones.csv`: las 166 soluciones de Project Drawdown
- **Fuente:** el Drawdown Explorer (drawdown.org/explorer), actualizado el 22 sep 2025, transcrito el 7 nov 2026.
  - 61 altamente recomendadas
  - 21 valiosas
  - 29 "seguir mirando"
  - 14 no recomendadas (las trampas)
  - 3 en revisión
  - 38 "próximamente"
- **⚠ Verificar:** se transcribieron de la página, no del CSV oficial. Descarga el CSV ("Download CSV") y compáralo antes de calibrar.
- **Campos de Drawdown:** `calificacion_drawdown`, `potencial_gt_min` y `potencial_gt_max` (GtCO₂e/año, horizonte de 100 años; en la restauración, carbono removido) y `costo_usd_t` (US$ por tCO₂e; negativo significa que ahorra plata). Solo hay potencial para unas 80 soluciones y costo para unas 60.
- **Campos de juego** (`juego.*`): **son supuestos v0 generados por regla** con `tools/gen_soluciones.py` (ver `DISENO.md`, sección 5). Cuando Drawdown no da potencial, se usa un valor de juego y `potencial_es_supuesto: true`.
- **Nombres en español:** traducción propia y corta, pensada para la interfaz.

## Fuentes científicas que debe respetar el modelo
| Qué | Fuente | Uso en el juego |
|---|---|---|
| Soluciones, potencial y costo | Project Drawdown, Drawdown Explorer (2025) | Las 166 soluciones |
| Efectos sociales y ecológicos | Regeneration.org, Nexus (calificaciones de justicia social, cultura, mujeres, biodiversidad y carbono, de −3 a 10) | Calibrar 🌱 y ✊ (pendiente) |
| Temperatura frente a emisiones acumuladas | IPCC AR6, GT1, cap. 5: TCRE de 0,27 a 0,63 °C por 1.000 GtCO₂, central 0,45 | `clima.ts` |
| Calentamiento después del cero neto | IPCC AR6 y Rogelj (compromiso de emisiones cero ≈ 0) | `clima.ts` |
| Modelo climático simple | FaIR (Smith et al. 2018, código abierto) | Mejora futura del modelo |
| Comportamiento del sistema | En-ROADS (Climate Interactive) | Referencia para validar: con las mismas palancas, ¿el juego da curvas parecidas? |
| Puntos de inflexión | Armstrong McKay et al. (2022), *Science* | Umbrales y efectos (#por-verificar los valores) |
| Riesgos por región | Probable Futures | Eventos por cuenca (pendiente) |
| Cuencas | HydroSHEDS, HydroBASINS | Las regiones del mapa (pendiente) |
| Biomas | Olson et al. (2001), ecorregiones terrestres del WWF | Biomas de las celdas (pendiente) |
| La grilla | H3 (Uber, código abierto) | Las celdas hexagonales |

## Actualización del 7 nov 2026 (noche)
`soluciones.json` trae además `juego.objeto_juego` (la máquina o infraestructura concreta en el planeta), `ficha` (la nota del cuaderno en `8 Fuentes/Fichas/Drawdown/`), `pdf` y `emprendimientos`. **Ojo:** si vuelves a correr `tools/gen_soluciones.py`, esos campos se pierden. Hay que pasar el script a que lea y conserve el JSON existente (pídeselo a Claude Code en el prompt 1).
