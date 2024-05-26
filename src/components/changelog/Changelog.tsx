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
      <DialogContent className="max-w-[90dvw] md:max-w-lg rounded-lg">
        <DialogHeader>
          <DialogTitle className="font-bold">Changelog</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-scroll max-h-[70dvh]">
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
