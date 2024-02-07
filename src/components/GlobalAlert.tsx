import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertVariants } from "./ui/alert";
import { ReactNode } from "react";

type Props = {
  visible?: boolean;
  variant?: AlertVariants;
  children: ReactNode;
};

export function GlobalAlert({
  children,
  visible = true,
  variant = "default",
}: Props) {
  if (!visible) return null;

  return (
    <Alert
      variant={variant}
      className="pointer-events-none absolute bottom-24 left-1/2 z-[9999] w-max max-w-full -translate-x-1/2 border-gray-400 dark:border-gray-50"
    >
      <AlertCircle className="h-4 w-4" />
      {/* <AlertTitle className="bg-transparent">Error</AlertTitle> */}
      <AlertDescription className="bg-transparent">{children}</AlertDescription>
    </Alert>
  );
}

export default GlobalAlert;
