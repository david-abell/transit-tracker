import { ApiError } from "next/dist/server/api-utils";

type FetchHelper = (args: RequestInfo[]) => Promise<any>;

export const fetchHelper: FetchHelper = async (args: RequestInfo[]) => {
  const url = Array.isArray(args) ? args[0] : args;
  const response = await fetch(url);

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }

  return response.json();
};
