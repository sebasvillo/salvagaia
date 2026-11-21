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
};

const SPRITES: Record<string, string[]> = {
  energia: ['....y....', '.y..y..y.', '..yyyyy..', '..yyoyy..', 'yyyoooyyy', '..yyoyy..', '..yyyyy..', '.y..y..y.', '....y....'],
  naturaleza: ['...ggg...', '..gggGg..', '.ggGgggg.', '.gggggGg.', '..gGggg..', '...gbg...', '....b....', '....b....', '..bbbbb..'],
  edificios: ['....k....', '...krk...', '..krrrk..', '.krrrrrk.', '..wwwww..', '..wtwbw..', '..wtwbw..', '..wwwbw..', 'kkkkkkkkk'],
  movilidad: ['.........', '.....kk..', '..ttt.k..', '...t.kk..', '.kkttt.kk', 'k..k.k..k', 'k..k.k..k', '.kk...kk.', '.........'],
  comida_y_tierra: ['....y....', '...yyy...', '..y.y.y..', '...yyy...', '..y.y.y..', '...yyy...', '....g....', '..g.g.g..', '...ggg...'],
  industria_y_residuos: ['...ttt...', '.t.ttt.t.', '..ttttt..', 'ttt...ttt', 'ttt...ttt', 'ttt...ttt', '..ttttt..', '.t.ttt.t.', '...ttt...'],
  remocion_tecnologica: ['.........', 'ee.......', 'kk.......', 'kk..k..k.', 'kkkkkkkkk', 'kykykykyk', 'kkkkkkkkk', 'kykykykyk', 'kkkkkkkkk'],
  geoingenieria: ['.........', '...eee...', '..eeeee..', '.eeeeeee.', 'eeeeeeeee', 'eeeeeeeee', '.........', '..e.e.e..', '.e.e.e...'],
  trampa: ['....r....', '...rrr...', '...rwr...', '..rrwrr..', '..rrwrr..', '.rrrrrrr.', '.rrrwrrr.', 'rrrrrrrrr', '.........'],
  temperatura: ['....k....', '...kwk...', '...kwk...', '...krk...', '...krk...', '...krk...', '..krrrk..', '..krrrk..', '...kkk...'],
  emisiones: ['.........', '...eee...', '..eeeee..', '.eekkeee.', 'eekeekeee', 'eekeeekee', '.eekkeee.', '.........', '.........'],
  rayo: ['....yy...', '...yy....', '..yy.....', '.yyyyyy..', '....yy...', '...yy....', '..yy.....', '.y.......', '.........'],
  materiales: ['.kkkkkk..', 'k..b...k.', '...b.....', '...b.....', '...b.....', '...b.....', '...b.....', '...b.....', '.........'],
  vida: ['.....ggg.', '...ggggg.', '..gggggg.', '.gggggGg.', '.ggggGgg.', '.gggGgg..', '..gGgg...', '.G.......', 'G........'],
  esperanza: ['.........', '.rr...rr.', 'rrrr.rrrr', 'rrrrrrrrr', 'rrrrrrrrr', '.rrrrrrr.', '..rrrrr..', '...rrr...', '....r....'],
  huracan: ['..ttttt..', '.t.....t.', 't..ttt...', 't.t...t.t', 't.t.t.t.t', 't.t...t.t', '...ttt..t', '.t.....t.', '..ttttt..'],
  candado: ['...kkk...', '..k...k..', '..k...k..', '.yyyyyyy.', '.yyykyyy.', '.yyykyyy.', '.yyyyyyy.', '.yyyyyyy.', '.........'],
  hielo: ['....t....', '.t..t..t.', '..t.t.t..', '...ttt...', 'ttttttttt', '...ttt...', '..t.t.t..', '.t..t..t.', '....t....'],
  estrella: ['....y....', '....y....', '...yyy...', 'yyyyyyyyy', '.yyyyyyy.', '..yyyyy..', '..yy.yy..', '.yy...yy.', '.........'],
};

// La guía (nombre provisional: Ceiba). 12×12.
const CEIBA = [
  '...gGgGg....',
  '..gGgggGg...',
  '.gGbbbbbGg..',
  '.gbbssssbg..',
  '.gbskssksb..',
  '..bssssssb..',
  '..bsspppsb..',
  '...bssssb...',
  '....tttt....',
  '...tytttt...',
  '..tttttttt..',
  '..tt.tt.tt..',
];

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
  if (!cache.has(nombre)) cache.set(nombre, aDataUrl(nombre === 'ceiba' ? CEIBA : SPRITES[nombre] ?? SPRITES.trampa, 4));
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
