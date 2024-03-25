import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type Props = {
  selectedDateTime: string;
  handleTimeChange: (e?: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
};

function DateTimeSelect({
  handleTimeChange,
  className,
  selectedDateTime,
}: Props) {
  return (
    <div className={cn("flex w-full", className)}>
      <label htmlFor="date-time-select" className="sr-only">
        When are you traveling?{" "}
      </label>
      <input
        type="datetime-local"
        value={selectedDateTime}
        onChange={(e) => handleTimeChange(e)}
        id="date-time-select"
        className="h-10 flex-1 rounded-l-lg rounded-r-none border p-2.5 text-sm"
      ></input>
      <Button
        aria-controls="date-time-select"
        onClick={() => handleTimeChange()}
        className="h-10 w-16 rounded-r-lg rounded-l-none"
      >
        Now!
      </Button>
    </div>
  );
}

export default DateTimeSelect;
