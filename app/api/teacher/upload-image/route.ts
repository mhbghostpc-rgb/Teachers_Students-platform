import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
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

    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: 'لم يتم العثور على صورة' }, { status: 400 })
    }

    // Use service role for upload to bypass RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const buffer = Buffer.from(await imageFile.arrayBuffer())
    const fileExt = imageFile.name.split('.').pop() || 'png'
    const fileName = `${session.user.id}/${uuidv4()}.${fileExt}`

    // Fetch old profile image to delete it later
    const { data: teacherData } = await supabaseAdmin
      .from('teachers')
      .select('profile_image')
      .eq('user_id', session.user.id)
      .single()

    const oldImageUrl = teacherData?.profile_image

    // Upload to 'avatars' bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: imageFile.type || 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload Error:', uploadError)
      return NextResponse.json({ error: 'فشل رفع الصورة' }, { status: 500 })
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(fileName)
      
    const imageUrl = publicUrlData.publicUrl

    // Update teacher's profile_image in DB
    const { error: updateError } = await supabaseAdmin
      .from('teachers')
      .update({ profile_image: imageUrl })
      .eq('user_id', session.user.id)

    if (updateError) {
      console.error('Database Update Error:', updateError)
      return NextResponse.json({ error: 'تم رفع الصورة ولكن فشل تحديث الملف الشخصي' }, { status: 500 })
    }

    // Delete the old image if it exists and belongs to the avatars bucket
    if (oldImageUrl && oldImageUrl.includes('/storage/v1/object/public/avatars/')) {
      try {
        const oldFilePath = oldImageUrl.split('/storage/v1/object/public/avatars/')[1]
        if (oldFilePath) {
          await supabaseAdmin.storage.from('avatars').remove([oldFilePath])
          console.log('Old image deleted:', oldFilePath)
        }
      } catch (err) {
        console.error('Failed to delete old image:', err)
        // We don't throw an error here to avoid failing the upload response
      }
    }

    return NextResponse.json({ success: true, imageUrl })
  } catch (error: any) {
    console.error('Upload image error:', error)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
