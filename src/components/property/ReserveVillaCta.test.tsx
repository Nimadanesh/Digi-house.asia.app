// Reserve Villa CTA — secondary full-width external link to the property's
// official Rental Escapes listing. URL arrives via props from the view-model
// (canonical data); the component never constructs or guesses URLs.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ReserveVillaCta } from "@/components/property/ReserveVillaCta";

const URL =
  "https://www.rentalescapes.com/rentals/luxury-villa-rentals-asia/maldives/bodufushi/joali-being/grand-2-bdm-ocean-pool-villa-128862";

describe("ReserveVillaCta", () => {
  it("renders the localized label with the exact canonical URL", () => {
    render(<ReserveVillaCta url={URL} />);
    const cta = screen.getByTestId("reserve-villa-cta");
    expect(cta).toHaveTextContent("View & Reserve");
    expect(cta).toHaveAttribute("href", URL);
  });

  it("opens externally with safe rel (Telegram WebView compatible)", () => {
    render(<ReserveVillaCta url={URL} />);
    const cta = screen.getByTestId("reserve-villa-cta");
    expect(cta.tagName).toBe("A");
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders nothing without a URL (never a broken CTA)", () => {
    const { container } = render(<ReserveVillaCta url={null} />);
    expect(screen.queryByTestId("reserve-villa-cta")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("is secondary and full-width (subordinate to the primary CTA)", () => {
    render(<ReserveVillaCta url={URL} />);
    const cta = screen.getByTestId("reserve-villa-cta");
    expect(cta.className).toContain("w-full");
    expect(cta.className).not.toContain("bg-primary");
  });
});
