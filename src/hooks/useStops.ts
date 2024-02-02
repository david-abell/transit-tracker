import useSWR from "swr";
import { Stop } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";
import { StopsAPIResponse } from "@/pages/api/gtfs/static/stops";

type Props = {
  stopQuery?: string | null;
  routeId?: string | null;
};

function useStops({ stopQuery }: Props): {
  stopsError: ApiError | undefined;
  isLoadingStops: boolean;
  stops: Stop[] | undefined;
  stopsById: Map<string, Stop>;
};

function useStops({ routeId }: Props): {
  stopsError: ApiError | undefined;
  isLoadingStops: boolean;
  stops: Stop[] | undefined;
  stopsById: Map<string, Stop>;
};

function useStops({ stopQuery, routeId }: Props) {
  let params = "";

  if (stopQuery) {
    params = new URLSearchParams({ stopQuery }).toString();
  } else if (routeId) {
    params = new URLSearchParams({ routeId }).toString();
  }

  const subRoute = stopQuery ? "stops" : "route-stops";
  const url = `/api/gtfs/static/${subRoute}?${params}`;

  const shouldQuery = !!params;

  const {
    data: stops,
    error,
    isLoading,
  } = useSWR<StopsAPIResponse, ApiError>(
    () => (!!shouldQuery ? [url, params.toString()] : null),
    !!shouldQuery ? fetchHelper : null,
    skipRevalidationOptions,
  );

  const stopsById = new Map(
    stops?.map((stop) => {
      const { stopId } = stop;
      return [stopId, stop];
    }),
  );

  return {
    stopsError: error,
    isLoadingStops: isLoading,
    stops,
    stopsById,
  };
}

export default useStops;
