// Convierte dist-artifact/index.html (un solo archivo) al formato de página de artifact:
// sin doctype/html/head/body (el artifact pone su propio esqueleto), con <title> y <style> arriba.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-artifact/index.html', 'utf8');
const estilos = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const scripts = [...html.matchAll(/<script type="module"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
const cuerpo = (html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '').replace(/<script[\s\S]*?<\/script>/g, '').trim();
if (!estilos || !scripts || !cuerpo) throw new Error('No encontré estilos, scripts o cuerpo en el build');

const salida = `<title>SalvaGaia</title>
<meta name="theme-color" content="#ecebd6">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Pixelify+Sans:wght@400;600&display=swap">
<style>${estilos}</style>
${cuerpo}
<script type="module">${scripts.replace(/<\/script/gi, '<\\/script')}</script>
`;
writeFileSync('dist-artifact/salvagaia.html', salida);
console.log('dist-artifact/salvagaia.html', Math.round(salida.length / 1024), 'KB');
