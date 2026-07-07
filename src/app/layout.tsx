import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import AuthSync from "@/components/auth-sync";
import { Analytics } from "@vercel/analytics/react";
import AnalyticsPing from "@/components/analytics-ping";
import Script from "next/script";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ArcadeCore - Play Free Online HTML5 Games",
  description: "Play thousands of free online HTML5 games including Racing, Shooting, Puzzles, Action, and Strategy on ArcadeCore. Daily rewards, XP leveling, and leaderboards!",
  keywords: "free games, html5 games, browser games, poki, crazygames, online arcade",
  openGraph: {
    type: "website",
    title: "ArcadeCore - Browser Gaming Platform",
    description: "Instant access to 100+ free online HTML5 games with multiplayer, leaderboards, and daily spin rewards.",
    siteName: "ArcadeCore",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${orbitron.variable} ${inter.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
            <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />
          )}
        </head>
        <body className="min-h-full flex flex-col font-sans bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
          {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
              />
              <Script id="google-analytics" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
                `}
              </Script>
            </>
          )}
          <ThemeProvider>
            <AuthSync />
            <Analytics />
            <AnalyticsPing />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
