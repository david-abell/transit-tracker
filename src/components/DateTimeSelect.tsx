import { initDateTimeValue } from "@/lib/timeHelpers";
import router from "next/router";
import { Dispatch, SetStateAction } from "react";

type Props = {
  selectedDateTime: string;
  setSelectedDateTime: Dispatch<SetStateAction<string>>;
};

function DateTimeSelect({ selectedDateTime, setSelectedDateTime }: Props) {
  const handleSetSelectedDateTime = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSelectedDateTime(e.target.value);
    const queries = router.query;
    delete queries["tripId"];
    router.push({ query: queries }, undefined, { shallow: false });
  };

  const handleNowTime = () => {
    const now = initDateTimeValue();
    setSelectedDateTime(now);
    const queries = router.query;
    delete queries["tripId"];
    router.push({ query: queries }, undefined, { shallow: false });
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center lg:flex-none">
      <label htmlFor="date-time-select" className="sr-only">
        When are you traveling?{" "}
      </label>
      <div className="flex w-full">
        <input
          type="datetime-local"
          value={selectedDateTime}
          onChange={(e) => handleSetSelectedDateTime(e)}
          id="date-time-select"
          className="flex-1 rounded-l-lg rounded-r-none border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-blue-500 
         focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        ></input>
        <button
          aria-controls="date-time-select"
          type="button"
          onClick={handleNowTime}
          className="w-16 rounded-r-lg border border-blue-700 bg-blue-700 p-2.5 text-sm font-medium text-white 
          hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Now!
        </button>
      </div>
    </div>
  );
}

export default DateTimeSelect;
