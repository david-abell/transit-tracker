import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

function NavItem({ children, className }: Props) {
  return (
    <li
      className={cn(
        "flex w-full justify-center lg:w-auto items-center",
        className,
      )}
    >
      {children}
    </li>
  );
}

export default NavItem;
