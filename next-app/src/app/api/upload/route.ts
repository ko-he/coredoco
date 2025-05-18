import { NextRequest, NextResponse } from 'next/server';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルがアップロードされていません' },
        { status: 400 }
      );
    }

    // Pythonバックエンドに画像を送信して解析を行う
    const backendFormData = new FormData();
    backendFormData.append('image', file);

    const response = await fetch(`${FLASK_API_URL}/upload`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      throw new Error('Pythonバックエンドからの応答がエラーでした');
    }

    const result = await response.json();

    return NextResponse.json({
      store_info: result.store_info
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    );
  }
} 