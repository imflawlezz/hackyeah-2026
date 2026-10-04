"use client";

import { useEffect, useRef } from "react";

// Replaces the root layout, so globals.css and the theme tokens are not
// loaded. Inline styles and CSS system colours keep it readable on their own.
const systemFont =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const actionStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "2.75rem",
  padding: "0.5rem 1rem",
  font: "inherit",
  fontWeight: 600,
  color: "ButtonText",
  background: "ButtonFace",
  border: "2px solid ButtonText",
  borderRadius: "0.5rem",
  textDecoration: "none",
  cursor: "pointer",
};

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    console.error("Unexpected error", error.digest);
  }, [error]);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <html lang="pl">
      <head>
        <title>Coś poszło nie tak · HubMI.pl</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: systemFont,
          fontSize: "1.125rem",
          lineHeight: 1.5,
          color: "CanvasText",
          background: "Canvas",
        }}
      >
        <main style={{ maxWidth: "40rem", padding: "2rem 1rem" }}>
          <h1
            ref={headingRef}
            tabIndex={-1}
            style={{ fontSize: "1.875rem", lineHeight: 1.25, outline: "none" }}
          >
            Coś poszło nie tak
          </h1>
          <p>
            Spróbuj ponownie. Jeśli błąd się powtórzy, wróć do strony głównej.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <button type="button" onClick={() => retry()} style={actionStyle}>
              Spróbuj ponownie
            </button>
            {/* A plain <a> forces a full reload, which rebuilds the root layout. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={actionStyle}>
              Przejdź do strony głównej
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
