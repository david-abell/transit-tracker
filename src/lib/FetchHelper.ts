import { ApiError } from "next/dist/server/api-utils";
import { StatusCodes, ReasonPhrases, getReasonPhrase } from "http-status-codes";
import { TripIdAPIResponse } from "@/pages/api/gtfs/static/trips/[tripId]";
import { RouteAPIResponse } from "@/pages/api/gtfs/static/route";
import { Fetcher } from "swr";
import { StopTimesApiResponse } from "@/pages/api/gtfs/static/stop-times";
import { StopTimeByStopIdApiResponse } from "@/pages/api/gtfs/static/stop-times/[tripId]";
import { SingleRouteAPIResponse } from "@/pages/api/gtfs/static/route/[routeId]";
import { StopAPIResponse } from "@/pages/api/gtfs/static/stops/[stopId]";
import { CalendarAPIResponse } from "@/pages/api/gtfs/static/calendar";
import { RouteStopsAPIResponse } from "@/pages/api/gtfs/static/route-stops";
import { ShapeAPIResponse } from "@/pages/api/gtfs/static/shape";
import { StopsAPIResponse } from "@/pages/api/gtfs/static/stops";
import { TripAPIResponse } from "@/pages/api/gtfs/static/trips";
import { UpcomingTripsAPIResponse } from "@/pages/api/gtfs/static/upcoming";
import { RealtimeTripUpdateResponse } from "@/pages/api/gtfs/realtime";
import { NextApiRequest, NextApiResponse } from "next";

type ApiResponse =
  | RouteAPIResponse
  | SingleRouteAPIResponse
  | StopTimesApiResponse
  | StopTimeByStopIdApiResponse
  | StopAPIResponse
  | TripIdAPIResponse
  | CalendarAPIResponse
  | RouteStopsAPIResponse
  | ShapeAPIResponse
  | StopsAPIResponse
  | TripAPIResponse
  | UpcomingTripsAPIResponse
  | RealtimeTripUpdateResponse;

export type ApiHandler<ApiResponse> = (
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | ApiErrorResponse>
) => Promise<void | NextApiResponse<RouteAPIResponse | ApiErrorResponse>>;

type FetchHelper = (args: RequestInfo[]) => Promise<ApiResponse | undefined>;

export type ApiErrorResponse = { error: string };

export const fetchHelper: FetchHelper = async (args: RequestInfo[]) => {
  const url = Array.isArray(args) ? args[0] : args;
  const response = await fetch(url);
  let body: ApiResponse | ApiErrorResponse | undefined;

  try {
    body = await response.json();

    if (!response.ok || (body && "error" in body)) {
      console.log("throwing: ", response.status, body);
      throw new ApiError(
        response.status,
        !!body && "error" in body
          ? body.error
          : getReasonPhrase(response.status)
      );
    }
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
  }

  return body;
};
