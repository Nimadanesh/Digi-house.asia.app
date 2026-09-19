// TDD RED — gallery lightbox: tap a photo → fullscreen overlay with
// arrows/keyboard/swipe nav, "n/N" counter, close via X / backdrop / Escape.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PropertyGallery } from "@/components/property/PropertyGallery";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

const IMAGES = ["/p1.png", "/p2.png", "/p3.png"];

function renderGallery() {
  return render(<PropertyGallery images={IMAGES} title="Test Villa" />);
}

describe("PropertyGallery lightbox", () => {
  it("stays closed initially; the inline gallery renders normally", () => {
    renderGallery();
    expect(screen.getByTestId("property-gallery")).toBeInTheDocument();
    expect(screen.queryByTestId("image-lightbox")).not.toBeInTheDocument();
  });

  it("opens on the tapped photo with a 1-based counter", () => {
    renderGallery();
    fireEvent.click(screen.getByTestId("gallery-slide-2"));
    expect(screen.getByTestId("image-lightbox")).toBeInTheDocument();
    expect(screen.getByTestId("image-lightbox-counter")).toHaveTextContent("2/3");
  });

  it("navigates with arrow buttons and wraps around", () => {
    renderGallery();
    fireEvent.click(screen.getByTestId("gallery-slide-1"));
    expect(screen.getByTestId("image-lightbox-counter")).toHaveTextContent("1/3");
    fireEvent.click(screen.getByTestId("image-lightbox-next"));
    expect(screen.getByTestId("image-lightbox-counter")).toHaveTextContent("2/3");
    fireEvent.click(screen.getByTestId("image-lightbox-prev"));
    expect(screen.getByTestId("image-lightbox-counter")).toHaveTextContent("1/3");
    fireEvent.click(screen.getByTestId("image-lightbox-prev"));
    expect(screen.getByTestId("image-lightbox-counter")).toHaveTextContent("3/3");
  });

  it("navigates with keyboard arrows", () => {
    renderGallery();
    fireEvent.click(screen.getByTestId("gallery-slide-1"));
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(screen.getByTestId("image-lightbox-counter")).toHaveTextContent("2/3");
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByTestId("image-lightbox-counter")).toHaveTextContent("1/3");
  });

  it("closes via X, backdrop, and Escape; gallery stays intact", () => {
    renderGallery();
    fireEvent.click(screen.getByTestId("gallery-slide-1"));
    fireEvent.click(screen.getByTestId("image-lightbox-close"));
    expect(screen.queryByTestId("image-lightbox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("gallery-slide-1"));
    fireEvent.click(screen.getByTestId("image-lightbox"));
    expect(screen.queryByTestId("image-lightbox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("gallery-slide-1"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("image-lightbox")).not.toBeInTheDocument();

    // Inline gallery unaffected by open/close cycles.
    expect(screen.getByTestId("property-gallery")).toBeInTheDocument();
  });

  it("swipes between photos inside the lightbox", () => {
    renderGallery();
    fireEvent.click(screen.getByTestId("gallery-slide-1"));
    const viewport = screen.getByTestId("image-lightbox-viewport");
    fireEvent.touchStart(viewport, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(viewport, { changedTouches: [{ clientX: 100 }] });
    expect(screen.getByTestId("image-lightbox-counter")).toHaveTextContent("2/3");
  });
});
