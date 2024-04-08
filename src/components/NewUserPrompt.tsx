import { Alert, AlertDescription, AlertVariants } from "./ui/alert";
import { Dispatch, SetStateAction } from "react";
import { Button } from "./ui/button";
import { AlertCircle } from "lucide-react";

type Props = {
  isMobile: boolean;
  variant?: AlertVariants;
  visible?: boolean;
  setShowMenu: Dispatch<SetStateAction<boolean>>;
  showMenu: boolean;
};

export function NewUserPrompt({
  isMobile,
  variant = "default",
  visible = true,
  setShowMenu,
  showMenu,
}: Props) {
  if (!visible) return null;

  return (
    <Alert
      variant={variant}
      className="pointer-events-none absolute bottom-32 left-1/2 z-[1100] w-max max-w-full -translate-x-1/2 border-gray-400 dark:border-gray-50 [&>button~*]:pl-12 "
    >
      {isMobile ? (
        <Button
          onClick={() => setShowMenu((prev) => !prev)}
          size="icon"
          className={`p-2.5 absolute ${!showMenu ? "attention-pulse" : ""} pointer-events-auto`}
          aria-controls="navbar-hamburger"
          aria-expanded={showMenu}
          disabled={showMenu}
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className={"h-6 w-6"}
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            ></path>
          </svg>
        </Button>
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {/* <AlertTitle className="bg-transparent">Error</AlertTitle> */}
      <AlertDescription className="bg-transparent min-h-10 text-lg">
        Welcome to the Irish bus tracker. Try searching for a bus name like{" "}
        <b>Ballycullen Road</b>, a route number like <b>15</b>, or a specific
        stop code like <b>4495</b>.
      </AlertDescription>
    </Alert>
  );
}

export default NewUserPrompt;
