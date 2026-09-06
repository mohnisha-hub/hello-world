import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Nav } from "@/components/Nav";
import { FlyingCow } from "@/components/FlyingCow";
import "./globals.css";

const themeScript = `(function(){try{var s=localStorage.getItem("atelier-theme");var t=s==="light"||s==="dark"?s:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Atelier",
  description: "A perfume community for buyers and sellers.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${outfit.variable} ${fraunces.variable} antialiased min-h-screen bg-bg text-ink`}>
        <Nav />
        <FlyingCow />
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-8">{children}</div>
      </body>
    </html>
  );
}
