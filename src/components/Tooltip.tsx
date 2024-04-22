import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HelpCircle, Info, X } from "lucide-react";
import { ReactNode } from "react";

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
    <Popover modal>
      <PopoverTrigger>
        {variant === "default" ? (
          <HelpCircle className="text-green-700 dark:text-green-500 inline-block" />
        ) : (
          <Info className="text-yellow-700 dark:text-yellow-500 inline-block" />
        )}
      </PopoverTrigger>
      <PopoverContent align={align} side={side} sideOffset={sideOffset}>
        {children}
        <PopoverClose className="text-red-700 absolute right-4 top-4">
          <X />
        </PopoverClose>
      </PopoverContent>
    </Popover>
  );
}

export default Tooltip;
