import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً لتقديم طلب.' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    
    // Check if the user is a teacher
    const { data: userData } = await supabase.from('users').select('role_name').eq('id', userId).single()
    
    if (userData?.role_name !== 'teacher') {
      return NextResponse.json(
        { error: 'يجب أن يكون حسابك بصلاحية "معلم" لتقديم هذا الطلب.' },
        { status: 403 }
      )
    }

    const { teacherId, phone } = await request.json()

    if (!teacherId || !phone) {
      return NextResponse.json(
        { error: 'بيانات غير مكتملة' },
        { status: 400 }
      )
    }

    // Check if a pending claim already exists for this user and teacher
    const { data: existingClaim } = await supabase
      .from('profile_claims')
      .select('id, status')
      .eq('user_id', userId)
      .eq('teacher_profile_id', teacherId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingClaim) {
      return NextResponse.json(
        { error: 'لديك طلب قيد المراجعة بالفعل لهذا الملف.' },
        { status: 400 }
      )
    }

    // Insert the claim
    const { error: insertError } = await supabase
      .from('profile_claims')
      .insert({
        teacher_profile_id: teacherId,
        user_id: userId,
        provided_phone: phone,
        status: 'pending'
      })

    if (insertError) {
      console.error('Error inserting claim:', insertError)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى لاحقاً.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('Submit claim error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
