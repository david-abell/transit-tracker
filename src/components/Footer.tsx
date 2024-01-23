import { isPastArrivalTime } from "@/lib/timeHelpers";
import { Route, Stop, StopTime, Trip } from "@prisma/client";

type Props = {
  destination?: Stop;
  route?: Route;
  stop?: Stop;
  trip?: Trip;
  stopTimes?: StopTime[];
};

function Footer({ trip, stop, route, stopTimes, destination }: Props) {
  const beginStopTime = stopTimes?.find(
    ({ stopId }) => stopId === stop?.stopId
  );
  const destinationStopTime = stopTimes?.find(
    ({ stopId }) => stopId === destination?.stopId
  );
  console.log({ stop, destination });

  const { arrivalTime } = beginStopTime || {};

  let isPastStop = false;
  let arrivalText = "";

  if (!!arrivalTime && isPastArrivalTime(arrivalTime)) {
    arrivalText = "Departed";
  } else if (!!arrivalTime) {
    arrivalText = arrivalTime;
  }
  return (
    <div className="absolute bottom-0 z-[1000] mx-auto min-h-[6rem] w-full overflow-x-auto bg-gray-50 p-4 dark:border-gray-700 lg:px-10">
      <table className="w-full table-auto text-left text-sm text-gray-500 dark:text-gray-400">
        <thead className="bg-gray-50 uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th className="p-2">Route</th>
            <th className="p-2">Heading towards</th>
            <th className="p-2">Selected Stop</th>
            <th className="p-2">Scheduled pickup</th>
            <th className="p-2">Destination</th>
            <th className="p-2">Scheduled arrival</th>
          </tr>
        </thead>
        <tbody>
          <tr className="whitespace-nowrap border-b bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
            <td className="px-2 py-4">
              {!!route && (
                <>
                  <b>{route.routeShortName}</b>: {route.routeLongName}
                </>
              )}
            </td>
            <td className="px-2 py-4">
              {!!trip && <p>Towards: {trip.tripHeadsign}</p>}
            </td>
            <td className="px-2 py-4">
              {!!stop && (
                <>
                  <b>Name: </b> {stop.stopName}{" "}
                  <b className="font-bold">Id: </b>
                  {stop.stopId}
                </>
              )}
            </td>
            <td className="px-2 py-4">
              {isPastStop ? (
                arrivalText
              ) : (
                <time dateTime={arrivalText}>{arrivalText}</time>
              )}
            </td>
            <td className="px-2 py-4">
              {!!destination && (
                <>
                  <b>Name: </b> {destination.stopName}{" "}
                  <b className="font-bold">Id: </b>
                  {destination.stopId}
                </>
              )}
            </td>
            <td className="px-2 py-4">
              {destinationStopTime?.arrivalTime ? (
                <time dateTime={destinationStopTime?.arrivalTime}>
                  {destinationStopTime?.arrivalTime || ""}
                </time>
              ) : (
                ""
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Footer;
