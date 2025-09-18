import { NextRequest, NextResponse } from 'next/server'
import { buildAuthHeaders, API_BASE_URL } from '../helpers'

export async function GET(request: NextRequest) {
  try {
    const headers = await buildAuthHeaders({ 'Content-Type': 'application/json' })
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/assessments/templates`, {
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Templates API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Failed to fetch templates: ${errorText}` }, 
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Templates error:', error)
    // Return mock templates for development
    return NextResponse.json([
      {
        id: '1',
        title: 'JavaScript Fundamentals Assessment',
        description: 'Basic JavaScript concepts and syntax',
        category_id: 'javascript',
        module_id: 'web-dev',
        time_limit_minutes: 30,
        passing_percentage: 70,
        question_count: 15,
        difficulty_distribution: {
          easy: 60,
          medium: 30,
          hard: 10
        },
        is_public: true,
        created_at: '2024-01-15T10:00:00Z',
        usage_count: 45,
        average_score: 78.5
      },
      {
        id: '2',
        title: 'Python Data Structures Quiz',
        description: 'Lists, dictionaries, tuples, and sets',
        category_id: 'python',
        module_id: 'programming',
        time_limit_minutes: 45,
        passing_percentage: 75,
        question_count: 20,
        difficulty_distribution: {
          easy: 40,
          medium: 45,
          hard: 15
        },
        is_public: true,
        created_at: '2024-01-10T14:30:00Z',
        usage_count: 32,
        average_score: 82.3
      }
    ])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headers = await buildAuthHeaders({ 'Content-Type': 'application/json' })
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/assessments/templates`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Create template API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Failed to create template: ${errorText}` }, 
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}