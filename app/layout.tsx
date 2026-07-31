import type { Metadata } from "next";
import { Archivo_Black, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const display = Archivo_Black({ variable: "--font-display", weight: "400", subsets: ["latin"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono", weight: ["400", "500"], subsets: ["latin"] });
const sans = Space_Grotesk({ variable: "--font-sans", weight: ["400", "500", "600"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Moonyoung Choi — Portfolio",
  description: "Education, experience, research systems, and public repositories by Moonyoung Choi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${mono.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
