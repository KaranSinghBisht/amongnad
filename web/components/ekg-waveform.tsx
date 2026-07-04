"use client";

// The banner's "AGENT STATUS: ONLINE" EKG widget, reused as a live/idle
// indicator. Draws the blip on a loop when `active`; sits mostly flat
// otherwise. Uses framer-motion's pathLength (not transform), so there's
// no SVG unit ambiguity to worry about.

import { motion } from "framer-motion";

interface EkgWaveformProps {
  active: boolean;
  className?: string;
}

const BLIP_PATH = "M0,12 L28,12 L34,3 L40,21 L46,12 L120,12";

export function EkgWaveform({ active, className }: EkgWaveformProps) {
  return (
    <svg viewBox="0 0 120 24" preserveAspectRatio="none" className={className} aria-hidden>
      <path d={BLIP_PATH} fill="none" stroke="#836EF9" strokeOpacity={0.25} strokeWidth={2} />
      <motion.path
        d={BLIP_PATH}
        fill="none"
        stroke="#A99BFF"
        strokeWidth={2}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={active ? { pathLength: [0, 1] } : { pathLength: 0.15 }}
        transition={
          active
            ? { duration: 1.6, repeat: Infinity, ease: "linear" }
            : { duration: 0.6 }
        }
      />
    </svg>
  );
}
