import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Google Fonts
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Your Local Font (Soria)
const soria = localFont({
  src: "./fonts/soria.ttf",
  variable: "--font-soria",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "OutboundAI",
  description: "Autonomous Revenue & Lead Discovery Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
          ${inter.variable}
          ${spaceGrotesk.variable}
          ${soria.variable}
          font-sans
          antialiased
        `}
      >
        {children}
      </body>
    </html>
  );
}