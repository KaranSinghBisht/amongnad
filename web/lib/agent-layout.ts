// Spreads multiple dots (agents, bodies) that share one room into a small
// ring around the room's node so they don't render on top of each other.

const SPREAD_RADIUS = 4.2;

export interface SpreadOffset {
  dx: number;
  dy: number;
}

export function agentSpreadOffset(index: number, total: number): SpreadOffset {
  if (total <= 1) return { dx: 0, dy: 0 };
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    dx: Math.cos(angle) * SPREAD_RADIUS,
    dy: Math.sin(angle) * SPREAD_RADIUS,
  };
}
