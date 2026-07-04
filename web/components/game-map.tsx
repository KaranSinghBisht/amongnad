"use client";

import { motion } from "framer-motion";
import { ROOMS, EDGES, VENTS, ROOM_BY_ID } from "@/lib/rooms";
import { agentSpreadOffset } from "@/lib/agent-layout";
import type { AgentState, Body } from "@/lib/protocol";
import { CrewmateIcon } from "./crewmate-icon";

const DOT_SPRING = { type: "spring" as const, stiffness: 120, damping: 18 };
const ICON_SIZE = 5;

interface GameMapProps {
  agents: AgentState[];
  bodies: Body[];
}

export function GameMap({ agents, bodies }: GameMapProps) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="relative h-full w-full">
      <HallwayLines />
      <VentLines />
      <RoomNodes />
      <BodyMarkers bodies={bodies} />
      <AgentDots agents={agents} />
    </svg>
  );
}

function HallwayLines() {
  return (
    <g stroke="#836EF9" strokeOpacity={0.25} strokeWidth={0.4}>
      {EDGES.map(([a, b]) => {
        const from = ROOM_BY_ID[a];
        const to = ROOM_BY_ID[b];
        if (!from || !to) return null;
        return <line key={`${a}-${b}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
      })}
    </g>
  );
}

function VentLines() {
  return (
    <g stroke="#22d3ee" strokeOpacity={0.35} strokeWidth={0.5} strokeDasharray="1.5 1.5">
      {VENTS.map(([a, b]) => {
        const from = ROOM_BY_ID[a];
        const to = ROOM_BY_ID[b];
        if (!from || !to) return null;
        return <line key={`vent-${a}-${b}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
      })}
    </g>
  );
}

function RoomNodes() {
  return (
    <g>
      {ROOMS.map((room) => (
        <g key={room.id}>
          <circle cx={room.x} cy={room.y} r={2.6} fill="#1a1030" stroke="#836EF9" strokeOpacity={0.45} strokeWidth={0.3} />
          <text
            x={room.x}
            y={room.y - 4}
            textAnchor="middle"
            fill="#A99BFF"
            opacity={0.65}
            style={{ fontSize: 2.4, textTransform: "uppercase", letterSpacing: 0.15 }}
          >
            {room.name}
          </text>
        </g>
      ))}
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
        return (
          <text
            key={`body-${body.victim}`}
            x={room.x + dx}
            y={room.y + dy}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: 4 }}
          >
            💀
          </text>
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
              opacity={agent.alive ? 1 : 0.35}
              style={{ filter: agent.alive ? `drop-shadow(0 0 1px ${agent.color})` : "none" }}
              initial={{ x, y }}
              animate={{ x, y }}
              transition={DOT_SPRING}
            >
              <CrewmateIcon color={agent.color} />
            </motion.svg>
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
