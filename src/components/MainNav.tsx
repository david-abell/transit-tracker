"use-client";
import { Route } from "@prisma/client";
import {
  ReactNode,
  Children,
  isValidElement,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
} from "react";
import { useMediaQuery } from "usehooks-ts";
import SearchInput from "./SearchInput";
import dynamic from "next/dynamic";

const ThemeToggle = dynamic(() => import("./ThemeToggle"), { ssr: false });

type Props = {
  children: ReactNode;
  selectedRoute: Route | undefined;
  showMenu: boolean;
  setShowMenu: Dispatch<SetStateAction<boolean>>;
};

function MainNav({ children, selectedRoute, showMenu, setShowMenu }: Props) {
  const navRef = useRef<HTMLElement>(null);
  const isMediumScreen = useMediaQuery("(min-width: 768px)");

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
  }, [setShowMenu, showMenu]);

  useEffect(() => {
    if (isMediumScreen) {
      setShowMenu(false);
    }
  }, [isMediumScreen, setShowMenu]);

  return (
    <nav
      ref={navRef}
      className="relative mx-auto flex min-h-[6rem] flex-row items-center justify-between
       gap-2.5 border-gray-200 p-4 
       dark:border-gray-700 dark:bg-gray-800 md:max-w-screen-2xl lg:px-10"
    >
      {showMenu ? (
        <>
          {!!selectedRoute && (
            <div className="flex items-baseline dark:text-white ">
              {!!selectedRoute.routeShortName && (
                <>
                  <span className="inline-block whitespace-nowrap text-base font-bold md:text-2xl">
                    {selectedRoute.routeShortName}
                  </span>
                  <span>&nbsp;-&nbsp;</span>
                </>
              )}
              <h2 className="text-lg font-medium lg:pl-2.5">
                {selectedRoute?.routeLongName ?? ""}
              </h2>
            </div>
          )}
          <ThemeToggle className="ml-auto" />
        </>
      ) : (
        <SearchInput
          selectedRoute={selectedRoute}
          className={"mr-auto flex-1 lg:hidden"}
        />
      )}

      {/* Menu list */}
      <div
        className={`absolute left-0 top-full z-[1100] mr-auto w-full justify-between md:gap-2.5 lg:static lg:flex ${
          showMenu ? "" : "hidden"
        }`}
      >
        <ul
          id="navbar-hamburger"
          className="mx-auto flex flex-col flex-wrap gap-4 px-4 pb-4 font-medium dark:border-gray-700 dark:bg-gray-800 lg:flex-row lg:pt-4"
        >
          {Children.map(children, (child: ReactNode) => {
            if (isValidElement(child)) {
              return (
                <li
                  key={child.key}
                  className="mr-2 flex w-full items-center justify-center last:mr-auto lg:w-auto"
                >
                  {child}
                </li>
              );
            }
          })}
        </ul>
      </div>

      <ThemeToggle className="hidden lg:block" />

      {/* Hamburger button */}
      <button
        onClick={() => setShowMenu((prev) => !prev)}
        type="button"
        className="inline-flex items-center p-2.5 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 lg:hidden"
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
