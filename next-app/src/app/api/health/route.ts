import { NextResponse } from 'next/server';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

export async function GET() {
  try {
    const response = await fetch(`${FLASK_API_URL}/`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Backend health check failed:', error);
    return NextResponse.json(
      { error: 'Backend server is not available' },
      { status: 503 }
    );
  }
} 