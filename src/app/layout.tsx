import "./globals.css";
import type { Metadata, Viewport } from "next";
import Head from "next/head";
import type { ReactNode } from "react";

const APP_NAME = "Fridge Board";
const APP_DEFAULT_TITLE = "FridgeBoard";
const APP_TITLE_TEMPLATE = "%s - PWA App";
const APP_DESCRIPTION = "Whiteboard for your fridge!";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  // manifest: new URL("/manifest.json", "https://fosse.co/board/").href,
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  viewportFit: "cover",
  maximumScale: 1,
  minimumScale: 1,
  initialScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      {/* <head /> */}
      <head>
        <link rel="manifest" href="/board/manifest.webmanifest" crossOrigin="use-credentials" />
      </head>
      <body>{children}</body>
    </html>
  );
}