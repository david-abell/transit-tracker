import { useEffect, useRef, createContext, useCallback } from "react";
import { trapKeyboardFocus } from "@/lib/trapKeyboardFocus";
import { Button } from "./ui/button";

type Props = {
  title: string;
  isOpen: boolean;
  onProceed?: () => void;
  onClose: () => void;
  children: React.ReactNode;
};

type DialogRefContext = {
  dialog: HTMLDialogElement | null;
};

export const DialogRefContext = createContext<DialogRefContext>({
  dialog: null,
});

function Modal({ isOpen, children, title, onProceed, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (isOpen && dialog) {
      dialog.showModal();
      document.body.classList.add("modal-open"); // prevent bg scroll
    } else {
      // wait for close animation
      setTimeout(() => {
        dialog.close();
        document.body.classList.remove("modal-open");
      }, 200);
    }
  }, [isOpen]);

  const handleProceed = () => {
    if (!onProceed) return;

    onProceed();
    handleClose();
  };

  const handleClose = () => {
    const dialog = ref.current;
    if (!dialog) return;

    onClose();
  };

  const preventAutoClose = (e: React.MouseEvent) => e.stopPropagation();

  const handleKeydown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!ref.current) return;

    if (e.key !== "Escape") {
      trapKeyboardFocus(e, ref.current);
    }
  };

  return (
    <dialog
      ref={ref}
      onCancel={handleClose}
      onClick={handleClose}
      data-state={isOpen ? "open" : "closed"}
      className="h-[100svh] max-h-[37.5rem] w-11/12 max-w-3xl overflow-hidden rounded-lg bg-background
      p-0 data-[state=closed]:animate-[dialog-content-hide_200ms_forwards] 
      data-[state=open]:animate-[dialog-content-show_200ms_forwards] backdrop:data-[state=closed]:animate-[dialog-overlay-hide_200ms_forwards] backdrop:data-[state=open]:animate-[dialog-overlay-show_200ms_forwards]
     dark:text-white"
    >
      <div
        onClick={preventAutoClose}
        className="flex h-full flex-col justify-between gap-2 p-4 md:p-6"
      >
        <h3 className="text-center text-2xl font-extrabold md:text-4xl">
          {title}
        </h3>
        <DialogRefContext.Provider value={{ dialog: ref?.current }}>
          <div className="mb-auto h-full overflow-hidden">{children}</div>
        </DialogRefContext.Provider>
        <div className="flex gap-3">
          <Button
            onClick={handleClose}
            onKeyDown={handleKeydown}
            className={`${onProceed ? "mr-auto" : "mx-auto"}`}
          >
            Close
          </Button>
          {!!onProceed && (
            <button
              onClick={handleProceed}
              onKeyDown={handleKeydown}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Proceed
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}

export default Modal;
