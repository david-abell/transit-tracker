import { GTFSResponse } from "@/pages/api/gtfsrealtime";
import useSWR, { Fetcher } from "swr";

const fetcher = async (input: RequestInfo, init: RequestInit) => {
  try {
    const response = await fetch(input, init);
    if (!response.ok)
      throw new Error("An error occurred while fetching the data.");
    return response.json();
  } catch (error) {
    if (error instanceof Error) console.log(error.message);
  }
};

const API_URL = "/api/gtfsrealtime/";

function useRealtime() {
  const { data, error, isLoading } = useSWR<GTFSResponse>(API_URL, fetcher);

  return {
    realtimeData: data,
    isLoading,
    isError: error,
  };
}

export default useRealtime;
