import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL, buildAuthHeaders } from '../helpers'

export async function GET(request: NextRequest) {
  try {
    const headers = await buildAuthHeaders()
    const { searchParams } = new URL(request.url)
    const params = new URLSearchParams()

    searchParams.forEach((value, key) => {
      if (value !== undefined && value !== null) {
        params.append(key, value)
      }
    })

    const queryString = params.toString()
    const response = await fetch(
      `${API_BASE_URL}/v1/admin/assessments/questions${queryString ? `?${queryString}` : ''}`,
      { headers }
    )

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin assessment questions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch assessment questions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const headers = await buildAuthHeaders({ 'Content-Type': 'application/json' })
    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/v1/admin/assessments/questions`, {
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
    console.error('Admin assessment questions POST error:', error)
    return NextResponse.json({ error: 'Failed to create assessment question' }, { status: 500 })
  }
}
