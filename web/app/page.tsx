import { Suspense } from "react";
import { GameTheater } from "@/components/game-theater";
import { TheaterLoading } from "@/components/theater-loading";

export default function Page() {
  return (
    <Suspense fallback={<TheaterLoading />}>
      <GameTheater />
    </Suspense>
  );
}
