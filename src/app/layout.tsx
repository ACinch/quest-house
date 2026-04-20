import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * Hidden build version — the short SHA of the most recent commit on
 * main at the time this code was pushed. Updated manually on every
 * push so `view-source` / inspector shows which commit the live
 * deploy was built from. Not rendered visibly anywhere on the page.
 */
const BUILD_COMMIT = "27135d9";

export const metadata: Metadata = {
  title: "Quest House — Neurospicy Household Reset",
  description:
    "A Minecraft-themed chore + reward system for the neurospicy household.",
  other: {
    "build-commit": BUILD_COMMIT,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1a2e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
