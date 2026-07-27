"use client";
// File responsibility: last-resort root error UI when the root layout fails.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;
  return (
    <html lang="en" className="dark">
      <body style={{ margin: 0, background: "#17212b", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100svh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
            gap: 12,
          }}
        >
          <h1 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>DigiHouse hit a snag</h1>
          <p style={{ fontSize: 14, opacity: 0.7, margin: 0, maxWidth: 280 }}>
            Please try again. If it keeps happening, reopen the Mini App from Telegram.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 8,
              height: 44,
              padding: "0 20px",
              borderRadius: 10,
              border: "none",
              background: "#3390ec",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
