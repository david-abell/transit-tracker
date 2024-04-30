import { expect, test, vi, describe } from "vitest";
import { render, screen } from "@testing-library/react";
import Index from "../../src/pages/index";
import mockRouter from "next-router-mock";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

describe("Index", () => {
  it("should render the navigation hamburger button", () => {
    render(
      <AppRouterContext.Provider value={mockRouter as any}>
        <Index />
      </AppRouterContext.Provider>,
    );
    expect(
      screen.getByRole("button", { name: /Open main menu/ }),
    ).toBeDefined();
  });
});
