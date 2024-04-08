import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HelpCircle, Info } from "lucide-react";
import { ReactNode, Ref } from "react";
import { Popup } from "react-leaflet";

type Props = {
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  variant?: "info" | "default";
  children: ReactNode;
};

function Tooltip({
  align = "center",
  children,
  side,
  sideOffset,
  variant = "default",
}: Props) {
  return (
    <Popover>
      <PopoverTrigger>
        {variant === "default" ? (
          <HelpCircle className="text-green-700 dark:text-green-500" />
        ) : (
          <Info className="text-yellow-700 dark:text-yellow-500" />
        )}
      </PopoverTrigger>
      <PopoverContent align={align} side={side} sideOffset={sideOffset}>
        {children}
      </PopoverContent>
    </Popover>
  );
}

export default Tooltip;
