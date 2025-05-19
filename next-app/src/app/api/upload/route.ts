import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Process image with sharp to ensure compatibility
    const processedImageBuffer = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside' })
      .toBuffer();

    // Convert to base64 for Gemini API
    const base64Image = processedImageBuffer.toString('base64');
    const mimeType = file.type;

    // Prepare prompt for Gemini
    const prompt = `
    この画像はカフェや飲食店が記載された、google mapのスクリーンショットや、instagramの投稿画像です。
    画像から以下の情報を抽出してください：
    1. 店舗名
    2. 住所（できるだけ詳細に）
    3. 電話番号（表示されている場合）
    
    JSONフォーマットで回答してください：
    [
        {
            "store_name": "店舗名",
            "address": "住所",
            "phone": "電話番号",
        }
    ]

    注意:
    1. instagramの投稿画像の場合は、アカウント名が表示されているので、それを店舗名として誤認しないように注意してください。
    2. 情報が複数抽出できる場合は、それらを配列に複数のオブジェクトを格納して返してください。
    3. 抽出ができなかった場合は、以下のJSONを返してください。
    {
        "error": "抽出できなかった理由",
    }
    `;

    // Call Gemini API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    try {
      // Extract JSON array or object from response
      const jsonMatch = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON not found in response');
      }

      const storeInfo = JSON.parse(jsonMatch[0]);
      
      // Ensure we always return an array
      const storeInfoArray = Array.isArray(storeInfo) ? storeInfo : [storeInfo];

      return NextResponse.json({
        store_info: storeInfoArray
      });
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return NextResponse.json({
        store_info: [{
          error: 'JSONの解析に失敗しました',
          raw_response: text
        }]
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    );
  }
} 