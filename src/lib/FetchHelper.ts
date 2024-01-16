import { ApiError } from "next/dist/server/api-utils";

type FetchHelper = (args: RequestInfo[]) => Promise<any>;

export const fetchHelper: FetchHelper = async (args: RequestInfo[]) => {
  const url = Array.isArray(args) ? args[0] : args;
  const response = await fetch(url);

  if (!response.ok) {
    const res = await response.json();

    throw new ApiError(response.status, res);
  }

  return response.json();
};
