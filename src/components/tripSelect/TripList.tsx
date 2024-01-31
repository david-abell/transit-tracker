import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

function TripList({ children }: Props) {
  return (
    <ul className="flex h-full max-h-[26rem] max-w-full flex-col overflow-y-scroll text-start [contain:paint] dark:bg-gray-800 ">
      {/* Column headers */}

      <li
        className={`sticky top-0 flex w-full justify-between gap-1 border-b-2 border-gray-400 py-2 pr-2 text-start
                 text-lg font-medium dark:bg-gray-800 md:gap-2 md:pr-4`}
      >
        {/* Route */}
        <span className="w-20 cursor-default md:w-28">Route</span>

        {/* Destination */}
        <span className="flex-1 cursor-default">Destination</span>

        {
          <>
            {/* Scheduled */}
            <span
              className={`hidden w-20 cursor-default text-right sm:inline-block`}
            >
              Scheduled
            </span>

            {/* Delay */}
            <span className={`w-20  cursor-default text-right`}>Delay</span>

            {/* Arriving */}
            <span className="w-20  cursor-default text-right"> Arriving</span>
          </>
        }
      </li>

      {/* Trip list */}
      {children}
    </ul>
  );
}

export default TripList;
