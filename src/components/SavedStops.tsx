import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Star, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";

type Props = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setShowTripModal: Dispatch<SetStateAction<boolean>>;
};

type StopName = string;
type StopId = string;

export type SavedStop = {
  [key: StopId]: StopName;
};

export default function Sidebar({
  isOpen,
  setIsOpen,
  setShowTripModal,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [savedStops, setSavedStops] = useLocalStorage<SavedStop>(
    "savedSTops",
    {},
  );

  const selectedStopId = searchParams.get("stopId") || "";

  const removeStop = (stopId: string) => {
    setSavedStops((prev) => {
      const stops = { ...prev };
      delete stops[stopId];

      return stops;
    });
  };

  const setSelectedStop = useCallback(
    (stopId: string) => {
      const { pathname } = router;
      return router
        .push({
          pathname: pathname,
          query: { stopId },
        })
        .then(() => {
          setIsOpen(false);
          if (stopId && stopId === selectedStopId) {
            setShowTripModal(true);
          } else {
            setTimeout(() => setShowTripModal(true), 1500);
          }
        });
    },
    [router, selectedStopId, setIsOpen, setShowTripModal],
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Favorite Stops</SheetTitle>
          <div>
            <ul>
              {!!savedStops &&
                Object.entries(savedStops).map(([stopId, stopName]) => (
                  <li key={stopName + stopId}>
                    <div className="flex flex-row">
                      <button
                        type="button"
                        onClick={() => setSelectedStop(stopId)}
                        className="flex w-full cursor-pointer items-center justify-start border-b border-gray-200 
                      py-2 pl-2 pr-4 text-start font-medium ring-inset hover:bg-gray-100 hover:text-blue-700 focus-visible:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 
                      dark:hover:text-white dark:focus-visible:text-white dark:focus-visible:ring-gray-500 md:gap-2 md:px-4"
                      >
                        <Star fill="#facc15" color="#facc15" />
                        <span>{stopName}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStop(stopId)}
                        className="flex items-center border-b border-gray-200 p-1.5 ring-inset hover:bg-gray-100 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-red-600"
                      >
                        <span className="sr-only">Delete item</span>
                        <X />
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
