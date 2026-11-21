# Supuestos de juego (MVP, 20 nov 2026)

Todo lo que no sale de una fuente. Los valores viven en `data/parametros.json`; en el código van marcados con `// SUPUESTO:`.

## Clima
- **Reparto de las emisiones por sector:** sale del IPCC AR6 GT3 (2019), pero pasé 6 puntos de energía a edificios (sus emisiones indirectas por electricidad), quité 1 para que sume 100 y partí AFOLU en agricultura (12 %) y bosques (10 %).
- **Gases de vida corta (metano):** cada sector tiene una fracción de vida corta (energía 10 %, industria y residuos 15 %, agricultura 45 %). Esa parte calienta según las emisiones del momento, con un rezago de 10 años, y no se acumula. Está calibrada para que explique ~0,5 °C al inicio (IPCC AR6 GT1). Por eso cortar metano enfría rápido.
- **El resto del calentamiento inicial** se atribuye al CO₂ acumulado, que sigue la TCRE.
- **Residuo mínimo:** ningún sector baja de 3 % de su línea base solo con soluciones. El resto hay que compensarlo con secuestro.
- **Tendencia sin acción:** +0,5 %/año en medio, 0 en fácil, +1,2 % en difícil.
- **Sumideros:** si la Vida baja de 50, los sumideros naturales pierden hasta 4 Gt/año.
- **Puntos de inflexión:** los umbrales se inspiran en Armstrong McKay et al. (2022) (#por-verificar); los efectos (0,8 Gt/año del permafrost, 1,5 de la Amazonía, −8 de Vida por los corales) son de juego.
- **Aerosoles:** enfrían 0,12 °C por nivel. Si se quitan, el calor vuelve de golpe y la Vida pierde 10.

## Soluciones
- **Adopción:** 5 niveles construidos de una solución (sumando todas sus casillas) llevan su adopción global al 100 % del potencial de Drawdown. La curva es en S.
- **Aprendizaje:** cada nivel construido abarata la siguiente construcción de esa solución (exponente 0,15, inspirado en la ley de Wright).
- **Las soluciones de naturaleza capturan más con más Vida** (×0,5 a ×1,5).
- **Casillas degradadas** (25 % de la tierra, según la semilla): proteger ahí da la mitad de Vida y restaurar da 1,5 veces más.
- **Biomas vecinos:** los ríos aceptan soluciones de cultivo; las montañas, de pastizal y bosque templado; las costas, de pastizal.
- **La captura directa del aire** se come 4 ⚡ por nivel al año.

## Trampas
- Se revelan entre 3 y 8 años después de construidas. Al revelarse, su eficacia cae al 15 %, la Esperanza baja 5 y cada nivel cuesta Vida cada año.
- El lock-in fósil encarece la energía limpia (+8 % por punto) y la política de cerrar el carbón.

## Gente y recursos
- **Esperanza:** abarata (hasta −30 %) o encarece (hasta +30 %) todo. Sube cuando bajan las emisiones o la temperatura y con las soluciones de gente. Baja cuando suben las emisiones, cuando un evento daña edificios (máximo −3 por evento), cuando se revela una trampa y si la inversión entre regiones es injusta. El desánimo de fondo baja a medida que bajan las emisiones.
- **Políticas** (idea de la IA, a partir de "cerrar el carbón" en la v0): se pagan con Esperanza. Hay cinco: cerrar el carbón, fin de los subsidios fósiles, moratoria a la deforestación, ley de economía circular y ciudades de 15 minutos.
- **Recursos:** ⚡ 22 y ⛏ 40 por año de base, con tope de 150 y 200.

## Mapa
- Celdas H3 de resolución 1. Tierra y mar salen de Natural Earth. **Biomas y regiones son una aproximación** por latitud y cajas de coordenadas, con 56 ciudades grandes y 19 puntos de ríos. Pendiente: WWF (Olson et al. 2001) y HydroBASINS.
- Las regiones son continentes, todavía no macrocuencas.

## Victoria
- Para ganar, la temperatura tiene que bajar 10 años seguidos **y** las emisiones netas tienen que ser negativas en cada uno de esos años. Sin esta segunda condición se podía "ganar" solo cortando el metano, con el CO₂ todavía subiendo.
