import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.store_info) {
      return NextResponse.json(
        { error: 'No store information provided' },
        { status: 400 }
      );
    }

    const storeInfo = body.store_info;
    if ('error' in storeInfo) {
      return NextResponse.json({ error: storeInfo.error }, { status: 400 });
    }

    // Prepare prompt for Gemini
    const prompt = `
    以下の店舗情報から、Google Mapsの検索URLを生成してください。
    店舗名: ${storeInfo.store_name || ''}
    住所: ${storeInfo.address || ''}
    
    以下の形式でJSONを返してください：
    {
        "map_url": "https://www.google.com/maps/search/?api=1&query=エンコードされた検索クエリ"
    }
    
    注意:
    1. 検索クエリは「店舗名 住所」の形式で、URLエンコードしてください
    2. 店舗名や住所が不明な場合は、利用可能な情報のみを使用してください
    3. 情報が不足している場合は、以下のJSONを返してください
    {
        "error": "情報が不足しているためURLを生成できません"
    }
    `;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON not found in response');
      }

      const mapInfo = JSON.parse(jsonMatch[0]);
      return NextResponse.json(mapInfo);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return NextResponse.json({
        error: 'URLの生成に失敗しました',
        raw_response: text
      });
    }
  } catch (error) {
    console.error('Error generating map URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate map URL' },
      { status: 500 }
    );
  }
} 