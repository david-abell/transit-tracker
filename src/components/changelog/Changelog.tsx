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

function Changelog() {
  return (
    <Dialog open>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold">Changelog</DialogTitle>
        </DialogHeader>
        {changelogs.map((record) => (
          <Version key={"version: " + record.version} {...record} />
        ))}
        <DialogFooter>
          <DialogClose>Dismiss</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Changelog;
