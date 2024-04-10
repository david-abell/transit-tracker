type Status = "early" | "canceled" | "delayed" | "ontime";
type Column = "scheduled" | "arriving" | "delay";
type Props = {
  column: Column;
  departed: boolean;
  status?: Status;
  time: string | null | undefined;
};

const textClasses = {
  early: "text-green-700 dark:text-green-500",
  canceled: "text-red-700 dark:text-white",
  delayed: "text-red-700 dark:text-red-500",
  ontime: "",
} as const;

function Time({ column, departed, status = "ontime", time }: Props) {
  if (column === "delay") {
    return (
      <>
        <span className={!time ? "hidden" : "sr-only"}>delay</span>
        <time
          dateTime={time || ""}
          className={`w-20 text-right ${textClasses[status]}`}
        >
          {time || ""}
        </time>
      </>
    );
  }

  if (column === "scheduled") {
    return (
      <>
        <span className={!time ? "hidden" : "sr-only"}>scheduled</span>
        <time
          dateTime={time || ""}
          className={`w-20 text-right ${textClasses[status]}`}
        >
          {time || ""}
        </time>
      </>
    );
  }

  return (
    <>
      <span className={!time ? "hidden" : "sr-only"}>arriving</span>
      {status === "canceled" ? (
        <span className={`w-20 text-right ${textClasses[status]}`}>
          Canceled
        </span>
      ) : (
        <time
          dateTime={time || ""}
          className={`w-20 text-right ${textClasses[status]}  ${departed ? "line-through" : ""}`}
        >
          {time || ""}
        </time>
      )}
    </>
  );
}

export default Time;
