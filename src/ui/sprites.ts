// Íconos pixel-art propios (9×9), dibujados a mano como texto. Nada de emojis: cada ícono es parte del estilo.
const PALETA: Record<string, string> = {
  k: '#25211c', // tinta
  w: '#fafaf0', // papel
  y: '#e8ac2f', // mostaza
  o: '#d9733e', // naranja
  r: '#c4472f', // terracota
  g: '#4f8a3c', // verde
  G: '#2e5b2a', // verde oscuro
  b: '#7a5230', // madera
  t: '#2a8c80', // turquesa
  e: '#8d887c', // gris
  s: '#c98d5e', // piel
  p: '#e5a9a0', // rosa
  v: '#6b4c9a', // violeta
};

const SPRITES: Record<string, string[]> = {
  info: ["....kkkk....", "..kkttttkk..", ".kttttwtttk.", ".kttttttttk.", "kttttwwttttk", "ktttttwttttk", "ktttttwttttk", "ktttttwttttk", ".ktttwwwttk.", ".kttttttttk.", "..kkttttkk..", "....kkkk...."],
  comercio: ["............", "...k........", "..kk........", ".kkkkkkkkk..", "..kk........", "...k........", "........k...", "........kk..", "..kkkkkkkkk.", "........kk..", "........k...", "............"],
  esperanza: ["............", "..rr....rr..", ".rrrr..rrrr.", "rrwrrrrrrrrr", "rwrrrrrrrrrr", "rrrrrrrrrrrr", ".rrrrrrrrrr.", "..rrrrrrrr..", "...rrrrrr...", "....rrrr....", ".....rr.....", "............"],
  vida: ["........ggg.", "......ggggg.", ".....gggGgg.", "....ggGggg..", "....gGggg...", "..gg.G......", ".gggGG......", ".ggg.G......", "..g..G......", ".....G......", "....bbb.....", "...bbbbb...."],
  temperatura: [".....kk.....", "....kwwk....", "....kwwk....", "....kwwk....", "....krrk....", "....krrk....", "....krrk....", "...krrrrk...", "..krrrrrrk..", "..krrrrrrk..", "...krrrrk...", "....kkkk...."],
  emisiones: ["......eee...", ".....eeeee..", "....eeeeeee.", "...eeeeeeee.", "....eeeee...", "..kk..e.....", "..kk........", "..kk........", "kkkkkk......", "kkkkkkkk....", "kwkwkwkk....", "kkkkkkkk...."],
  materiales: ["............", "oooookooooo.", "oooookooooo.", "kkkkkkkkkkk.", "ookoooookoo.", "ookoooookoo.", "kkkkkkkkkkk.", "ooooookoooo.", "ooooookoooo.", "kkkkkkkkkkk.", "............", "............"],
  rayo: ["......kkkk..", ".....kyyk...", "....kyyk....", "...kyyk.....", "..kyyyyykk..", "..kkkkyyyk..", ".....kyyk...", "....kyyk....", "...kyyk.....", "..kyk.......", "..kk........", "............"],
  energia: ['....y....', '.y..y..y.', '..yyyyy..', '..yyoyy..', 'yyyoooyyy', '..yyoyy..', '..yyyyy..', '.y..y..y.', '....y....'],
  naturaleza: ['...ggg...', '..gggGg..', '.ggGgggg.', '.gggggGg.', '..gGggg..', '...gbg...', '....b....', '....b....', '..bbbbb..'],
  edificios: ['....k....', '...krk...', '..krrrk..', '.krrrrrk.', '..wwwww..', '..wtwbw..', '..wtwbw..', '..wwwbw..', 'kkkkkkkkk'],
  movilidad: ['.........', '.....kk..', '..ttt.k..', '...t.kk..', '.kkttt.kk', 'k..k.k..k', 'k..k.k..k', '.kk...kk.', '.........'],
  comida_y_tierra: ['....y....', '...yyy...', '..y.y.y..', '...yyy...', '..y.y.y..', '...yyy...', '....g....', '..g.g.g..', '...ggg...'],
  industria_y_residuos: ['...ttt...', '.t.ttt.t.', '..ttttt..', 'ttt...ttt', 'ttt...ttt', 'ttt...ttt', '..ttttt..', '.t.ttt.t.', '...ttt...'],
  remocion_tecnologica: ['.........', 'ee.......', 'kk.......', 'kk..k..k.', 'kkkkkkkkk', 'kykykykyk', 'kkkkkkkkk', 'kykykykyk', 'kkkkkkkkk'],
  geoingenieria: ['.........', '...eee...', '..eeeee..', '.eeeeeee.', 'eeeeeeeee', 'eeeeeeeee', '.........', '..e.e.e..', '.e.e.e...'],
  trampa: ['....r....', '...rrr...', '...rwr...', '..rrwrr..', '..rrwrr..', '.rrrrrrr.', '.rrrwrrr.', 'rrrrrrrrr', '.........'],
  huracan: ['..ttttt..', '.t.....t.', 't..ttt...', 't.t...t.t', 't.t.t.t.t', 't.t...t.t', '...ttt..t', '.t.....t.', '..ttttt..'],
  candado: ['...kkk...', '..k...k..', '..k...k..', '.yyyyyyy.', '.yyykyyy.', '.yyykyyy.', '.yyyyyyy.', '.yyyyyyy.', '.........'],
  hielo: ['....t....', '.t..t..t.', '..t.t.t..', '...ttt...', 'ttttttttt', '...ttt...', '..t.t.t..', '.t..t..t.', '....t....'],
  estrella: ['....y....', '....y....', '...yyy...', 'yyyyyyyyy', '.yyyyyyy.', '..yyyyy..', '..yy.yy..', '.yy...yy.', '.........'],
};

// La guía (nombre provisional: Ceiba). 12×12.
const CEIBA = [".....g.G.g......", "...gGgGgGgGg....", "..gGgyGgGgyGg...", "..GbbbbbbbbbG...", ".gbbssssssbbbg..", ".gbsssssssssbg..", ".bsskksskksssb..", ".bsskwsskwsssb..", ".bspssssssspsb..", "..bssssbssssb...", "...bssssssbb....", "....ttttttt.....", "...ttyttttyt....", "..ttttttttttt...", "..sttttttttts...", "...tt.....tt...."];


// Las otras vidas de Ceiba (16×16).
const OTRAS_CEIBAS: Record<string, string[]> = {
 "ceiba_astronauta": [
  "....eeeeeee.....",
  "...ewwwwwwwe....",
  "..ewwwwwwwwwe...",
  "..ewkkkkkkkwe...",
  "..ewkssssskwe...",
  "..ewkskssskwe...",
  "..ewkspppskwe...",
  "..ewkkkkkkkwe...",
  "...ewwwwwwwe....",
  "....eeeeeee.....",
  "...wwwwwwwww....",
  "..wwwyrwwwwww...",
  "..wwwwwwwwwww...",
  "..wwwwwwwwwww...",
  "...ww.....ww....",
  "...ee.....ee...."
 ],
 "ceiba_alien": [
  "...k.......k....",
  "....k.....k.....",
  ".....ggggg......",
  "...ggggggggg....",
  "..ggggggggggg...",
  "..ggkkggggkkgg..",
  "..ggkwggggkwgg..",
  "..ggggggggggg...",
  "...gggkkkggg....",
  "....ggggggg.....",
  ".....ttttt......",
  "....ttttttt.....",
  "...ttttttttt....",
  "...gtttttttg....",
  "....tt...tt.....",
  "....gg...gg....."
 ],
 "ceiba_tortuga": [
  "................",
  "................",
  "................",
  ".....GGGGGG.....",
  "...GGgGGgGGG....",
  "..GgGGGgGGGgG...",
  "..GGGgGGGGgGG.ss",
  ".GgGGGGgGGGGGsks",
  ".GGGgGGGGgGGGsss",
  ".bbbbbbbbbbbbb..",
  "..ss..ss..ss....",
  "..ss..ss..ss....",
  "................",
  "................",
  "................",
  "................"
 ],
 "ceiba_astrologa": [
  "......vv........",
  ".....vvvv.......",
  "....vvyvvv......",
  "...vvvvvvyv.....",
  "..vvvvvvvvvv....",
  ".vvvvvvvvvvvv...",
  "...bbbbbbbb.....",
  "..bssssssssb....",
  "..bskssksssb....",
  "..bsppsssppb....",
  "...bssksssb.....",
  "....tttttt......",
  "...tyttttyt.....",
  "..vvvvvvvvvv....",
  "..svvvvvvvvs....",
  "...vv....vv....."
 ]
};

const cache = new Map<string, string>();

function aDataUrl(filas: string[], escala: number): string {
  const c = document.createElement('canvas');
  c.width = filas[0].length * escala; c.height = filas.length * escala;
  const ctx = c.getContext('2d')!;
  filas.forEach((f, y) => [...f].forEach((ch, x) => {
    if (ch === '.') return;
    ctx.fillStyle = PALETA[ch] ?? '#f0f';
    ctx.fillRect(x * escala, y * escala, escala, escala);
  }));
  return c.toDataURL();
}

export function sprite(nombre: string): string {
  if (!cache.has(nombre)) cache.set(nombre, aDataUrl(nombre === 'ceiba' || nombre === 'ceiba_jardinera' ? CEIBA : OTRAS_CEIBAS[nombre] ?? SPRITES[nombre] ?? SPRITES.trampa, 4));
  return cache.get(nombre)!;
}

/** `<img>` de un ícono, escalado sin suavizar. */
export function ico(nombre: string, clase = 'ico'): string {
  return `<img class="${clase}" src="${sprite(nombre)}" alt="" aria-hidden="true">`;
}

/** Para dibujar en el canvas del planeta. */
const imgs = new Map<string, HTMLImageElement>();
export function imagen(nombre: string): HTMLImageElement {
  if (!imgs.has(nombre)) { const i = new Image(); i.src = sprite(nombre); imgs.set(nombre, i); }
  return imgs.get(nombre)!;
}
