import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    const { questionId } = params;
    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    const data = await apiGet(`/v1/sections/questions/${questionId}/dataset`);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching question dataset:', error);

    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch dataset' },
      { status: 500 }
    );
  }
}
