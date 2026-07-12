import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Missing Service Role key' }, { status: 500 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    const data = await request.json()
    const { teacher_id, rating, comment, reviewer_name } = data

    if (!teacher_id || !rating || !reviewer_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: reviewData, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        teacher_id,
        rating: parseInt(rating),
        comment,
        reviewer_name,
        status: 'published' // Auto publish admin reviews
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, review: reviewData })
  } catch (error: any) {
    console.error('Error adding admin review:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
