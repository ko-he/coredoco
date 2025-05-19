'use client';

import { useEffect, useState } from 'react';
import ImageUpload from '@/components/ImageUpload';

export default function Home() {
  const [isBackendHealthy, setIsBackendHealthy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        if (data.status === 'healthy') {
          setIsBackendHealthy(true);
        }
      } catch (error) {
        console.error('Backend health check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkBackendHealth();
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isBackendHealthy) {
    return (
      <div className="alert alert-danger m-3" role="alert">
        バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。
      </div>
    );
  }

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
      <div>
        <ImageUpload />
      </div>
    </main>
  );
} 