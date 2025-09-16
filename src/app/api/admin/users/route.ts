import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// Use configured API URL; default to local Nest API in dev
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

async function getAuthHeaders() {
  const supabase = supabaseServer()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session?.access_token) {
    throw new Error('Not authenticated')
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

// GET /api/admin/users - List users
export async function GET(request: NextRequest) {
  try {
    const headers = await getAuthHeaders()
    const { searchParams } = new URL(request.url)
    
    const params = new URLSearchParams()
    searchParams.forEach((value, key) => {
      params.append(key, value)
    })

    const response = await fetch(`${API_BASE_URL}/v1/admin/users?${params}`, {
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' }, 
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create user
export async function POST(request: NextRequest) {
  try {
    const headers = await getAuthHeaders()
    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/v1/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin create user API error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' }, 
      { status: 500 }
    )
  }
}
