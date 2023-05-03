import Image from "next/image";
import { Inter } from "next/font/google";
import { useState } from "react";
import useRealtime from "@/hooks/useRealtime";
import useStatic from "@/hooks/useStatic";
import { Route, Stop, Trip } from "@prisma/client";
import Map from "@/components/Map";
import SearchInput from "@/components/SearchInput";
import TripSelect from "@/components/TripSelect";
import DateTimeSelect from "@/components/DateTimeSelect";
import { initDateTimeValue } from "@/lib/timeHelpers";

const inter = Inter({ subsets: ["latin"] });

const defaultRoute = {
  routeId: "3249_46339",
  agencyId: "7778020",
  routeShortName: "208",
  routeLongName: "Lotabeg - Bishopstown - Curraheen",
  routeType: 3,
};

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState<Route>(defaultRoute);
  // const [shapeId, setShapeId] = useState("3249_408");
  const [selectedStopId, setSelectedStopId] = useState<Stop["stopId"]>("");
  const [selectedTripId, setSelectedTripId] = useState<Trip["tripId"]>("");
  const [selectedDateTime, setSelectedDateTime] = useState(initDateTimeValue());
  const { tripsByRouteId, tripsByTripId } = useRealtime();
  const {
    stops,
    trips,
    tripsById,
    stopTimes,
    shape,
    stopsById,
    stopTimesByStopId,
    stopTimesByTripId,
  } = useStatic({
    routeId: selectedRoute.routeId,
    // shapeId,
    selectedDateTime,
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
        <div className="flex h-32 flex-row items-center justify-center gap-10 p-4">
          {!!selectedRoute ? (
            <div>
              <strong>Selected route: </strong>#{selectedRoute?.routeShortName}{" "}
              {selectedRoute?.routeLongName}
            </div>
          ) : (
            <div>
              <strong>Selected route: </strong>
            </div>
          )}
          <SearchInput setSelectedRoute={setSelectedRoute} />
          <TripSelect
            stopStopTimes={tripsAtSelectedStop}
            setSelectedTripId={setSelectedTripId}
            tripsById={tripsById}
          />
          <DateTimeSelect
            setSelectedDateTime={setSelectedDateTime}
            selectedDateTime={selectedDateTime}
          />
        </div>
        <div>{JSON.stringify(trips?.slice(0, 10))}</div>
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
