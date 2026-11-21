// Generador pseudoaleatorio determinista (mulberry32). El estado es un entero que vive en la partida.
export function siguiente(estado: { rng: number }): number {
  let t = (estado.rng = (estado.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function semillaDeTexto(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h | 0;
}

export function entre(estado: { rng: number }, a: number, b: number): number {
  return Math.floor(a + siguiente(estado) * (b - a + 1));
}
