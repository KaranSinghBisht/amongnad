// Simplified Among-Us-style crewmate silhouette (backpack + body + visor),
// recolored per agent. Renders bare shapes at viewBox "0 0 36 36" — the
// caller supplies the wrapping <svg> so it works both as a small map dot
// (nested inside the room-graph SVG) and as a standalone panel avatar.

interface CrewmateIconProps {
  color: string;
}

export function CrewmateIcon({ color }: CrewmateIconProps) {
  return (
    <>
      <rect x="1" y="14" width="6" height="13" rx="3" fill={color} />
      <rect x="7" y="3" width="22" height="30" rx="11" fill={color} />
      <ellipse
        cx="20.5"
        cy="10.5"
        rx="9"
        ry="5.5"
        fill="#cfeeff"
        stroke="#0b0620"
        strokeWidth="0.6"
        transform="rotate(-8 20.5 10.5)"
      />
    </>
  );
}
