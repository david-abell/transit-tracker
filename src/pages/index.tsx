"use-client";

import Image from "next/image";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import { useState } from "react";
import useRealtime from "@/hooks/useRealtime";
import useStatic from "@/hooks/useStatic";
import { Stop } from "@prisma/client";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const Map = dynamic(() => import("@/components/Map"), {
    ssr: false,
  });

  const [shapeId, setShapeId] = useState("3249_408");
  const [selectedStopId, setSelectedStopId] = useState<Stop["stopId"]>();
  const [selectedDateTime, setSelectedDateTime] = useState(
    new Date(2023, 5, 1, 8, 21, 21)
  );
  const { tripsByRouteId, tripsByTripId } = useRealtime();
  const {
    route,
    stops,
    trips,
    tripsById,
    stopTimes,
    shape,
    stopsById,
    stopTimesByTripId,
  } = useStatic({
    routeQuery: "208",
    shapeId,
    dateTime: selectedDateTime,
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className=" w-full items-center justify-between">
        {/* <h1>H1 Title</h1> */}
        <Map
          shape={shape}
          stopTimes={stopTimes}
          stopsById={stopsById}
          tripsById={tripsById}
          selectedStopId={selectedStopId}
          setSelectedStopId={setSelectedStopId}
        />
      </div>
    </main>
  );
}
