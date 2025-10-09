import { NextRequest, NextResponse } from 'next/server';
import { apiPost } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await apiPost('/v1/sql/execute', body ?? {});
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error executing SQL:', error);
    const message = error instanceof Error ? error.message : 'Failed to execute SQL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
