import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useForm } from "react-hook-form";
import { Stop } from "@prisma/client";

type Props = {
  closeHandler: () => void;
  optionHandler: (stopId: string, showModal?: boolean | undefined) => void;
  open: boolean;
  stops: Stop[];
  title: string;
};

function StopModal({ open, stops, title, closeHandler, optionHandler }: Props) {
  const onSubmit = (data: Stop) => {
    if (data.stopId) {
      optionHandler(data.stopId);
    }
    closeHandler();
  };

  const form = useForm<Stop>();
  return (
    <Dialog open={open} onOpenChange={closeHandler}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 ">
            <div className="min-h-[26rem] max-h-[80dvh] overflow-y-auto">
              <FormField
                control={form.control}
                name="stopId"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        {stops.map((stop) => {
                          return (
                            <FormItem
                              key={"modal-select" + stop.stopId}
                              className="flex items-center space-x-3 space-y-0"
                            >
                              <FormControl>
                                <RadioGroupItem value={stop.stopId} />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {stop.stopCode} {stop.stopName}
                              </FormLabel>
                            </FormItem>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="">
              <DialogClose variant="secondary" onClick={closeHandler}>
                Cancel
              </DialogClose>
              <DialogClose type="submit">Confirm</DialogClose>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default StopModal;
