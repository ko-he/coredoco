'use client';

import ImageUpload from '@/components/ImageUpload';

export default function Home() {
  return (
    <main>
      <h1 className="display-4 mb-4 text-center text-primary fw-bold" style={{
        fontFamily: "'Mochiy Pop One', sans-serif",
        textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
        transform: "rotate(-2deg)",
        background: "linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        padding: "10px",
        borderRadius: "10px",
        display: "inline-block"
      }}>これどこ？アプリ</h1>
      <div className="card">
        <ImageUpload />
      </div>
    </main>
  );
} 