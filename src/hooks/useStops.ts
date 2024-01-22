import useSWR from "swr";
import { Stop } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";

type Props = {
  stopQuery?: string;
  routeId?: string;
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
  let params: URLSearchParams | undefined;

  if (stopQuery) {
    params = new URLSearchParams({ stopQuery });
  } else if (routeId) {
    params = new URLSearchParams({ routeId });
  }

  const subRoute = stopQuery ? "stops" : "route-stops";

  const shouldQuery = params !== undefined;

  const {
    data: stops,
    error,
    isLoading,
  } = useSWR<Stop[], ApiError>(
    () => (!!shouldQuery ? `/api/gtfs/static/${subRoute}?${params}` : null),
    fetchHelper,
    skipRevalidationOptions
  );

  const stopsById = new Map(
    stops?.map((data) => {
      const { stopId } = data;
      return [stopId, data];
    })
  );

  return {
    stopsError: error,
    isLoadingStops: isLoading,
    stops,
    stopsById,
  };
}

export default useStops;
