import type { Metadata, Viewport } from "next";
import { League_Spartan, Poppins } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import ServiceWorker from "@/components/ServiceWorker";
import SessionProvider from "@/components/SessionProvider";

const league = League_Spartan({
  variable: "--font-league",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BUILD",
  description:
    "Coach-built training programs, workout logging, and streaks. Installable to your home screen.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BUILD",
  },
};

export const viewport: Viewport = {
  themeColor: "#19350C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${league.variable} ${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <main className="flex-1 w-full max-w-2xl mx-auto px-4 pb-28 pt-4">
            {children}
          </main>
          <BottomNav />
        </SessionProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
