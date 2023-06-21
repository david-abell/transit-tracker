"use-client";
import { Route } from "@prisma/client";
import {
  ReactNode,
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react";
import { useMediaQuery } from "usehooks-ts";
import SearchInput from "./SearchInput";
import dynamic from "next/dynamic";

const ThemeToggle = dynamic(() => import("./ThemeToggle"), { ssr: false });

type Props = {
  children: ReactNode;
  selectedRoute: Route | undefined;
};

function MainNav({ children, selectedRoute }: Props) {
  const navRef = useRef<HTMLElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const isMediumScreen = useMediaQuery("(min-width: 768px)");

  // const directionalRouteName =
  //   selectedRoute && !reverseRoute
  //     ? selectedRoute.routeLongName
  //     : selectedRoute
  //     ? selectedRoute.routeLongName?.split("-").reverse().join("-")
  //     : "Select a travel route";

  useEffect(() => {
    const ref = navRef.current;
    if (!ref) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && !ref.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [showMenu]);

  useEffect(() => {
    if (isMediumScreen) {
      setShowMenu(false);
    }
  }, [isMediumScreen]);

  return (
    <nav
      ref={navRef}
      className="relative mx-auto flex min-h-[5rem] max-w-screen-2xl flex-wrap items-start justify-between gap-2.5 border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 md:items-center md:px-10"
    >
      {showMenu ? (
        <>
          <div className="flex flex-1 flex-col dark:text-white md:block md:flex-none">
            <h2 className="inline-block text-base font-bold md:text-2xl">
              {selectedRoute?.routeShortName}
            </h2>
            <p className="inline-block text-lg font-medium md:pl-2.5">
              {selectedRoute?.routeLongName}
            </p>
          </div>
          <ThemeToggle />
        </>
      ) : (
        <SearchInput selectedRoute={selectedRoute} className={"md:hidden"} />
      )}

      {/* Menu list */}
      <div
        className={`absolute left-0 top-full z-[1100] mx-auto w-full justify-between md:static md:flex md:w-auto ${
          showMenu ? "" : "hidden"
        }`}
      >
        <ul
          id="navbar-hamburger"
          className="m-0 flex flex-col gap-4 bg-gray-50 p-4 font-medium dark:border-gray-700 dark:bg-gray-800 md:flex-row"
        >
          {Children.map(children, (child: ReactNode) => {
            if (isValidElement(child)) {
              return (
                <li key={child.key} className="flex w-full items-center">
                  {child}
                </li>
              );
            }
          })}
        </ul>
      </div>

      <ThemeToggle className="hidden md:block" />

      {/* Hamburger button */}
      <button
        onClick={() => setShowMenu((prev) => !prev)}
        type="button"
        className="inline-flex items-center p-2.5 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 md:hidden"
        aria-controls="navbar-hamburger"
        aria-expanded={showMenu}
      >
        <span className="sr-only">Open main menu</span>
        <svg
          className="h-6 w-6"
          aria-hidden="true"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          ></path>
        </svg>
      </button>
    </nav>
  );
}

export default MainNav;
