// Faint decorative agent-node network graph — ambient background texture
// behind the Stage (banner motif). Fixed coordinates, not randomized, so
// server and client render identically. Not the room graph — pure set
// dressing, kept out of the room-node band (y 18-84) so it never competes
// with the actual map.

const NODES: [number, number][] = [
  [6, 12], [16, 6], [28, 16], [40, 8], [55, 14], [70, 7], [85, 15], [94, 9],
  [10, 90], [22, 95], [35, 88], [50, 96], [65, 90], [78, 96], [90, 89],
];

const LINKS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14],
];

export function NodeGraphTexture() {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]"
      aria-hidden
    >
      <g stroke="#836EF9" strokeWidth={0.15}>
        {LINKS.map(([a, b], i) => {
          const [x1, y1] = NODES[a];
          const [x2, y2] = NODES[b];
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      <g fill="#A99BFF">
        {NODES.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={0.6} />
        ))}
      </g>
    </svg>
  );
}
