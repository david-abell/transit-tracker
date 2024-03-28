type Status = "early" | "canceled" | "delayed" | "ontime" | "departed";
type Column = "scheduled" | "arriving" | "delay";
type Props = {
  time: string | null | undefined;
  column: Column;
  status?: Status;
};

const textClasses = {
  early: "text-green-700 dark:text-green-500",
  canceled: "text-red-700 dark:text-white",
  delayed: "text-red-700 dark:text-red-500",
  departed: "",
  ontime: "",
} as const;

const srText = {
  scheduled: "scheduled",
  arriving: "arriving",
  delay: "delay",
  departed: "departed",
} as const;

function Time({ time, column, status = "ontime" }: Props) {
  return (
    <>
      {
        <span className={column === "delay" && !time ? "hidden" : "sr-only"}>
          {srText[column]}
        </span>
      }
      {status === "canceled" && column === "arriving" ? (
        <span className={`w-20 text-right ${textClasses[status]}`}>
          Canceled
        </span>
      ) : (
        <time
          dateTime={time || ""}
          className={`w-20 text-right ${textClasses[status]}`}
        >
          {time || ""}
        </time>
      )}
    </>
  );
}

export default Time;
