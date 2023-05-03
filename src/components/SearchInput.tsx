import useRoute from "@/hooks/useRoute";
import { Route } from "@prisma/client";
import { Dispatch, SetStateAction, useState } from "react";

type Props = {
  setSelectedRoute: Dispatch<SetStateAction<Route>>;
};
function SearchInput({ setSelectedRoute }: Props) {
  const [routeName, setRouteName] = useState("");
  const { routes } = useRoute(routeName);

  const handleSetSelectedRoute = (
    e: React.MouseEvent<HTMLButtonElement>,
    route: Route
  ) => {
    e.stopPropagation();
    setSelectedRoute(route);
    setRouteName("");
  };

  return (
    <div className="relative">
      <label htmlFor="route-search" className="p-2">
        Search for a Route:{" "}
      </label>
      <input
        type={"search"}
        value={routeName}
        onChange={({ currentTarget }) => setRouteName(currentTarget.value)}
        id="route-search"
        className="p-2"
      />
      {!!routes && (
        <ul className="absolute left-0 top-full z-[2000] bg-white p-2">
          {routes.map((route) => {
            const { routeId, routeLongName, routeShortName } = route;
            return (
              <li key={routeId}>
                <button
                  onClick={(e) => handleSetSelectedRoute(e, route)}
                  className="w-full text-left hover:bg-slate-200"
                >
                  <strong>{routeShortName}: </strong>
                  {routeLongName}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default SearchInput;
