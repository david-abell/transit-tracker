type FocusableElement =
  | HTMLAnchorElement
  | HTMLButtonElement
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
  | HTMLDetailsElement;

export function getKeyboardFocusableElements(element: HTMLElement) {
  return [
    ...element.querySelectorAll<FocusableElement>(
      'a, button, input, textarea, select, details,[tabindex]:not([tabindex="-1"])'
    ),
  ].filter((el) => !el.hasAttribute("disabled"));
}

export function trapKeyboardFocus(
  event: React.KeyboardEvent<HTMLElement>,
  element: HTMLElement
) {
  const focusables = getKeyboardFocusableElements(element);
  const firstFocusable = focusables[0];
  const lastFocusable = focusables[focusables.length - 1];
  const focused = document.activeElement;
  const focusIndex = focusables.findIndex((el) => el === focused);

  if (event.key === "Escape") {
    event.preventDefault();
  }

  if (focused === lastFocusable) {
    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      firstFocusable.focus();
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      firstFocusable.focus();
    }
  }

  if (focused !== lastFocusable && event.key === "ArrowDown") {
    focusables[focusIndex + 1].focus();
  }

  if (focused === firstFocusable) {
    if (event.key === "Tab" && event.shiftKey) {
      event.preventDefault();
      lastFocusable.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      lastFocusable.focus();
    }
  }

  if (focused !== firstFocusable && event.key === "ArrowUp") {
    focusables[focusIndex - 1].focus();
  }
}
