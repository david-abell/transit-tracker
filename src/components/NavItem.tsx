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
        "flex w-full justify-center lg:w-auto items-center [&>a]:max-sm:text-secondary [&>a]:text-primary [&>a]:hover:underline [&>button]:font-medium [&>button]:text-base [&>button]:text-center [&>a]:max-sm:bg-primary [&>a]:max-sm:px-4 [&>a]:max-sm:py-2 [&>a]:max-sm:rounded-md [&>a]:flex [&>a]:flex-row [&>a]:items-center [&>a]:justify-center",
        className,
      )}
    >
      {children}
    </li>
  );
}

export default NavItem;
