import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'مفتاح Service Role غير موجود.' }, { status: 500 })
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

    const { teachers } = await request.json()

    if (!Array.isArray(teachers) || teachers.length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للمعلمين.' }, { status: 400 })
    }

    let successCount = 0
    const errors: string[] = []

    // 1. Fetch existing subjects to match against
    const { data: existingSubjects, error: subjectsError } = await supabaseAdmin
      .from('subjects')
      .select('id, name')

    if (subjectsError) {
      return NextResponse.json({ error: 'فشل في جلب التخصصات الموجودة.' }, { status: 500 })
    }

    const subjectMap = new Map(existingSubjects.map(s => [s.name.trim().toLowerCase(), s.id]))

    for (let i = 0; i < teachers.length; i++) {
      const t = teachers[i]
      try {
        const displayName = t.name?.trim()
        const phone = t.phone?.trim()
        const cityName = t.city?.trim()
        const subjectName = t.subject?.trim()

        if (!displayName) {
          errors.push(`الصف ${i + 1}: اسم المعلم مفقود.`)
          continue
        }

        // Generate a dummy email based on phone or a timestamp
        const safePhone = phone ? phone.replace(/\D/g, '') : `t${Date.now()}`
        const email = `${safePhone}@teacher.local`
        const password = safePhone.length >= 6 ? safePhone : '12345678' // default password is phone number

        // 2. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            role: 'teacher',
            display_name: displayName
          }
        })

        if (authError) {
          // If email already exists, it might mean the teacher is already imported
          errors.push(`الصف ${i + 1} (${displayName}): ${authError.message}`)
          continue
        }

        const userId = authData.user.id

        // 3. Add to public.users
        const { error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            id: userId,
            email,
            role_name: 'teacher',
            status: 'active'
          })

        if (userError) {
          errors.push(`الصف ${i + 1} (${displayName}): فشل إضافة حساب المستخدم.`)
          continue
        }

        // 4. Add to public.teachers
        const { data: teacherRecord, error: teacherError } = await supabaseAdmin
          .from('teachers')
          .insert({
            user_id: userId,
            display_name: displayName,
            phone: phone || null,
            whatsapp: phone || null, // default whatsapp to phone
            city: cityName || null,
            status: 'approved' // Auto-approve imported teachers
          })
          .select('id')
          .single()

        if (teacherError) {
          errors.push(`الصف ${i + 1} (${displayName}): فشل إضافة الملف الشخصي للمعلم - ${teacherError.message}`)
          continue
        }

        const teacherId = teacherRecord.id

        // 5. Handle Subject Mapping
        if (subjectName) {
          const lowerSubject = subjectName.toLowerCase()
          let subjectId = subjectMap.get(lowerSubject)

          // If subject doesn't exist, create it
          if (!subjectId) {
            const { data: newSubject, error: newSubError } = await supabaseAdmin
              .from('subjects')
              .insert({ name: subjectName, is_active: true })
              .select('id')
              .single()
            
            if (!newSubError && newSubject) {
              subjectId = newSubject.id
              subjectMap.set(lowerSubject, subjectId)
            }
          }

          // Link subject to teacher
          if (subjectId) {
            await supabaseAdmin
              .from('teacher_subjects')
              .insert({
                teacher_id: teacherId,
                subject_id: subjectId
              })
          }
        }

        successCount++
      } catch (err: any) {
        errors.push(`الصف ${i + 1}: ${err.message || 'خطأ غير معروف'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم استيراد ${successCount} معلم بنجاح.`,
      errors: errors.length > 0 ? errors : undefined,
      successCount
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
