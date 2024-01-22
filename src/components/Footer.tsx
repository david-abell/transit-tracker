import { Route, Stop, StopTime, Trip } from "@prisma/client";

type Props = {
  route?: Route;
  stop?: Stop;
  trip?: Trip;
  stopTimes?: StopTime[];
};

function Footer({ trip, stop, route }: Props) {
  return (
    <div
      className="absolute bottom-0 z-[1000] mx-auto flex min-h-[6rem] w-full flex-row items-center justify-center
  gap-2.5 border-gray-200 bg-gray-50 p-4 
  dark:border-gray-700 dark:bg-gray-800 md:max-w-screen-2xl lg:px-10"
    >
      {!!route && (
        <p className="font-bold">
          {route.routeShortName}: {route.routeLongName}
        </p>
      )}
      {!!trip && <p>Towards: {trip.tripHeadsign}</p>}
      {!!stop && <p>{stop.stopName}</p>}
    </div>
  );
}

export default Footer;
