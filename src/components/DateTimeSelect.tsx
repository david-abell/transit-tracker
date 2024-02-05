import { initDateTimeValue } from "@/lib/timeHelpers";
import router from "next/router";
import { Dispatch, SetStateAction } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type Props = {
  selectedDateTime: string;
  setSelectedDateTime: Dispatch<SetStateAction<string>>;
  className?: string;
};

function DateTimeSelect({
  selectedDateTime,
  setSelectedDateTime,
  className,
}: Props) {
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
    <div className={cn("flex lg:max-w-72 w-full", className)}>
      <label htmlFor="date-time-select" className="sr-only">
        When are you traveling?{" "}
      </label>
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
        className="h-10 w-16 rounded-r-lg rounded-l-none"
      >
        Now!
      </Button>
    </div>
  );
}

export default DateTimeSelect;
