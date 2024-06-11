import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Star, X } from "lucide-react";
import { useRouter } from "next/router";
import { useQueryState } from "nuqs";
import { Dispatch, SetStateAction, useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";

type Props = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  handleSelectStopAndClear: (stopId: string) => void;
};

type StopName = string;
type StopId = string;

export type SavedStop = {
  [key: StopId]: StopName;
};

export default function Sidebar({
  handleSelectStopAndClear,
  isOpen,
  setIsOpen,
}: Props) {
  const [savedStops, setSavedStops] = useLocalStorage<SavedStop>(
    "savedSTops",
    {},
  );

  const removeStop = (stopId: string) => {
    setSavedStops((prev) => {
      const stops = { ...prev };
      delete stops[stopId];

      return stops;
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="z-[2100]">
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
                        onClick={() => handleSelectStopAndClear(stopId)}
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
