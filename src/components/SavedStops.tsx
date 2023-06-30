import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

  const [savedStops, setSavedStops] = useLocalStorage<SavedStop>("savedSTops", {
    "8370B2426901": "Tara Lawn",
    "8370B2145501": "Wilton SC",
  });

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
          setShowTripModal(true);
          setIsOpen(false);
        });
    },
    [router, setIsOpen, setShowTripModal]
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* <SheetTrigger>Open</SheetTrigger> */}
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Saved Stops</SheetTitle>
          {/* <SheetDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </SheetDescription> */}
          <div>
            <ul>
              {!!savedStops &&
                Object.entries(savedStops).map(([stopId, stopName]) => (
                  <li key={stopName + stopId}>
                    <div className="flex flex-row">
                      <button
                        type="button"
                        onClick={() => setSelectedStop(stopId)}
                        className="flex w-full cursor-pointer items-center justify-start gap-1 border-b 
                      border-gray-200 py-2 pl-2 pr-4 text-start font-medium hover:bg-gray-100 hover:text-blue-700 focus:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 
                      dark:hover:text-white dark:focus:text-white dark:focus:ring-gray-500 md:gap-2 md:px-4"
                      >
                        {/* Star svg */}
                        <svg
                          aria-hidden="true"
                          className="inline-block h-5 w-5 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                        <span>{stopName}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStop(stopId)}
                        className="flex items-center border-b border-gray-200 bg-white p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-white"
                      >
                        <span className="sr-only">Delete item</span>
                        <svg
                          aria-hidden="true"
                          className="inline-block h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
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
