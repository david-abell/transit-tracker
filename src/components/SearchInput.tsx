import useRoute from "@/hooks/useRoute";
import { Route, Stop } from "@prisma/client";
import { useState, useMemo, CSSProperties } from "react";
import useStops from "@/hooks/useStops";
import Select, { InputActionMeta } from "react-select";

import { useQueryState } from "nuqs";

export interface GroupedOption {
  readonly label: string;
  readonly options: readonly Stop[] | readonly Route[];
}

type Props = {
  selectedRoute: Route | undefined;
  className?: string;
  removeQueryParams: () => void;
  setStopId: (stopId: string) => void;
};

function SearchInput({
  selectedRoute,
  className = "",
  removeQueryParams,
  setStopId,
}: Props) {
  const [, setRouteId] = useQueryState("routeId");

  const [inputText, setInputText] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<Stop | Route | null>(
    null,
  );

  // still needs debouncing
  const [searchText, setSearchText] = useState<string>("");

  const { routes } = useRoute(searchText);
  const { stops } = useStops({ stopQuery: searchText });

  const searchResults: GroupedOption[] = useMemo(() => {
    return [
      { label: "Routes", options: routes ?? [] },
      { label: "Stops", options: stops ?? [] },
    ];
  }, [routes, stops]);

  const handleOptionLabel = (item: Stop | Route) => {
    if ("routeId" in item) {
      const { routeLongName, routeShortName } = item;

      return `Route: ${routeShortName} - ${routeLongName}`;
    } else {
      const { stopId, stopCode, stopName } = item;

      return `Stop: ${stopCode ?? stopId} - ${stopName}`;
    }
  };

  const handleOptionValue = (item: Stop | Route) => {
    if ("stopId" in item) {
      return item.stopId;
    } else {
      return item.routeId;
    }
  };

  const handleSelectionValue = (option: Stop | Route | null) => {
    if (!option) return;
    removeQueryParams();
    setSelectedOption(option);

    if ("stopId" in option) {
      setStopId(option.stopId);
    } else {
      setRouteId(option.routeId);
    }
  };

  const handleInputChange = (inputText: string, meta: InputActionMeta) => {
    if (meta.action === "input-change") {
      setInputText(inputText);
      setSearchText(inputText);
    }
  };

  console.log({ inputText, searchText, routes, stops });

  return (
    <>
      <Select<Readonly<Stop> | Readonly<Route>, false, GroupedOption>
        components={{
          DropdownIndicator: () => <SearchIcon />,
          IndicatorSeparator: () => null,
        }}
        options={searchResults}
        onInputChange={handleInputChange}
        onChange={handleSelectionValue}
        value={selectedOption}
        getOptionLabel={handleOptionLabel}
        getOptionValue={handleOptionValue}
        formatGroupLabel={GroupLabel}
        formatOptionLabel={formatOptionLabel}
        className="z-[1300] min-w-[8rem] w-full"
        placeholder={"Search for a transport route or stop"}
        styles={selectStyles}
      ></Select>
    </>
  );
}

const formatOptionLabel = (item: Stop | Route) => {
  if ("routeId" in item) {
    const { routeLongName, routeShortName } = item;
    return (
      <span>
        <b>{routeShortName ?? ""}:</b> {routeLongName ?? "unknown"}
      </span>
    );
  } else {
    const { stopId, stopCode, stopName } = item;
    return (
      <span>
        <b>{stopCode ?? stopId}:</b> {stopName ?? "unknown"}
      </span>
    );
  }
};

const SearchIcon = () => {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 text-gray-500 inline-block"
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
  );
};

function GroupLabel(data: GroupedOption) {
  return (
    <div style={groupStyles}>
      <span>{data.label}</span>
    </div>
  );
}

export default SearchInput;

const selectStyles = {
  control: (base: any) => ({
    ...base,
    flexDirection: "row-reverse",
  }),
  clearIndicator: (base: any) => ({
    ...base,
    position: "absolute",
    right: 0,
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    paddingLeft: "8px",
  }),
  menuList: (base: any) => ({
    ...base,
    minHeight: "400px", // your desired height
  }),
};

const groupStyles: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
