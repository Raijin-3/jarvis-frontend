import { NextRequest, NextResponse } from 'next/server';
import { apiPost } from '@/lib/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const body = await request.json();
    const data = await apiPost(`/v1/sections/${params.sectionId}/generate-quiz`, body);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating section quiz:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}