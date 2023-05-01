import Image from "next/image";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import { useState } from "react";
import useRealtime from "@/hooks/useRealtime";
import useStatic from "@/hooks/useStatic";
import { Stop, Trip } from "@prisma/client";
import Map from "@/components/Map";
import SearchInput from "@/components/SearchInput";
import TripSelect from "@/components/TripSelect";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("208");
  // const [shapeId, setShapeId] = useState("3249_408");
  const [selectedStopId, setSelectedStopId] = useState<Stop["stopId"]>("");
  const [selectedTripId, setSelectedTripId] = useState<Trip["tripId"]>("");
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
    stopTimesByStopId,
    stopTimesByTripId,
  } = useStatic({
    routeQuery: searchQuery,
    // shapeId,
    dateTime: selectedDateTime,
    selectedTripId,
  });

  const tripsAtSelectedStop = stopTimesByStopId?.get(selectedStopId);

  const handleSelectedStop = (stopId: string) => {
    if (!stopTimesByStopId) return;

    const newTrips = stopTimesByStopId.get(stopId);

    if (newTrips?.length === 1 || (!selectedTripId && newTrips?.length)) {
      setSelectedTripId(() => newTrips[0].tripId);
    }

    setSelectedStopId(() => stopId);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className=" w-full items-center justify-between">
        {/* <h1>H1 Title</h1> */}
        <SearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <TripSelect
          stopStopTimes={tripsAtSelectedStop}
          setSelectedTripId={setSelectedTripId}
          tripsById={tripsById}
        />
        <span>{searchQuery}</span>
        <Map
          shape={shape}
          stopTimes={stopTimes}
          stopsById={stopsById}
          tripsById={tripsById}
          selectedStopId={selectedStopId}
          handleSelectedStop={handleSelectedStop}
          selectedTripId={selectedTripId}
          stopTimesByStopId={stopTimesByStopId}
        />
      </div>
    </main>
  );
}
