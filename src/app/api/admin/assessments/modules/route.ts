import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL, buildAuthHeaders } from '../helpers'

export async function GET(_request: NextRequest) {
  try {
    const headers = await buildAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/v1/admin/assessments/modules`, { headers })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin assessment modules GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch course modules' }, { status: 500 })
  }
}
