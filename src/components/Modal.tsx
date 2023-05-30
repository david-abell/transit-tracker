import { useEffect, useRef } from "react";

type Props = {
  title: string;
  isOpen: boolean;
  onProceed: () => void;
  onClose: () => void;
  children: React.ReactNode;
};

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

  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={onClose}
      className="w-full max-w-3xl overflow-visible rounded-lg bg-slate-50 p-0 dark:bg-slate-700 dark:text-white"
    >
      <div
        onClick={preventAutoClose}
        className="flex h-full flex-col gap-6 p-6"
      >
        <h3 className="text-center text-4xl font-extrabold">{title}</h3>
        <div>{children}</div>
        <div className="mt-auto flex justify-between gap-3">
          <button
            onClick={onClose}
            className="rounded border border-gray-400 bg-white px-4 py-2 font-semibold text-gray-800 shadow hover:bg-gray-100"
          >
            Close
          </button>
          <button
            onClick={proceedAndClose}
            className="rounded border border-gray-400 bg-white px-4 py-2 font-semibold text-gray-800 shadow hover:bg-gray-100"
          >
            Proceed
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default Modal;
