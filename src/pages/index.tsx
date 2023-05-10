import Image from "next/image";
import { Inter } from "next/font/google";
import { useState } from "react";
import useRealtime from "@/hooks/useRealtime";
import useStatic from "@/hooks/useStatic";
import { Route, Stop, Trip } from "@prisma/client";
import MapComponent from "@/components/Map";
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
  const [isDirectionZero, setIsDirectionZero] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<Route>(defaultRoute);
  const [selectedStopId, setSelectedStopId] = useState<Stop["stopId"]>("");
  const [selectedTripId, setSelectedTripId] = useState<Trip["tripId"]>("");
  const [selectedDateTime, setSelectedDateTime] = useState(initDateTimeValue());
  const { tripsByRouteId, tripsByTripId } = useRealtime();
  const {
    selectedTripStopTimesById,
    stops,
    trips,
    tripsById,
    stopTimesZero,
    stopTimesOne,
    shape,
    stopsById,
    stopTimesZeroByStopId,
    stopTimesOneByStopId,
    stopTimesZeroByTripId,
    stopTimesOneByTripId,
  } = useStatic({
    routeId: selectedRoute.routeId,
    selectedDateTime,
    selectedTripId,
  });

  const [showRouteModal, setShowRouteModal] = useState(true);
  const [showTripModal, setShowTripModal] = useState(false);

  const directionalRouteName =
    selectedRoute && isDirectionZero
      ? selectedRoute.routeLongName
      : selectedRoute
      ? selectedRoute.routeLongName?.split("-").reverse().join("-")
      : "Select a travel route";

  let stopIdsByDirection: string[] = [];

  if (isDirectionZero && stopTimesZeroByStopId) {
    stopIdsByDirection = [...stopTimesZeroByStopId.keys()];
  } else if (stopTimesOneByStopId) {
    stopIdsByDirection = [...stopTimesOneByStopId.keys()];
  }

  const tripsAtSelectedStop = isDirectionZero
    ? stopTimesZeroByStopId?.get(selectedStopId)
    : stopTimesOneByStopId?.get(selectedStopId);

  const handleSelectedStop = (stopId: string) => {
    if (isDirectionZero && stopTimesZeroByStopId) {
      const newTrips = stopTimesZeroByStopId.get(stopId);

      if (newTrips?.length === 1 || (!selectedTripId && newTrips?.length)) {
        setSelectedTripId(() => newTrips[0].tripId);
      }
    } else if (!isDirectionZero && stopTimesOneByStopId) {
      const newTrips = stopTimesOneByStopId.get(stopId);

      if (newTrips?.length === 1 || (!selectedTripId && newTrips?.length)) {
        setSelectedTripId(() => newTrips[0].tripId);
      }
    }

    setSelectedStopId(() => stopId);
    setShowTripModal(() => !showTripModal);
  };

  const handleSelectedTrip = (tripId: string) => {
    setShowTripModal(false);
    setSelectedTripId(tripId);
  };

  const handleChangeDirection = () => {
    setSelectedStopId("");
    setSelectedTripId("");
    setIsDirectionZero(!isDirectionZero);
  };

  const [directionZeroTripsById, directionOneTripsById] = trips?.length
    ? trips.reduce<[Map<Trip["tripId"], Trip>, Map<string, Trip>]>(
        (acc, trip) => {
          const { directionId } = trip;
          let [directionZero, directionOne] = acc;

          if (directionId === 0) {
            directionZero.set(trip.tripId, trip);
          } else {
            directionOne.set(trip.tripId, trip);
          }
          return acc;
        },
        [new Map(), new Map()]
      )
    : [];

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="relative w-full">
        {/* <h1>H1 Title</h1> */}

        {/* Floating Route info and controls */}
        <div className="md: absolute left-1/2 top-10 z-[2000] w-64 -translate-x-1/2 transform rounded-lg border bg-gray-50 p-4 text-center md:w-96 md:p-6">
          <h2 className="text-lg font-medium md:pb-4 md:text-2xl">
            Route {selectedRoute?.routeShortName}:
          </h2>
          <p className="pb-2.5 text-lg font-medium">{directionalRouteName}</p>
          <div className="flex flex-col gap-2.5">
            <button
              className="md:text-md w-full rounded-md
              border border-blue-700 bg-blue-700 p-2.5 text-sm font-medium text-white hover:bg-blue-800 
              focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              onClick={() => setShowRouteModal(true)}
            >
              change travel route
            </button>
            <button
              className="md:text-md w-full rounded-md
              border border-blue-700 bg-blue-700 p-2.5 text-sm font-medium text-white hover:bg-blue-800 
              focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              onClick={handleChangeDirection}
            >
              Change travel direction
            </button>
          </div>
        </div>

        <MapComponent
          shape={shape}
          stopIds={stopIdsByDirection}
          selectedDateTime={selectedDateTime}
          selectedTripStopTimesById={selectedTripStopTimesById}
          stopsById={stopsById}
          tripsById={tripsById}
          selectedStopId={selectedStopId}
          handleSelectedStop={handleSelectedStop}
          selectedTripId={selectedTripId}
          stopTimesByStopId={
            isDirectionZero ? stopTimesZeroByStopId : stopTimesOneByStopId
          }
          stopTimesByTripId={
            isDirectionZero ? stopTimesZeroByTripId : stopTimesOneByTripId
          }
          tripsByDirection={
            isDirectionZero ? directionZeroTripsById : directionOneTripsById
          }
        />
      </div>

      {/* Route and Date/Time select Modal */}
      <Modal
        isOpen={showRouteModal}
        title="Plan your trip"
        onClose={() => setShowRouteModal(false)}
        onProceed={() => setShowRouteModal(false)}
      >
        <DateTimeSelect
          setSelectedDateTime={setSelectedDateTime}
          selectedDateTime={selectedDateTime}
        />
        <SearchInput setSelectedRoute={setSelectedRoute} />
      </Modal>

      {/* Trip select modal */}
      <Modal
        isOpen={showTripModal}
        title="Choose a trip"
        onClose={() => setShowTripModal(false)}
        onProceed={() => setShowTripModal(false)}
      >
        <TripSelect
          route={selectedRoute}
          handleSelectedTrip={handleSelectedTrip}
          stopStopTimes={tripsAtSelectedStop}
          tripsById={tripsById}
        />
      </Modal>
    </main>
  );
}
