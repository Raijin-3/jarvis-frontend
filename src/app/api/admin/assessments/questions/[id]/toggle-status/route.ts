import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL, buildAuthHeaders } from '../../../helpers'

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = await buildAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/v1/admin/assessments/questions/${id}/toggle-status`, {
      method: 'PUT',
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin assessment question toggle error:', error)
    return NextResponse.json({ error: 'Failed to toggle assessment question status' }, { status: 500 })
  }
}
