import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { rateLimiter } from '@/lib/rate-limit'

const updateProfileSchema = z.object({
  display_name: z.string().min(2, 'الاسم يجب أن يكون أكثر من حرفين').max(100, 'الاسم طويل جداً').optional(),
  phone: z.string().max(20).optional().nullable(),
  whatsapp: z.string().max(20).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  area: z.string().max(100).optional().nullable(),
  teaching_type: z.string().max(50).optional().nullable(),
  profile_image: z.string().url().optional().nullable().or(z.literal('')),
  about: z.string().max(2000, 'النبذة يجب ألا تتجاوز 2000 حرف').optional().nullable(),
  price_per_session: z.union([z.string(), z.number()]).optional().nullable(),
  experience_years: z.union([z.string(), z.number()]).optional().nullable(),
  video_url: z.string().url().optional().nullable().or(z.literal('')),
  booking_url: z.string().url().optional().nullable().or(z.literal('')),
})

export async function PUT(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimiter.limit(ip, 20, 60000)) {
      return NextResponse.json({ error: 'طلبات كثيرة جداً، يرجى المحاولة بعد قليل' }, { status: 429 })
    }

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

    const rawData = await request.json()
    const parseResult = updateProfileSchema.safeParse(rawData)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: parseResult.error.errors }, { status: 400 })
    }

    const data = parseResult.data

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
      .eq('user_id', session.user.id) // Implicit RLS check due to user_id match + session match

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
