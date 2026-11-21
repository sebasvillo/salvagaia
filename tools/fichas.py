"""Saca de las fichas de Drawdown del cuaderno (8 Fuentes/Fichas/Drawdown) lo que Ceiba explica en el juego.
Uso: python3 tools/fichas.py  → data/fichas.json"""
import json, re, pathlib
CARPETA = pathlib.Path(__file__).resolve().parents[2] / 'Cuaderno Solarpunk Obsidian/8 Fuentes/Fichas/Drawdown'
salida = {}
for f in sorted(CARPETA.glob('*.md')):
    t = f.read_text(encoding='utf-8')
    m = re.search(r'^---\n(.*?)\n---', t, re.S)
    fm = m.group(1) if m else ''
    def campo(k):
        mm = re.search(rf'^{k}:\s*(.*)$', fm, re.M)
        if not mm: return None
        v = mm.group(1).strip().strip('"')
        return None if v in ('', 'null') else v
    ids = re.findall(r'^\s*-\s*"?([a-z0-9-]+)"?\s*$', fm.split('id_juego:')[1].split('\n', 20)[0] + '\n' + '\n'.join(fm.split('id_juego:')[1].split('\n')[1:4]), re.M) if 'id_juego:' in fm else []
    frase = re.search(r'\*\*En una frase:\*\*\s*(.+)', t)
    preguntas = dict(re.findall(r'^\| (¿[^|]+\?) \| (Sí|No|[^|]+?) \|$', t, re.M))
    def num(k):
        v = campo(k)
        try: return float(v) if v is not None else None
        except ValueError: return None
    datos = {
        'frase': frase.group(1).strip() if frase else None,
        'velocidad': campo('velocidad'),
        'impacto_actual_gt': num('impacto_actual_gt'),
        'alcanzable_bajo_gt': num('impacto_alcanzable_bajo_gt'),
        'alcanzable_alto_gt': num('impacto_alcanzable_alto_gt'),
        'pct_emisiones': campo('pct_emisiones_globales_actual'),
        'url': campo('url'),
        'preguntas': preguntas or None,
    }
    for i in ids: salida[i] = datos
json.dump(salida, open(pathlib.Path(__file__).resolve().parents[1] / 'data/fichas.json', 'w'), ensure_ascii=False, indent=1)
print(len(salida), 'fichas')
