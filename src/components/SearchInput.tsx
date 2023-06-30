import useRoute from "@/hooks/useRoute";
import { Route } from "@prisma/client";
import { useState, useRef, useEffect } from "react";
import { trapKeyboardFocus } from "@/lib/trapKeyboardFocus";
import { useRouter } from "next/router";

type Props = {
  selectedRoute: Route | undefined;
  className?: string;
};

function SearchInput({ selectedRoute, className = "" }: Props) {
  const router = useRouter();
  const [routeName, setRouteName] = useState("");
  const { routes } = useRoute(routeName);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSetSelectedRoute = (
    e: React.MouseEvent<HTMLButtonElement>,
    route: Route
  ) => {
    e.stopPropagation();
    router.push({ pathname: "/", query: { routeId: route.routeId } });
    setRouteName("");
  };

  // trap keyboard focus inside form for arrow and tab key input
  const handleSearchKeydown = (
    e: React.KeyboardEvent<
      HTMLButtonElement | HTMLInputElement | HTMLAnchorElement
    >
  ) => {
    if (!formRef.current) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setRouteName("");
      return;
    }
    trapKeyboardFocus(e, formRef.current);
  };

  useEffect(() => {
    const ref = formRef.current;

    if (!ref) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref && !ref.contains(event.target as Node)) {
        setRouteName("");
      }
    };
    document.addEventListener("click", handleClickOutside, true);

    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  // onsubmit not working

  // const handleOnSubmit = (
  //   e: React.FormEvent<HTMLFormElement | HTMLButtonElement>
  // ) => {
  //   e.preventDefault();
  //   router.push({ pathname: "/", query: { routeId } });
  //   setRouteName("");
  // };

  return (
    <div className={className}>
      <form
        ref={formRef}
        className="flex w-full flex-1 flex-col items-center justify-center text-center md:w-auto md:min-w-[28rem]"
        // onSubmit={handleOnSubmit}
      >
        <label htmlFor="route-search" className="sr-only">
          Search for a travel route
        </label>
        <div className="relative flex w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 md:pl-2.5">
            <svg
              aria-hidden="true"
              className="h-5 w-5 text-gray-500 dark:text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              ></path>
            </svg>
          </div>

          <input
            id="route-search"
            className={`text-md inline-block flex-1 appearance-none truncate rounded-none rounded-bl-lg rounded-tl-lg border border-gray-300 bg-gray-50 p-2.5 pl-8
               text-gray-900 focus-within:rounded-bl-none focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white
               dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 md:pl-10
               ${routeName ? "rounded-bl-none" : ""}`}
            placeholder={
              selectedRoute?.routeLongName || "Search for a bus or train route"
            }
            type="search"
            value={routeName}
            onChange={({ currentTarget }) => setRouteName(currentTarget.value)}
            autoComplete="off"
            aria-autocomplete="list"
            onKeyDown={(e) => handleSearchKeydown(e)}
          />
          {!!routes && (
            <ul
              className="text-md absolute left-0 top-full z-[1200] block w-full rounded-b-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 pr-10 text-gray-900
               focus:border-blue-500  focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            >
              {routes.map((route) => {
                const { routeId, routeLongName, routeShortName } = route;
                return (
                  <li key={routeId} className="pb-2">
                    <button
                      type="button"
                      onClick={(e) => handleSetSelectedRoute(e, route)}
                      className="w-full text-left hover:bg-slate-200"
                      onKeyDown={(e) => handleSearchKeydown(e)}
                    >
                      <strong>{routeShortName}: </strong>
                      {routeLongName}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            // onClick={handleOnSubmit}
            onKeyDown={(e) => handleSearchKeydown(e)}
            type="submit"
            className={`text-md flex w-12 justify-center rounded-br-lg rounded-tr-lg border border-blue-700 bg-blue-700 p-2.5 font-medium text-white hover:bg-blue-800 
              focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
              ${routeName ? "rounded-br-none" : ""} `}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            <span className="sr-only">Search</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchInput;
