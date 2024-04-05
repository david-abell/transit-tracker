import { useState } from "react";
import { useInterval } from "usehooks-ts";

export type LiveTextColor = "alert" | "caution" | "info" | "default";

type Props = {
  content: string | (() => string);
  color?: LiveTextColor;
  delayInMilliseconds?: number;
};

const colors = {
  alert: "text-red-700 dark:text-red-500",
  caution: "yellow",
  info: "text-green-700 dark:text-green-500",
  default: "",
};

function LiveText({
  content,
  color = "default",
  delayInMilliseconds = 1000,
}: Props) {
  const [textContent, setTextContent] = useState(
    typeof content === "string" ? content : content(),
  );

  useInterval(() => {
    setTextContent(typeof content === "string" ? content : content());
  }, delayInMilliseconds);
  return <span className={colors[color]}>{textContent}</span>;
}

export default LiveText;
