import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // First verify that the person doing this is an admin
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 })
    }

    const { data: adminUser } = await supabaseAdmin.from('users').select('role_name').eq('id', session.user.id).single()
    if (adminUser?.role_name !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات إدارية مطلوبة' }, { status: 403 })
    }

    const { claimId, teacherId, userId, action } = await request.json()

    if (!claimId || !teacherId || !userId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }

    if (action === 'reject') {
      await supabaseAdmin.from('profile_claims').update({ status: 'rejected' }).eq('id', claimId)
      return NextResponse.json({ success: true })
    }

    // If approve
    if (action === 'approve') {
      // 1. Update the claim status
      await supabaseAdmin.from('profile_claims').update({ status: 'approved' }).eq('id', claimId)
      
      // 2. Link the teacher profile to the new user_id
      const { error: updateError } = await supabaseAdmin
        .from('teachers')
        .update({ user_id: userId })
        .eq('id', teacherId)

      if (updateError) {
        throw new Error('فشل تحديث ملف المعلم: ' + updateError.message)
      }

      return NextResponse.json({ success: true })
    }

  } catch (error: any) {
    console.error('Admin claim action error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
