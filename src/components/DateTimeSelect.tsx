import { initDateTimeValue } from "@/lib/timeHelpers";
import router from "next/router";
import { Dispatch, SetStateAction } from "react";
import { Button } from "./ui/button";

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
          className="h-10 flex-1 rounded-l-lg rounded-r-none border p-2.5 text-sm"
        ></input>
        <Button
          aria-controls="date-time-select"
          onClick={handleNowTime}
          className="h-10 w-16 rounded-r-lg rounded-l-none border p-2.5 text-sm font-medium text-white"
        >
          Now!
        </Button>
      </div>
    </div>
  );
}

export default DateTimeSelect;
