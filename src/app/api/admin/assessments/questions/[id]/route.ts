import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL, buildAuthHeaders } from '../../helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = await buildAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/v1/admin/assessments/questions/${id}`, { headers })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin assessment question GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch assessment question' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = await buildAuthHeaders({ 'Content-Type': 'application/json' })
    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/v1/admin/assessments/questions/${id}`, {
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
    console.error('Admin assessment question PUT error:', error)
    return NextResponse.json({ error: 'Failed to update assessment question' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = await buildAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/v1/admin/assessments/questions/${id}`, {
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
    console.error('Admin assessment question DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete assessment question' }, { status: 500 })
  }
}
