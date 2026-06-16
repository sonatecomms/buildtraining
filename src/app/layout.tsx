import type { Metadata, Viewport } from "next";
import { League_Spartan, Poppins } from "next/font/google";
import "./globals.css";
import ServiceWorker from "@/components/ServiceWorker";
import { IntroSplash } from "@/components/IntroSplash";
import { SchoolThemeProvider } from "@/components/SchoolThemeProvider";
import { DemoModeProvider, DemoRoot } from "@/components/DemoMode";

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
        {/* SSR-visible from first paint so the app never peeks through; the
            component itself decides when to dismiss (and skips under reduced
            motion / after the first launch this session). */}
        <IntroSplash />
        <SchoolThemeProvider>
          <DemoModeProvider>
            <DemoRoot>{children}</DemoRoot>
          </DemoModeProvider>
        </SchoolThemeProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
