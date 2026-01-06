import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "スカウト候補者管理",
  description: "TikTokスカウト候補者の管理ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
