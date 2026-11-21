// Varios mundos guardados a la vez, como en Polytopia. Viven en el almacenamiento del navegador (localStorage):
// sobreviven a cerrar la página, pero son de este navegador y este dispositivo.
import type { Estado } from './sim/juego';

const CLAVE = 'salvagaia:mundos';

export interface MundoGuardado { id: string; nombre: string; actualizado: string; estado: Estado }

function leerTodo(): Record<string, MundoGuardado> {
  try {
    const crudo = localStorage.getItem(CLAVE);
    const todo = crudo ? JSON.parse(crudo) : {};
    // Migración: la partida única de la versión anterior se vuelve un mundo más.
    const vieja = localStorage.getItem('salvagaia:partida');
    if (vieja) {
      const e = JSON.parse(vieja) as Estado;
      const id = 'm' + Date.now().toString(36);
      todo[id] = { id, nombre: e.semilla, actualizado: new Date().toISOString(), estado: e };
      localStorage.setItem(CLAVE, JSON.stringify(todo));
      localStorage.removeItem('salvagaia:partida');
    }
    return todo;
  } catch { return {}; }
}

function escribirTodo(t: Record<string, MundoGuardado>) {
  try { localStorage.setItem(CLAVE, JSON.stringify(t)); } catch { /* sin almacenamiento: el mundo vive solo en esta pestaña */ }
}

export function listar(): MundoGuardado[] {
  return Object.values(leerTodo()).sort((a, b) => b.actualizado.localeCompare(a.actualizado));
}

export function guardarMundo(id: string, nombre: string, estado: Estado) {
  const t = leerTodo();
  t[id] = { id, nombre, actualizado: new Date().toISOString(), estado };
  escribirTodo(t);
}

export function borrarMundo(id: string) {
  const t = leerTodo();
  delete t[id];
  escribirTodo(t);
}

export function nuevoId() { return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

const NOMBRES = ['Ceiba', 'Frailejón', 'Guadua', 'Manglar', 'Páramo', 'Colibrí', 'Chigüiro', 'Totumo', 'Yarumo', 'Macondo', 'Orquídea', 'Arrecife', 'Cóndor', 'Jaguar', 'Morpho', 'Guayacán', 'Bromelia', 'Danta'];
export function nombreAlAzar() {
  return NOMBRES[Math.floor(Math.random() * NOMBRES.length)] + ' ' + (10 + Math.floor(Math.random() * 90));
}
