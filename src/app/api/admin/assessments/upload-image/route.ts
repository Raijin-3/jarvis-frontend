import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL, buildAuthHeaders } from '../helpers'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || undefined
    const headers = await buildAuthHeaders(
      contentType ? { 'Content-Type': contentType } : {}
    )
    const body = await request.arrayBuffer()

    const response = await fetch(`${API_BASE_URL}/v1/admin/assessments/upload-image`, {
      method: 'POST',
      headers,
      body,
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin assessment image upload error:', error)
    return NextResponse.json({ error: 'Failed to upload assessment image' }, { status: 500 })
  }
}
