type Props = {
  time: string | null | undefined;
  column: "scheduled" | "arriving" | "delay";
  status?: "early" | "canceled" | "delayed" | "ontime";
};

const textClasses = {
  early: "text-green-700 dark:text-green-500",
  canceled: "text-red-700 dark:text-red-500",
  delayed: "text-red-700 dark:text-red-500",
  ontime: "text-slate-700 dark:text-slate-500",
} as const;

const srText = {
  scheduled: "scheduled",
  arriving: "arriving",
  delay: "delay",
} as const;

function Time({ time, column, status = "ontime" }: Props) {
  return (
    <>
      {
        <span className={column === "delay" && !time ? "hidden" : "sr-only"}>
          {srText[column]}
        </span>
      }
      <time
        dateTime={time || ""}
        className={`w-16 text-right md:w-20 ${textClasses[status]}`}
      >
        {time || ""}
      </time>
    </>
  );
}

export default Time;
