import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'مفتاح Service Role غير موجود في إعدادات الخادم (.env.local). يرجى إضافته وإعادة تشغيل الخادم.' }, { status: 500 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const formData = await request.formData()
    
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const display_name = formData.get('display_name') as string
    const phone = formData.get('phone') as string
    const whatsapp = formData.get('whatsapp') as string
    const city = formData.get('city') as string
    const area = formData.get('area') as string
    const teaching_type = formData.get('teaching_type') as string
    const experience_years = formData.get('experience_years') as string
    const price_per_session = formData.get('price_per_session') as string
    const session_duration = formData.get('session_duration') as string
    const status = formData.get('status') as string
    const about = formData.get('about') as string
    const school_name = formData.get('school_name') as string
    const website_url = formData.get('website_url') as string
    const video_url = formData.get('video_url') as string
    const selectedSystems = JSON.parse(formData.get('selectedSystems') as string || '[]')
    const selectedStages = JSON.parse(formData.get('selectedStages') as string || '[]')
    const selectedSubjects = JSON.parse(formData.get('selectedSubjects') as string || '[]')
    const gallery_images = JSON.parse(formData.get('gallery_images') as string || '[]')
    const profile_image = formData.get('profile_image') as File | null

    let profile_image_url = null
    
    // 1. Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'teacher',
        display_name
      }
    })

    if (authError) throw authError

    const userId = authData.user.id

    // Upload Profile Image if provided
    if (profile_image && profile_image.size > 0) {
      const fileExt = profile_image.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('avatars')
        .upload(fileName, profile_image)
      
      if (!uploadError) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('avatars')
          .getPublicUrl(fileName)
        profile_image_url = publicUrlData.publicUrl
      }
    }

    // 2. Add to public.users
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email,
        role_name: 'teacher',
        status: 'active'
      })

    if (userError) throw userError

    // 3. Create teacher profile
    const { data: teacherData, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert({
        user_id: userId,
        display_name,
        phone,
        whatsapp,
        city,
        area,
        teaching_type,
        experience_years: parseInt(experience_years) || 0,
        price_per_session: parseFloat(price_per_session) || null,
        session_duration: parseInt(session_duration) || 60,
        status: status || 'approved',
        system_types: selectedSystems || [],
        about: about || null,
        school_name: school_name || null,
        website_url: website_url || null,
        video_url: video_url || null,
        gallery_images: gallery_images || [],
        profile_image: profile_image_url
      })
      .select()
      .single()

    if (teacherError) throw teacherError

    const teacherId = teacherData.id

    // 4. Link Stages
    if (selectedStages && selectedStages.length > 0) {
      const stageInserts = selectedStages.map((stageId: string) => ({
        teacher_id: teacherId,
        stage_id: stageId
      }))
      await supabaseAdmin.from('teacher_stages').insert(stageInserts)
    }

    // 5. Link Subjects
    if (selectedSubjects && selectedSubjects.length > 0) {
      const subjectInserts = selectedSubjects.map((subjectId: string) => ({
        teacher_id: teacherId,
        subject_id: subjectId
      }))
      await supabaseAdmin.from('teacher_subjects').insert(subjectInserts)
    }

    return NextResponse.json({ success: true, teacher: teacherData })

  } catch (error: any) {
    console.error('Error creating teacher:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
