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
import Modal from "@/components/Modal";

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
  const [showModal, setShowModal] = useState(true);

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
      <div className="relative w-full">
        {/* <h1>H1 Title</h1> */}
        <div className="md: absolute left-1/2 top-10 z-[2000] w-64 -translate-x-1/2 transform rounded-lg border bg-gray-50 p-4 text-center md:w-96 md:p-6">
          <h2 className="pb-2.5 text-lg font-medium md:pb-4 md:text-2xl">
            Travel route: <strong>{selectedRoute?.routeShortName}</strong>
          </h2>
          <button
            className="md:text-md w-full rounded-md
              border border-blue-700 bg-blue-700 p-2.5 text-sm font-medium text-white hover:bg-blue-800 
              focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            onClick={() => setShowModal(true)}
          >
            {!!selectedRoute
              ? selectedRoute?.routeLongName
              : "Select a travel route:"}
          </button>
        </div>
        <Map
          shape={shape}
          stops={stops}
          stopTimes={stopTimes}
          stopsById={stopsById}
          tripsById={tripsById}
          selectedStopId={selectedStopId}
          handleSelectedStop={handleSelectedStop}
          selectedTripId={selectedTripId}
          stopTimesByStopId={stopTimesByStopId}
        />
      </div>
      <Modal
        isOpen={showModal}
        title="Plan your trip"
        onClose={() => setShowModal(false)}
        onProceed={() => setShowModal(false)}
      >
        <DateTimeSelect
          setSelectedDateTime={setSelectedDateTime}
          selectedDateTime={selectedDateTime}
        />
        <SearchInput setSelectedRoute={setSelectedRoute} />
        {/* <TripSelect
            stopStopTimes={tripsAtSelectedStop}
            setSelectedTripId={setSelectedTripId}
            tripsById={tripsById}
          /> */}
      </Modal>
    </main>
  );
}
