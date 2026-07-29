import type { Metadata, Viewport } from "next";
import { IosInstallGuide } from "../components/pwa/ios-install-guide";
import { NetworkStatusToast } from "../components/pwa/network-status-toast";
import { PwaInstallProvider } from "../components/pwa/pwa-install-provider";
import { PwaUpdateToast } from "../components/pwa/pwa-update-toast";
import { ServiceWorkerRegister } from "../components/pwa/service-worker-register";
import "./globals.css";

const appDescription =
  "Event, competition and coding forum management platform for Kongu Engineering College.";

export const metadata: Metadata = {
  title: {
    default: "KEC Coding Forum",
    template: "%s | KEC Coding Forum",
  },
  description: appDescription,
  applicationName: "KEC Coding Forum",
  manifest: "/manifest.webmanifest",
  keywords: [
    "KEC",
    "Kongu Engineering College",
    "Coding Forum",
    "Events",
    "Hackathons",
    "Competitions",
  ],
  authors: [{ name: "KEC Coding Forum" }],
  creator: "KEC Coding Forum",
  publisher: "Kongu Engineering College",
  appleWebApp: {
    capable: true,
    title: "KEC Forum",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: "/favicon.png" },
      {
        url: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#ffffff",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#111827",
    },
  ],
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PwaInstallProvider>
          <ServiceWorkerRegister />
          {children}
          <IosInstallGuide />
          <PwaUpdateToast />
          <NetworkStatusToast />
        </PwaInstallProvider>
      </body>
    </html>
  );
}
