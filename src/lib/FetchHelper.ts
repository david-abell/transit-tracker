type FetchHelper = (args: RequestInfo[]) => Promise<any>;

export const fetchHelper: FetchHelper = async (args: RequestInfo[]) => {
  const url = Array.isArray(args) ? args[0] : args;
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error("An error occurred while fetching the data.");
    return response.json();
  } catch (error) {
    if (error instanceof Error) console.log(error.message);
  }
};
