import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { changelogs } from "./changelogs";
import Version from "./Version";
import { useLocalStorage } from "usehooks-ts";
import packageJson from "package.json";
import { useEffect } from "react";
const packageAppVersion = packageJson.version;

const VERSION_KEY = "app-version";
const NEW_USER_KEY = "new-user";

type Props = {
  show: boolean;
  setShow: (s: boolean) => void;
};

function Changelog({ show, setShow }: Props) {
  const [appVersion, setAppVersion] = useLocalStorage(VERSION_KEY, "default");
  const [newUser, setNewUser] = useLocalStorage(NEW_USER_KEY, "default");

  // Radix onOpenchange only triggers on dialog close
  const handleOpenChange = () => {
    setAppVersion(packageAppVersion);
    setShow(false);
    setNewUser("false");
  };

  useEffect(() => {
    if (appVersion === "default") {
      setAppVersion(packageAppVersion);
    } else if (appVersion === packageAppVersion && newUser === "default") {
      setNewUser("true");
      setShow(true);
    } else if (appVersion !== packageAppVersion) {
      setShow(true);
    }
  }, [appVersion, newUser, setAppVersion, setNewUser, setShow]);

  if (appVersion === "default" || show === false) return null;

  return (
    <Dialog open={show} onOpenChange={handleOpenChange}>
      <DialogTrigger className="sr-only">Open</DialogTrigger>
      <DialogContent className="max-w-[90dvw] md:max-w-lg rounded-lg">
        <DialogHeader>
          <DialogTitle className="font-bold">Changelog</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[70dvh]">
          {changelogs.map((record) => (
            <Version key={"version: " + record.version} {...record} />
          ))}
        </div>
        <DialogFooter>
          <DialogClose>Dismiss</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Changelog;
