// Sci-fi corner-bracket framing, matching the banner's "TASKS" / "AGENT
// STATUS" widgets. Drop inside any `relative` container to frame it.

interface CornerBracketsProps {
  size?: number;
}

export function CornerBrackets({ size = 12 }: CornerBracketsProps) {
  const style = { width: size, height: size };
  const base = "pointer-events-none absolute border-[#836EF9]/70";

  return (
    <>
      <span className={`${base} left-0 top-0 border-l-2 border-t-2`} style={style} aria-hidden />
      <span className={`${base} right-0 top-0 border-r-2 border-t-2`} style={style} aria-hidden />
      <span className={`${base} bottom-0 left-0 border-b-2 border-l-2`} style={style} aria-hidden />
      <span className={`${base} bottom-0 right-0 border-b-2 border-r-2`} style={style} aria-hidden />
    </>
  );
}
