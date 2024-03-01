"use-client";
import { Route, Stop, StopTime } from "@prisma/client";
import {
  ReactNode,
  useEffect,
  Dispatch,
  SetStateAction,
  RefObject,
} from "react";
import { useMediaQuery } from "usehooks-ts";
import dynamic from "next/dynamic";
import { Button } from "./ui/button";

const ThemeToggle = dynamic(() => import("./ThemeToggle"), { ssr: false });

type Props = {
  children: ReactNode;
  selectedRoute: Route | undefined;
  showMenu: boolean;
  setShowMenu: Dispatch<SetStateAction<boolean>>;
  navRef: RefObject<HTMLElement>;
  isAnimating: boolean;
};

function MainNav({
  children,
  isAnimating,
  selectedRoute,
  showMenu,
  setShowMenu,
  navRef,
}: Props) {
  const isMediumScreen = useMediaQuery("(min-width: 768px)");
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

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
  }, [navRef, setShowMenu, showMenu]);

  useEffect(() => {
    if (isMediumScreen) {
      setShowMenu(false);
    }
  }, [isMediumScreen, setShowMenu]);

  return (
    <nav
      ref={navRef}
      className="z-[1200] relative mx-auto flex min-h-[6rem] flex-row items-center justify-between
       gap-4 border-gray-200 p-4 
       dark:border-gray-700 md:max-w-screen-2xl lg:px-10"
    >
      {!isLargeScreen && (
        <>
          {!!selectedRoute ? (
            <div className="flex items-baseline">
              {!!selectedRoute.routeShortName && (
                <>
                  <span className="inline-block whitespace-nowrap font-bold text-xl">
                    {selectedRoute.routeShortName}
                  </span>
                  <span>&nbsp;-&nbsp;</span>
                </>
              )}
              <h1 className="text-lg font-medium lg:pl-2.5">
                {selectedRoute?.routeLongName ?? ""}
              </h1>
            </div>
          ) : (
            <div>
              <h1 className="text-lg font-medium lg:pl-2.5">
                Welcome to the Irish bus tracker.
              </h1>
            </div>
          )}
        </>
      )}

      {/* Menu list */}
      <div
        className={`absolute left-0 top-full mr-auto bg-background w-full justify-between md:gap-2.5 lg:static lg:flex ${
          showMenu ? "" : "hidden"
        }`}
      >
        <ul
          id="navbar-hamburger"
          className="mx-auto flex flex-col lg:grid grid-cols-3 grid-rows-4 w-full lg:grid-rows-2 grid-flow-col flex-wrap gap-4 font-medium dark:border-gray-700 lg:flex-row max-lg:p-4"
        >
          {children}
        </ul>
      </div>

      <ThemeToggle className="ml-auto lg:mb-auto" />

      {/* Hamburger button */}
      <Button
        onClick={() => setShowMenu((prev) => !prev)}
        size="icon"
        className={`p-2.5 lg:hidden ${
          isAnimating ? "attention-pulse focus-within:animate-none" : ""
        }`}
        aria-controls="navbar-hamburger"
        aria-expanded={showMenu}
      >
        <span className="sr-only">Open main menu</span>
        <svg
          className={"h-6 w-6"}
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
      </Button>
    </nav>
  );
}

export default MainNav;
