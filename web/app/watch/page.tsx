import { Suspense } from "react";
import type { Metadata } from "next";
import { GameTheater } from "@/components/game-theater";
import { TheaterLoading } from "@/components/theater-loading";

export const metadata: Metadata = {
  title: "amongnad — spectator theater",
};

export default function WatchPage() {
  return (
    <Suspense fallback={<TheaterLoading />}>
      <GameTheater />
    </Suspense>
  );
}
