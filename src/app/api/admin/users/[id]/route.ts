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

// GET /api/admin/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headers = await getAuthHeaders()
    const { id } = await params

    const response = await fetch(`${API_BASE_URL}/v1/admin/users/${id}`, {
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin get user API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' }, 
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headers = await getAuthHeaders()
    const { id } = await params
    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/v1/admin/users/${id}`, {
      method: 'PUT',
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
    console.error('Admin update user API error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headers = await getAuthHeaders()
    const { id } = await params

    const response = await fetch(`${API_BASE_URL}/v1/admin/users/${id}`, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin delete user API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' }, 
      { status: 500 }
    )
  }
}
