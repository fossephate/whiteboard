import "./globals.css";
import type { Metadata, Viewport } from "next";
import { useEffect, type ReactNode } from "react";

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
};

export const viewport: Viewport = {
  themeColor: "#282828",
  // themeColor: "#f9fafb",// off-white
  viewportFit: "cover",
  maximumScale: 1,
  minimumScale: 1,
  initialScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link key="manifest" rel="manifest" href="/board/manifest.webmanifest" crossOrigin="use-credentials" />
        {/* <meta name="theme-color" content="#f9fafb" /> */}
      </head>
      <body>{children}</body>
    </html>
  );
}