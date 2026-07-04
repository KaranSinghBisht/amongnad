"use client";

import { motion } from "framer-motion";
import { ROOMS, EDGES, VENTS, ROOM_BY_ID } from "@/lib/rooms";
import { agentSpreadOffset } from "@/lib/agent-layout";
import type { AgentState, Body } from "@/lib/protocol";
import { CrewmateIcon } from "./crewmate-icon";

const DOT_SPRING = { type: "spring" as const, stiffness: 120, damping: 18 };
const ICON_SIZE = 5.4;
const ROOM_W = 10;
const ROOM_H = 5.4;

interface GameMapProps {
  agents: AgentState[];
  bodies: Body[];
}

export function GameMap({ agents, bodies }: GameMapProps) {
  const occupied = new Set(agents.filter((a) => a.alive).map((a) => a.room));
  for (const b of bodies) occupied.add(b.room);

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="relative h-full w-full">
      <Corridors />
      <VentLines />
      <RoomCards occupied={occupied} />
      <BodyMarkers bodies={bodies} />
      <AgentDots agents={agents} />
    </svg>
  );
}

// Hallways drawn as a wide dark "floor" casing with a thin purple guide line
// on top — reads as a corridor, not a wireframe edge.
function Corridors() {
  return (
    <>
      <g stroke="#241548" strokeWidth={2.6} strokeLinecap="round">
        {EDGES.map(([a, b]) => {
          const from = ROOM_BY_ID[a];
          const to = ROOM_BY_ID[b];
          if (!from || !to) return null;
          return <line key={`c-${a}-${b}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
        })}
      </g>
      <g stroke="#836EF9" strokeOpacity={0.4} strokeWidth={0.28} strokeLinecap="round">
        {EDGES.map(([a, b]) => {
          const from = ROOM_BY_ID[a];
          const to = ROOM_BY_ID[b];
          if (!from || !to) return null;
          return <line key={`g-${a}-${b}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
        })}
      </g>
    </>
  );
}

function VentLines() {
  return (
    <g stroke="#C9B8FF" strokeOpacity={0.28} strokeWidth={0.45} strokeDasharray="1 1.6">
      {VENTS.map(([a, b]) => {
        const from = ROOM_BY_ID[a];
        const to = ROOM_BY_ID[b];
        if (!from || !to) return null;
        return <line key={`vent-${a}-${b}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
      })}
    </g>
  );
}

function RoomCards({ occupied }: { occupied: Set<string> }) {
  return (
    <g>
      {ROOMS.map((room) => {
        const hot = occupied.has(room.id);
        return (
          <g key={room.id}>
            <rect
              x={room.x - ROOM_W / 2}
              y={room.y - ROOM_H / 2}
              width={ROOM_W}
              height={ROOM_H}
              rx={1.3}
              fill={hot ? "#1D1240" : "#150C2E"}
              stroke={hot ? "#A99BFF" : "#836EF9"}
              strokeOpacity={hot ? 0.9 : 0.4}
              strokeWidth={hot ? 0.45 : 0.3}
              style={hot ? { filter: "drop-shadow(0 0 1.6px rgba(169,155,255,0.8))" } : undefined}
            />
            <text
              x={room.x}
              y={room.y - ROOM_H / 2 - 1.2}
              textAnchor="middle"
              fill="#A99BFF"
              opacity={hot ? 0.95 : 0.55}
              style={{ fontSize: 2, textTransform: "uppercase", letterSpacing: 0.16, fontWeight: 700 }}
            >
              {room.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function BodyMarkers({ bodies }: { bodies: Body[] }) {
  return (
    <g>
      {bodies.map((body, i) => {
        const room = ROOM_BY_ID[body.room];
        if (!room) return null;
        const { dx, dy } = agentSpreadOffset(i, bodies.length);
        const cx = room.x + dx;
        const cy = room.y + dy;
        return (
          <g key={`body-${body.victim}`}>
            <motion.circle
              cx={cx}
              cy={cy}
              fill="none"
              stroke="#f87171"
              strokeWidth={0.4}
              initial={{ r: 1.6, opacity: 0.8 }}
              animate={{ r: [1.6, 4.4], opacity: [0.8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontSize: 3.6 }}
            >
              💀
            </text>
          </g>
        );
      })}
    </g>
  );
}

function AgentDots({ agents }: { agents: AgentState[] }) {
  return (
    <g>
      {agents.map((agent) => {
        const room = ROOM_BY_ID[agent.room];
        if (!room) return null;

        const roommates = agents.filter((a) => a.room === agent.room);
        const indexInRoom = roommates.findIndex((a) => a.id === agent.id);
        const { dx, dy } = agentSpreadOffset(indexInRoom, roommates.length);
        const cx = room.x + dx;
        const cy = room.y + dy;
        const x = cx - ICON_SIZE / 2;
        const y = cy - ICON_SIZE / 2;

        return (
          <g key={agent.id}>
            <motion.svg
              viewBox="0 0 36 36"
              width={ICON_SIZE}
              height={ICON_SIZE}
              opacity={agent.alive ? 1 : 0.3}
              style={{ filter: agent.alive ? `drop-shadow(0 0 1px ${agent.color})` : "none" }}
              initial={{ x, y }}
              animate={{ x, y }}
              transition={DOT_SPRING}
            >
              <CrewmateIcon color={agent.color} />
            </motion.svg>
            {agent.alive && (
              <motion.text
                textAnchor="middle"
                fill={agent.color}
                style={{ fontSize: 1.7, fontWeight: 800, letterSpacing: 0.12 }}
                initial={{ x: cx, y: cy + ICON_SIZE / 2 + 1.7 }}
                animate={{ x: cx, y: cy + ICON_SIZE / 2 + 1.7 }}
                transition={DOT_SPRING}
              >
                {agent.name.toUpperCase()}
              </motion.text>
            )}
            {!agent.alive && (
              <motion.text
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontSize: 3 }}
                initial={{ x: cx, y: cy }}
                animate={{ x: cx, y: cy }}
                transition={DOT_SPRING}
              >
                💀
              </motion.text>
            )}
          </g>
        );
      })}
    </g>
  );
}
