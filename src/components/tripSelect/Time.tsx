type Props = {
  time: string | null | undefined;
  column: "scheduled" | "arriving" | "delay";
  status?: "early" | "canceled" | "delayed" | "ontime";
};

const colors = {
  early: "green",
  canceled: "red",
  delayed: "red",
  ontime: "slate",
} as const;

const srText = {
  scheduled: "scheduled",
  arriving: "arriving",
  delay: "delay",
} as const;

function Time({ time, column, status = "ontime" }: Props) {
  const color = colors[status];
  const columnClasses = {
    scheduled: `w-16 md:w-20 text-right`,
    arriving: `w-16 md:w-20 text-right text-${color}-700 dark:text-${color}-500`,
    delay: `w-16 md:w-20 text-right text-${color}-700 dark:text-${color}-500`,
  };

  return (
    <>
      {
        <span className={column === "delay" && !time ? "hidden" : "sr-only"}>
          {srText[column]}
        </span>
      }
      <time dateTime={time || ""} className={columnClasses[column]}>
        {time || ""}
      </time>
    </>
  );
}

export default Time;
