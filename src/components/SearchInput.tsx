import useRoute from "@/hooks/useRoute";
import { Dispatch, SetStateAction, useState } from "react";

type Props = {
  setSelectedRoute: Dispatch<SetStateAction<string>>;
};
function SearchInput({ setSelectedRoute }: Props) {
  const [routeName, setRouteName] = useState("");
  const { routes } = useRoute(routeName);

  const handleSetSelectedRoute = (
    e: React.MouseEvent<HTMLButtonElement>,
    routeId: string
  ) => {
    e.stopPropagation();
    setSelectedRoute(routeId);
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
          {routes.map(({ routeId, routeLongName, routeShortName }) => (
            <li key={routeId}>
              <button
                onClick={(e) => handleSetSelectedRoute(e, routeId)}
                className="w-full text-left hover:bg-slate-200"
              >
                <strong>{routeShortName}: </strong>
                {routeLongName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchInput;
