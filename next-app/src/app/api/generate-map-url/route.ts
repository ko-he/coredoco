import { NextResponse } from 'next/server';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.store_info) {
      return NextResponse.json(
        { error: 'No store information provided' },
        { status: 400 }
      );
    }

    // Forward request to Flask backend
    const response = await fetch(`${FLASK_API_URL}/generate-map-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Forward the response from Flask backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error generating map URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate map URL' },
      { status: 500 }
    );
  }
} 