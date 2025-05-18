'use client';

import { useState, ChangeEvent, FormEvent } from 'react';

interface StoreInfo {
  store_name?: string;
  address?: string;
  phone?: string;
  hours?: string;
  raw_response?: string;
}

interface UploadResponse {
  filepath: string;
  store_info: StoreInfo[];
}

interface MapUrlResponse {
  map_url?: string;
  error?: string;
}

export default function ImageUpload() {
  const [preview, setPreview] = useState<string>('');
  const [storeInfo, setStoreInfo] = useState<StoreInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingMap, setIsGeneratingMap] = useState<{ [key: number]: boolean}>({});
  const [error, setError] = useState<string | null>(null);
  const [mapUrl, setMapUrl] = useState<{ [key: number]: string }>({});
  const [mapError, setMapError] = useState<{ [key: number]: string }>({});

  const handleReset = () => {
    setPreview('');
    setStoreInfo([]);
    setIsLoading(false);
    setIsGeneratingMap({});
    setError(null);
    setMapUrl({});
    setMapError({});
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;

    if (!fileInput.files?.length) {
      setError('ファイルを選択してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('アップロードに失敗しました');
      }

      const data: UploadResponse = await response.json();
      setStoreInfo(data.store_info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMapUrl = async (index: number) => {
    if (storeInfo.length === 0) return;

    setIsGeneratingMap({ [index]: true});
    setMapError({[index]: ''});
    setMapUrl({[index]: ''});

    try {
      const response = await fetch('/api/generate-map-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ store_info: storeInfo[index] }),
      });

      const data: MapUrlResponse = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'マップURLの生成に失敗しました');
      }

      if (data.map_url) {
        setMapUrl({[index]: data.map_url});
      }
    } catch (err) {
      setMapError({[index]: err instanceof Error ? err.message : 'エラーが発生しました'});
    } finally {
      setIsGeneratingMap({ [index]: false });
    }
  };

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            <h2 className="card-title h4 mb-4">画像をアップロード</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="form-control"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary me-2"
              >
                {isLoading ? '解析中...' : '解析する'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
              >
                リセット
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-6">
        <div className="card">
          <div className="card-body">
            <h2 className="card-title h4 mb-4">アップロードされた画像</h2>
            {preview ? (
              <img src={preview} alt="プレビュー" className="img-fluid" />
            ) : (
              <p className="text-muted">画像を選択してください</p>
            )}
          </div>
        </div>
      </div>

      <div className="col-12 col-md-6">
        <div className="card">
          <div className="card-body">
            <h2 className="card-title h4 mb-4">抽出結果</h2>
            {error ? (
              <p className="text-danger">{error}</p>
            ) : isLoading ? (
              <p>解析中...</p>
            ) : storeInfo ? (
              storeInfo.map((info, index) => (
                <div key={info.store_name}>
                  <dl className="row">
                    {Object.entries(info).map(([key, value]) => {
                      const label = {
                        store_name: '店舗名',
                        address: '住所',
                        phone: '電話番号',
                        hours: '営業時間',
                        raw_response: '解析結果（生データ）',
                      }[key] || key;
                      return (
                        <div key={key} className="col-12 mb-2">
                          <dt className="fw-medium text-muted">{label}</dt>
                          <dd>{value || '情報なし'}</dd>
                        </div>
                      );
                    })}
                  </dl>
                  <div className="mt-3">
                    <button
                      onClick={() => handleGenerateMapUrl(index)}
                      disabled={isGeneratingMap[index]}
                      className="btn btn-success"
                    >
                      {isGeneratingMap[index] ? '生成中...' : 'Google Maps URLを生成'}
                    </button>
                    {mapError && (
                      <p className="text-danger mt-2">{mapError[index]}</p>
                    )}
                    {mapUrl[index] && (
                      <div className="mt-2">
                        <a
                          href={mapUrl[index]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary"
                        >
                          Google Mapsで開く
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted">画像をアップロードしてください</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 