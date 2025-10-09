import { NextRequest, NextResponse } from 'next/server';
import { apiPost } from '@/lib/api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const body = await request.json();
    const data = await apiPost(`/v1/sections/${sectionId}/generate-exercises`, body);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating section exercises:', error);
    return NextResponse.json({ error: 'Failed to generate exercises' }, { status: 500 });
  }
}