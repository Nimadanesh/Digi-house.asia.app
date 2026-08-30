import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "FractionalLuxe — Fractional Property on TON",
  description: "Buy, sell, and earn rental yield from fractionalized real estate on the TON blockchain.",
  applicationName: "FractionalLuxe",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#17212b",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // suppressHydrationWarning on <html>: browser wallet extensions (e.g. OKX Wallet, whose
  // inpage.js injects `--app-font-family` onto <html> before React hydrates) cause the server
  // and client <html> attribute set to differ. This is the React-canonical fix for
  // browser-extension root-tag mutations — it only silences warnings on this element, not its
  // children, so genuine hydration mismatches elsewhere still surface. See React docs:
  // https://react.dev/reference/react-dom/components/common#suppressing-unavoidable-hydration-mismatch-errors
  return (
    <html lang="en" dir="ltr" className="dark h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}