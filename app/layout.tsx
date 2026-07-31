import type { Metadata } from "next";
import { Archivo_Black, IBM_Plex_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const display = Archivo_Black({ variable: "--font-display", weight: "400", subsets: ["latin"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono", weight: ["400", "500"], subsets: ["latin"] });
const korean = Noto_Sans_KR({ variable: "--font-korean", weight: ["400", "500", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Moonyoung Choi — Research Engineer",
  description: "Statistical learning, research engineering, and financial data systems by Moonyoung Choi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${display.variable} ${mono.variable} ${korean.variable}`}>{children}</body>
    </html>
  );
}
