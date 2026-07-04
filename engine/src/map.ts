// Room graph (The Skeld, simplified) loaded from engine/rooms.json.
// Movement = pick an adjacent room; vents = impostor-only teleports.
import { readFileSync } from 'node:fs';

interface RoomDef { id: string; name: string; x: number; y: number; }
interface RoomsFile {
  rooms: RoomDef[];
  edges: [string, string][];
  vents: [string, string][];
}

// src/map.ts -> ../rooms.json == engine/rooms.json
const data: RoomsFile = JSON.parse(
  readFileSync(new URL('../rooms.json', import.meta.url), 'utf8'),
);

export const ROOMS = data.rooms;
export const START_ROOM = 'cafeteria';

const nameById = new Map<string, string>();
for (const r of data.rooms) nameById.set(r.id, r.name);

function buildAdjacency(pairs: [string, string][]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const r of data.rooms) m.set(r.id, []);
  for (const [a, b] of pairs) {
    if (!m.has(a)) m.set(a, []);
    if (!m.has(b)) m.set(b, []);
    if (!m.get(a)!.includes(b)) m.get(a)!.push(b);
    if (!m.get(b)!.includes(a)) m.get(b)!.push(a);
  }
  return m;
}

const edgeAdj = buildAdjacency(data.edges);
const ventAdj = buildAdjacency(data.vents);

export function roomExists(id: string): boolean {
  return nameById.has(id);
}

export function roomName(id: string): string {
  return nameById.get(id) ?? id;
}

export function adjacentRooms(id: string): { id: string; name: string }[] {
  return (edgeAdj.get(id) ?? []).map((r) => ({ id: r, name: roomName(r) }));
}

export function ventRooms(id: string): { id: string; name: string }[] {
  return (ventAdj.get(id) ?? []).map((r) => ({ id: r, name: roomName(r) }));
}

export function isAdjacent(a: string, b: string): boolean {
  return (edgeAdj.get(a) ?? []).includes(b);
}

export function isVentAdjacent(a: string, b: string): boolean {
  return (ventAdj.get(a) ?? []).includes(b);
}

// Resolve a free-text room reference (id or display name) to a room id.
export function resolveRoom(text: string): string | null {
  if (!text) return null;
  const t = text.trim().toLowerCase();
  for (const r of data.rooms) {
    if (r.id.toLowerCase() === t || r.name.toLowerCase() === t) return r.id;
  }
  // loose contains match as a fallback
  for (const r of data.rooms) {
    if (r.name.toLowerCase().includes(t) || t.includes(r.id.toLowerCase())) return r.id;
  }
  return null;
}
