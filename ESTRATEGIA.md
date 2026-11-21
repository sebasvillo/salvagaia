# Cómo se gana SalvaGaia (para Sebas)

Sale de mirar cómo juega el bot "sensato" en dificultad media (`npm run balance`). Gana hacia 2051, con un pico de 1,53 °C.

## Early game (2026-2032): comida y metano
- **Lo más rentable al inicio son las soluciones de comida y tierra:** manejo de nutrientes, dietas basadas en plantas, cero desperdicio, manejo de estiércol, arroz mejorado y no quemar residuos de cosecha. Cuestan ⚡1-2 y ⛏2-4, y evitan mucho.
- **Por qué funcionan tan rápido:** la agricultura es casi la mitad metano y óxido nitroso, y el metano dura poco en el aire. Cortarlo enfría en una década. Es la palanca rápida y es real: el IPCC lo dice.
- **Súbelas a nivel 5 pronto.** Cinco niveles de una solución la llevan al 100 % de su potencial. Mejorar sale más barato que regar edificios por todo el mapa.
- **La primera política:** "Fin de los subsidios fósiles" apenas la Esperanza alcance. Encoge toda la economía fósil cada año, para siempre.
- **No toques las trampas.** El bot que solo usa trampas pierde por Vida hacia 2030, siempre.

## Middle game (2032-2042): energía y bosques
- **Con la era 2 llegan las granjas solares y la eólica.** Desiertos y pastos dan energía extra por terreno.
- **Proteger el bosque tropical** (2 Gt) sube la Vida a 100 rapidísimo, y con la Vida alta la naturaleza captura más.
- **Cerrar el carbón 5 veces** (cuesta Esperanza). En 2041 el bot ya va en 6 Gt.
- **Empieza el comercio:** la energía suele sobrar y los materiales faltar. Cambia 3 por 1, o 2 por 1 si tienes algo en la costa.

## Late game (2042-2051): el último kilómetro
- **Lo que queda es industria y transporte.** Son difíciles: tus soluciones no los bajan del todo, así que hacen falta políticas (economía circular, ciudades de 15 minutos).
- **Para bajar de cero hay que capturar carbono:** restaurar bosques, turberas, manglares y pastos marinos, biochar y alcalinizar el océano.
- **Para ganar,** la temperatura tiene que bajar 10 años seguidos con emisiones negativas.

## ¿Min-maxing o diversidad?
- **Para ganar rápido, min-maxing:** pocas soluciones baratas a nivel 5, en orden de Gt por recurso.
- **Para el puntaje, diversidad:** el índice de diversidad y la justicia entre regiones dan hasta 400 de unos 1.300 puntos. El bot gana, pero su puntaje queda corto en esas dos.
- **El equilibrio que planteas es el corazón del juego:** las soluciones que producen recursos (LED, solar, eólica, reciclaje, compost, y cualquier cosa en bosques o desiertos) no siempre son las que más bajan emisiones. Hay que mezclar.

## Lo que el bot revela del balance (para ajustar)
1. **Las de comida y tierra están demasiado baratas** para lo que evitan. El bot las pone primero siempre. Hay que subirles el costo, o hacer que exijan casillas de cultivo, que son pocas.
2. **El bot construye ~150 edificios.** Un humano construirá 40-60, así que una partida humana durará más (2060-2075). Está bien para una primera partida, pero hay que jugarlo.
3. **El pico ya es casi el arranque (1,53 °C),** porque se empieza en 1,5. Si quieres más drama, que la inercia térmica haga subir la temperatura unos años aunque cortes de una.

## Corridas del 21 nov (tarde), con desbloqueo, inercia y El Niño (6 mundos por casilla)
| | fácil | medio | difícil |
|---|---|---|---|
| sensato (todo) | gana ~2050 | gana ~2054 | gana ~2058 |
| humano (4 jugadas al año, cae a veces en trampas) | gana ~2100 | gana 5 de 6, ~2128 | **pierde** (se acaba el tiempo) |
| min-max sin políticas | gana ~2053 | gana ~2061 | **pierde** (5 por Esperanza, 1 por calor) |
| diverso | gana ~2051 | gana ~2053 | gana ~2063 |
| energía primero | gana ~2056 | gana ~2060 | gana ~2067 |
| naturaleza primero | gana ~2050 | gana ~2053 | gana ~2058 |
| sin políticas | gana ~2053 | **pierde** (tiempo) | **pierde** (Esperanza) |
| solo trampas | pierde ~2030 | pierde ~2031 | pierde ~2031 |
| no hacer nada | pierde ~2061 | pierde ~2054 | pierde ~2050 |

**Lo que dicen las corridas:**
- **Sin políticas no se gana** en medio ni en difícil: la industria y el transporte no bajan solo con soluciones.
- En difícil, **min-max pierde**: sube pocas soluciones al máximo, la Esperanza se cae y no alcanza a pagar nada.
- **Diverso y naturaleza** sacan los mejores puntajes en difícil (~1.900), con un pico más bajo.
- Un humano que hace pocas jugadas al año pierde en difícil: lo que falta es la cantidad de jugadas, no la estrategia.
