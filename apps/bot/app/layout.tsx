export const metadata = { title: "Woodjean Bot", description: "Internal API surface — not for public consumption." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
