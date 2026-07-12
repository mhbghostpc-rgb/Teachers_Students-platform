import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teacher_id, session_date, notes } = await request.json()

    // Get student_id from students table based on user_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const { error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          student_id: student.id,
          teacher_id,
          session_date: session_date || null,
          notes: notes || '',
          status: 'pending'
        }
      ])

    if (bookingError) {
      console.error('Booking insertion error:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/student/bookings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
