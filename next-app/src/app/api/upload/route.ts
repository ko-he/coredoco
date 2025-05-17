import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ファイル名を生成
    const uniqueId = uuidv4();
    const extension = file.name.split('.').pop();
    const filename = `${uniqueId}.${extension}`;

    // ファイルを保存
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Pythonバックエンドに画像を送信して解析を行う
    const backendFormData = new FormData();
    backendFormData.append('image', file);

    const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      throw new Error('Pythonバックエンドからの応答がエラーでした');
    }

    const result = await response.json();

    return NextResponse.json({
      filepath: `/uploads/${filename}`,
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