import { ApiError } from "next/dist/server/api-utils";
import { StatusCodes, ReasonPhrases, getReasonPhrase } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";

import { TripIdAPIResponse } from "@/pages/api/gtfs/static/trips/[tripId]";
import { RouteAPIResponse } from "@/pages/api/gtfs/static/route";
import { StopTimesApiResponse } from "@/pages/api/gtfs/static/stop-times";
import { StopTimeByStopIdApiResponse } from "@/pages/api/gtfs/static/stop-times/[tripId]";
import { SingleRouteAPIResponse } from "@/pages/api/gtfs/static/route/[routeId]";
import { StopAPIResponse } from "@/pages/api/gtfs/static/stops/[stopId]";
import { CalendarAPIResponse } from "@/pages/api/gtfs/static/calendar";
import { ShapeAPIResponse } from "@/pages/api/gtfs/static/shape";
import { StopsAPIResponse } from "@/pages/api/gtfs/static/stops";
import { TripAPIResponse } from "@/pages/api/gtfs/static/trips";
import { UpcomingTripsAPIResponse } from "@/pages/api/gtfs/static/upcoming";
import { RealtimeTripUpdateResponse } from "@/pages/api/gtfs/realtime";

type ApiResponse =
  | SingleRouteAPIResponse
  | RouteAPIResponse
  | StopTimesApiResponse
  | StopTimeByStopIdApiResponse
  | StopsAPIResponse
  | StopAPIResponse
  | TripIdAPIResponse
  | CalendarAPIResponse
  | ShapeAPIResponse
  | StopsAPIResponse
  | TripAPIResponse
  | RealtimeTripUpdateResponse
  | UpcomingTripsAPIResponse;

export type ApiHandler<T = ApiResponse> = (
  req: NextApiRequest,
  res: NextApiResponse<T | ApiErrorResponse>
) => Promise<void | NextApiResponse<T | ApiErrorResponse>>;

type FetchHelper = (
  args: RequestInfo,
  init?: RequestInit
) => Promise<ApiResponse>;

export type ApiErrorResponse = { error: string };

export const fetchHelper: FetchHelper = async (input: RequestInfo) => {
  const url: string = Array.isArray(input) ? input[0] : input;

  const response = await fetch(url);
  let body: ApiResponse | ApiErrorResponse | undefined;

  try {
    body = (await response.json()) as ApiResponse | ApiErrorResponse;

    if (body && "error" in body) {
      throw new ApiError(response.status, body.error);
    }

    if (!response.ok) {
      throw new ApiError(response.status, getReasonPhrase(response.status));
    }

    return body;
  } catch (error) {
    console.log("caught error: ", body, error);

    if (error instanceof ApiError) {
      throw error;
    }

    if (body !== undefined && "error" in body) {
      throw new ApiError(
        response.status,
        body.error.length ? body.error : getReasonPhrase(response.status)
      );
    }
    throw new ApiError(response.status, getReasonPhrase(response.status));
  }
};
