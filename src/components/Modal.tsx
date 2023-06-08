import { useEffect, useRef, createContext } from "react";
import { trapKeyboardFocus } from "@/lib/trapKeyboardFocus";

type Props = {
  title: string;
  isOpen: boolean;
  onProceed: () => void;
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
    if (isOpen && dialog) {
      dialog.showModal();
      document.body.classList.add("modal-open"); // prevent bg scroll
    } else {
      dialog?.close();
      document.body.classList.remove("modal-open");
    }
    return () => {
      dialog?.close();
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  const proceedAndClose = () => {
    onProceed();
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
      onCancel={onClose}
      onClick={onClose}
      className="h-[100svh] max-h-[37.5rem] w-full max-w-3xl overflow-hidden rounded-lg bg-slate-50 p-0 dark:bg-gray-800 dark:text-white"
    >
      <div
        onClick={preventAutoClose}
        className="flex h-full flex-col justify-between gap-4 p-6  md:gap-6"
      >
        <h3 className="text-center text-2xl font-extrabold md:text-4xl">
          {title}
        </h3>
        <DialogRefContext.Provider
          value={{ dialog: ref?.current ? ref.current : null }}
        >
          <div>{children}</div>
        </DialogRefContext.Provider>
        <div className="flex justify-between gap-3">
          <button
            onClick={onClose}
            onKeyDown={handleKeydown}
            className="mb-2 mr-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Close
          </button>
          <button
            onClick={proceedAndClose}
            onKeyDown={handleKeydown}
            className="mb-2 mr-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Proceed
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default Modal;
