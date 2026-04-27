import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const sans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "WOODJEAN 판교점 — 회색 빌딩 숲의 우드진",
    template: "%s | WOODJEAN 판교점",
  },
  description:
    "판교 테크노밸리 호주식 카페 우드진. 회의용 단체주문 10잔부터 30잔까지 사전 예약 배달.",
  metadataBase: new URL("https://woodjean-pangyo.com"),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "WOODJEAN 판교점",
    description: "판교 테크노밸리 호주식 카페 우드진. 단체주문 10잔부터 30잔까지.",
    siteName: "WOODJEAN 판교점",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={sans.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col overflow-x-hidden">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
