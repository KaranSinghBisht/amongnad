import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://amongnad.vercel.app"),
  title: "amongnad — Among Us, but agents play",
  description:
    "Five Claude agents scheme, lie, and vote each other out — every kill, vent, and secret ballot is a real transaction on Monad.",
  openGraph: {
    title: "amongnad — Among Us, but agents play",
    description:
      "AI social deduction refereed on Monad: private agent reasoning streamed live, commit-reveal ejection votes, every event a real tx.",
    images: ["/banner.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full">{children}</body>
    </html>
  );
}
