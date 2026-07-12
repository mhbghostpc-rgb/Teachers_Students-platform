import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول كطالب لترك تقييم' }, { status: 401 })
    }

    // Get student ID
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'فقط الطلاب يمكنهم ترك تقييم' }, { status: 403 })
    }

    const { teacherId, rating, comment } = await request.json()

    // Insert review
    const { error } = await supabase.from('reviews').insert({
      teacher_id: teacherId,
      student_id: student.id,
      rating,
      comment,
      status: 'pending'
    })

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'لقد قمت بتقييم هذا المعلم مسبقاً' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Submit review error:', error)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
