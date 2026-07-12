import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 })
    }

    // Verify user is teacher
    const { data: userData } = await supabase.from('users').select('role_name').eq('id', session.user.id).single()
    if (userData?.role_name !== 'teacher') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const data = await request.json()

    // Data to update
    const updateData = {
      display_name: data.display_name,
      phone: data.phone,
      whatsapp: data.whatsapp,
      city: data.city,
      area: data.area,
      teaching_type: data.teaching_type,
      profile_image: data.profile_image,
      about: data.about,
      price_per_session: data.price_per_session ? Number(data.price_per_session) : null,
      experience_years: data.experience_years ? Number(data.experience_years) : 0,
      video_url: data.video_url,
      booking_url: data.booking_url,
    }

    const { error: updateError } = await supabase
      .from('teachers')
      .update(updateData)
      .eq('user_id', session.user.id)

    if (updateError) {
      console.error('Update teacher error:', updateError)
      return NextResponse.json({ error: 'فشل تحديث البيانات' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
