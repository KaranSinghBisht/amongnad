// Typed wrapper around rooms.json (copied verbatim from engine/rooms.json —
// engine and web must share this file so the map the crew sees matches the
// graph agents actually move on). Coordinates are in a 0..100 SVG space.

import roomsData from "./rooms.json";

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
}

export type RoomEdge = readonly [string, string];

interface RoomsFile {
  rooms: Room[];
  edges: RoomEdge[];
  vents: RoomEdge[];
}

const data = roomsData as unknown as RoomsFile;

export const ROOMS: Room[] = data.rooms;
export const EDGES: RoomEdge[] = data.edges;
export const VENTS: RoomEdge[] = data.vents;

export const ROOM_BY_ID: Record<string, Room> = Object.fromEntries(
  ROOMS.map((room) => [room.id, room])
);
