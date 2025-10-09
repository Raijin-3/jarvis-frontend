import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const data = await apiGet(`/v1/sections/${sectionId}/exercises`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching section exercises:', error);
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
  }
}