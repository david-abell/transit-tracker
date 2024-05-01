import { beforeAll, vi } from "vitest";

vi.mock("next/router", () => ({
  useRouter: vi.fn().mockImplementation(() => {}),
}));

beforeAll(() => {
  // mock window.matchMedia for useMediaQuery
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});
