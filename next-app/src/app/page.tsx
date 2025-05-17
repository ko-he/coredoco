'use client';

import ImageUpload from '@/components/ImageUpload';

export default function Home() {
  return (
    <main>
      <h1 className="display-4 mb-4">店舗情報抽出アプリ</h1>
      <div className="card">
        <ImageUpload />
      </div>
    </main>
  );
} 