import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL, buildAuthHeaders } from '../helpers'

export async function POST(_request: NextRequest) {
  try {
    const headers = await buildAuthHeaders({ 'Content-Type': 'application/json' })
    const response = await fetch(`${API_BASE_URL}/v1/admin/assessments/seed`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'seed' }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin assessment seed error:', error)
    return NextResponse.json({ error: 'Failed to seed assessment data' }, { status: 500 })
  }
}