type FetchHelper = (args: RequestInfo[]) => Promise<any>;

export interface ErrorWithCause extends Error {
  info?: ReturnType<Body["json"]>;
  status?: Response["status"];
}

export const fetchHelper: FetchHelper = async (args: RequestInfo[]) => {
  const url = Array.isArray(args) ? args[0] : args;
  const response = await fetch(url);
  if (!response.ok) {
    const error: ErrorWithCause = new Error(
      "An error occurred while fetching the data."
    );
    // Attach extra info to the error object.
    error.info = await response.json();
    error.status = response.status;
    throw error;
  }
  return response.json();
};
