import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL, buildAuthHeaders } from '../../helpers'

export async function POST(request: NextRequest) {
  try {
    const headers = await buildAuthHeaders({ 'Content-Type': 'application/json' })
    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/v1/admin/assessments/questions/bulk`, {
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
    console.error('Admin assessment questions bulk POST error:', error)
    return NextResponse.json({ error: 'Failed to bulk create assessment questions' }, { status: 500 })
  }
}
