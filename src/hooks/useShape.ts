import useSWR from "swr";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";

import { ShapeAPIResponse } from "@/pages/api/gtfs/static/shape";

function useShape(tripId: string | null) {
  const {
    data: shape,
    error,
    isValidating,
  } = useSWR<ShapeAPIResponse, ApiError>(
    !!tripId
      ? [
          `/api/gtfs/static/shape?${new URLSearchParams({
            tripId,
          })}`,
        ]
      : null,
    fetchHelper,
    skipRevalidationOptions,
  );

  return {
    shapeError: error,
    isLoadingShape: isValidating,
    shape,
  };
}

export default useShape;
