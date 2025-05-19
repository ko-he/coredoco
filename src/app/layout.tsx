import './globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '店舗情報抽出アプリ',
  description: '画像から店舗情報を抽出するアプリケーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-light">
        <div className="container py-4">
          {children}
        </div>
      </body>
    </html>
  );
} 