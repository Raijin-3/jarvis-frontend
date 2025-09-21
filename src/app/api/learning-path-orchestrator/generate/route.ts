import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function GET(request: NextRequest) {
  try {
    // Get user from session/token - this is a simplified version
    // In real implementation, you'd extract user from JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For demo purposes, using mock user IDs based on email
    // In production, decode JWT token to get real user ID
    const mockUserId = 'user-123'; // This should come from JWT token

    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('assessmentId');

    // Call the backend NestJS API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const queryParams = assessmentId ? `?assessmentId=${assessmentId}` : '';
    
    const response = await fetch(`${apiUrl}/learning-path-orchestrator/generate${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` }, 
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in learning path orchestrator API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}