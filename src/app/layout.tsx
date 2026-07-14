import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { AlarmOverlay } from "@/components/AlarmOverlay";
import "@/index.css";

export const metadata: Metadata = {
  title: "DoAm - AI-Powered Personal Scheduling",
  description: "DoAm helps you achieve your goals with personalized AI scheduling that respects your energy levels and priorities.",
  themeColor: "#22d3ee",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DoAm",
  },
  openGraph: {
    title: "DoAm - AI-Powered Personal Scheduling",
    description: "DoAm helps you achieve your goals with personalized AI scheduling that respects your energy levels and priorities.",
    type: "website",
    images: ["/favicon.png"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DoAm",
    images: ["/favicon.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <Providers>
          <PWAInstallPrompt />
          <AlarmOverlay />
          {children}
        </Providers>
      </body>
    </html>
  );
}
