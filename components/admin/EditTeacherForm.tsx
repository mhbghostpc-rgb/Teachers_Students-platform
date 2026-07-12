"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EducationalStage, Subject, Teacher } from '@/types'
import { CITIES, TEACHING_TYPES, SYSTEM_TYPES, STAGES_BY_SYSTEM, SUBJECTS_BY_SYSTEM_AND_STAGE } from '@/lib/utils/constants'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export function EditTeacherForm({ teacherId }: { teacherId: string }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [stages, setStages] = useState<EducationalStage[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    display_name: '',
    phone: '',
    whatsapp: '',
    city: '',
    area: '',
    teaching_type: 'online',
    experience_years: 0,
    price_per_session: '',
    session_duration: 60,
    status: 'pending',
    average_rating: 0,
    reviews_count: 0,
    about: '',
    school_name: '',
    website_url: '',
    video_url: '',
    gallery_images: [] as string[],
    selectedSystems: [] as string[],
    selectedStages: [] as string[],
    selectedSubjects: [] as string[]
  })

  useEffect(() => {
    async function loadData() {
      // 1. Fetch lookups
      const [stagesRes, subjectsRes] = await Promise.all([
        supabase.from('educational_stages').select('*').eq('is_active', true),
        supabase.from('subjects').select('*').eq('is_active', true)
      ])

      if (stagesRes.data) setStages(stagesRes.data)
      if (subjectsRes.data) setSubjects(subjectsRes.data)

      // 2. Fetch Teacher Data
      const { data: teacher, error } = await supabase
        .from('teachers')
        .select(`
          *,
          teacher_stages (stage_id),
          teacher_subjects (subject_id)
        `)
        .eq('id', teacherId)
        .single()

      if (error || !teacher) {
        toast.error('لم يتم العثور على المعلم')
        router.push('/admin/teachers')
        return
      }

      setFormData({
        display_name: teacher.display_name || '',
        phone: teacher.phone || '',
        whatsapp: teacher.whatsapp || '',
        city: teacher.city || '',
        area: teacher.area || '',
        teaching_type: teacher.teaching_type || 'online',
        experience_years: teacher.experience_years || 0,
        price_per_session: teacher.price_per_session?.toString() || '',
        session_duration: teacher.session_duration || 60,
        status: teacher.status || 'pending',
        average_rating: teacher.average_rating || 0,
        reviews_count: teacher.reviews_count || 0,
        about: teacher.about || '',
        school_name: teacher.school_name || '',
        website_url: teacher.website_url || '',
        video_url: teacher.video_url || '',
        gallery_images: teacher.gallery_images || [],
        selectedSystems: teacher.system_types || [],
        selectedStages: teacher.teacher_stages?.map((s: any) => s.stage_id) || [],
        selectedSubjects: teacher.teacher_subjects?.map((s: any) => s.subject_id) || []
      })

      setLoading(false)
    }
    loadData()
  }, [teacherId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData({ ...formData, gallery_images: value.split(',').map(url => url.trim()).filter(Boolean) })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0])
    }
  }

  const handleStageToggle = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStages: prev.selectedStages.includes(id)
        ? prev.selectedStages.filter(sId => sId !== id)
        : [...prev.selectedStages, id]
    }))
  }

  const handleSubjectToggle = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(id)
        ? prev.selectedSubjects.filter(sId => sId !== id)
        : [...prev.selectedSubjects, id]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.selectedStages.length === 0 || formData.selectedSubjects.length === 0) {
      toast.error('يجب اختيار مرحلة تعليمية ومادة دراسية واحدة على الأقل')
      return
    }

    setSubmitting(true)
    try {
      // 1. Upload Profile Image if changed
      let profile_image_url = undefined;
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop()
        const fileName = `${teacherId}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, profileImage)
        
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)
          profile_image_url = publicUrlData.publicUrl
        }
      }

      // 2. Update teacher profile
      const updatePayload: any = {
        display_name: formData.display_name,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        city: formData.city,
        area: formData.area,
        teaching_type: formData.teaching_type,
        experience_years: parseInt(formData.experience_years.toString()) || 0,
        price_per_session: parseFloat(formData.price_per_session) || null,
        session_duration: parseInt(formData.session_duration.toString()) || 60,
        status: formData.status,
        average_rating: parseFloat(formData.average_rating.toString()) || 0,
        reviews_count: parseInt(formData.reviews_count.toString()) || 0,
        system_types: formData.selectedSystems,
        about: formData.about || null,
        school_name: formData.school_name || null,
        website_url: formData.website_url || null,
        video_url: formData.video_url || null,
        gallery_images: formData.gallery_images || [],
        updated_at: new Date().toISOString()
      };

      if (profile_image_url) {
        updatePayload.profile_image = profile_image_url;
      }

      const { error: updateError } = await supabase
        .from('teachers')
        .update(updatePayload)
        .eq('id', teacherId)

      if (updateError) throw updateError

      // 2. Update Stages (Delete old, insert new)
      await supabase.from('teacher_stages').delete().eq('teacher_id', teacherId)
      if (formData.selectedStages.length > 0) {
        await supabase.from('teacher_stages').insert(
          formData.selectedStages.map(id => ({ teacher_id: teacherId, stage_id: id }))
        )
      }

      // 3. Update Subjects (Delete old, insert new)
      await supabase.from('teacher_subjects').delete().eq('teacher_id', teacherId)
      if (formData.selectedSubjects.length > 0) {
        await supabase.from('teacher_subjects').insert(
          formData.selectedSubjects.map(id => ({ teacher_id: teacherId, subject_id: id }))
        )
      }

      toast.success('تم تحديث بيانات المعلم بنجاح')
      router.push('/admin/teachers')
      router.refresh()
    } catch (error: any) {
      console.error('Update error:', error)
      toast.error('حدث خطأ أثناء تحديث البيانات')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow border border-gray-200 max-w-4xl space-y-8">
      
      {/* Personal Info */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">البيانات الشخصية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم بالكامل</label>
            <input required type="text" name="display_name" value={formData.display_name} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
            <input required type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الواتساب</label>
            <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
            <select name="city" required value={formData.city} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500">
              <option value="">اختر المحافظة</option>
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المنطقة</label>
            <input required type="text" name="area" value={formData.area} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" />
          </div>
        </div>
      </section>

      {/* Profile Details */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">تفاصيل الملف الشخصي (للطلاب)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">صورة المعلم (Profile Picture)</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" />
            <p className="text-xs text-gray-500 mt-1">اتركه فارغاً للاحتفاظ بالصورة الحالية.</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">نبذة عن المعلم (Bio)</label>
            <textarea name="about" value={formData.about} onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" placeholder="اكتب نبذة تعريفية قصيرة تظهر للطلاب..."></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المدرسة الحالية</label>
            <input type="text" name="school_name" value={formData.school_name} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" placeholder="اسم المدرسة (اختياري)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رابط فيديو تعريفي (YouTube)</label>
            <input type="url" name="video_url" value={formData.video_url} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" dir="ltr" placeholder="https://youtube.com/..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الموقع الشخصي أو المنصة</label>
            <input type="url" name="website_url" value={formData.website_url} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" dir="ltr" placeholder="https://..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">صور إضافية (Gallery)</label>
            <input type="text" defaultValue={formData.gallery_images.join(', ')} onChange={handleGalleryChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" dir="ltr" placeholder="ضع روابط الصور مفصولة بفاصلة (,)" />
            <p className="text-xs text-gray-500 mt-1">مثال: https://img1.com/a.jpg, https://img2.com/b.jpg</p>
          </div>
        </div>
      </section>

      {/* Teaching Info */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">بيانات التدريس</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">نوع النظام التعليمي (يمكنك اختيار أكثر من نظام)</label>
          <div className="flex flex-wrap gap-2">
            {SYSTEM_TYPES.map(system => (
              <button
                key={system}
                type="button"
                onClick={() => {
                  const newSystems = formData.selectedSystems.includes(system)
                    ? formData.selectedSystems.filter(s => s !== system)
                    : [...formData.selectedSystems, system];
                  setFormData({ ...formData, selectedSystems: newSystems });
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  formData.selectedSystems.includes(system) 
                    ? 'bg-purple-600 text-white border-purple-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                }`}
              >
                {system}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">المراحل التعليمية (يمكنك اختيار أكثر من مرحلة)</label>
          <div className="flex flex-wrap gap-2">
            {stages
              .filter(stage => 
                formData.selectedSystems.length === 0 || 
                formData.selectedSystems.some(system => STAGES_BY_SYSTEM[system]?.includes(stage.name))
              )
              .map(stage => (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleStageToggle(stage.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  formData.selectedStages.includes(stage.id) 
                    ? 'bg-primary-600 text-white border-primary-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                }`}
              >
                {stage.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">المواد الدراسية (يمكنك اختيار أكثر من مادة)</label>
          <div className="flex flex-wrap gap-2">
            {subjects
              .filter(subject => {
                if (formData.selectedSystems.length === 0 || formData.selectedStages.length === 0) return true;
                
                // Get the names of the selected stages
                const selectedStageNames = stages
                  .filter(s => formData.selectedStages.includes(s.id))
                  .map(s => s.name);

                // Check if this subject is allowed in ANY of the (selected system + selected stage) combinations
                return formData.selectedSystems.some(system => 
                  selectedStageNames.some(stageName => 
                    SUBJECTS_BY_SYSTEM_AND_STAGE[system]?.[stageName]?.includes(subject.name)
                  )
                );
              })
              .map(subject => (
              <button
                key={subject.id}
                type="button"
                onClick={() => handleSubjectToggle(subject.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  formData.selectedSubjects.includes(subject.id) 
                    ? 'bg-secondary-600 text-white border-secondary-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-secondary-400'
                }`}
              >
                {subject.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">طريقة التدريس</label>
            <select name="teaching_type" required value={formData.teaching_type} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500">
              {TEACHING_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">سنوات الخبرة</label>
            <input type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} min="0" className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">سعر الحصة (اختياري)</label>
            <input type="number" name="price_per_session" value={formData.price_per_session} onChange={handleChange} min="0" className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500 font-bold">
              <option value="approved">معتمد</option>
              <option value="pending">قيد المراجعة</option>
              <option value="rejected">مرفوض</option>
              <option value="suspended">موقوف</option>
              <option value="banned">محظور</option>
              <option value="hidden">مخفي</option>
            </select>
          </div>
        </div>
      </section>

      {/* Manual Rating Adjustment */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">تعديل التقييم يدوياً (Manual Rating)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">متوسط التقييم (من 1 إلى 5)</label>
            <input type="number" step="0.1" min="0" max="5" name="average_rating" value={formData.average_rating} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عدد التقييمات</label>
            <input type="number" name="reviews_count" value={formData.reviews_count} onChange={handleChange} min="0" className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {submitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </Button>
      </div>

    </form>
    
    {/* Write Fake Review Form */}
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 max-w-4xl mt-8">
      <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 text-green-700">إضافة تقييم (مراجعة) للمعلم</h3>
      <p className="text-sm text-gray-500 mb-4">استخدم هذا النموذج لكتابة مراجعة تظهر في صفحة المعلم فوراً. لا يتطلب حساب طالب.</p>
      
      <form onSubmit={async (e) => {
        e.preventDefault()
        const target = e.target as typeof e.target & {
          reviewer_name: { value: string };
          rating: { value: string };
          comment: { value: string };
          submitBtn: { disabled: boolean };
        };
        
        target.submitBtn.disabled = true;
        try {
          const res = await fetch('/api/admin/add-review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teacher_id: teacherId,
              reviewer_name: target.reviewer_name.value,
              rating: target.rating.value,
              comment: target.comment.value
            })
          })
          if (!res.ok) throw new Error('فشل إضافة التقييم')
          toast.success('تم إضافة التقييم بنجاح')
          target.reviewer_name.value = ''
          target.comment.value = ''
          target.rating.value = '5'
          router.refresh()
        } catch (err: any) {
          toast.error(err.message)
        } finally {
          target.submitBtn.disabled = false;
        }
      }} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم كاتب التقييم (يظهر للجمهور)</label>
            <input required type="text" name="reviewer_name" placeholder="مثال: أحمد محمود" className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">التقييم (من 1 إلى 5)</label>
            <select name="rating" className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 font-bold">
              <option value="5">⭐⭐⭐⭐⭐ (5)</option>
              <option value="4">⭐⭐⭐⭐ (4)</option>
              <option value="3">⭐⭐⭐ (3)</option>
              <option value="2">⭐⭐ (2)</option>
              <option value="1">⭐ (1)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">التعليق (المراجعة)</label>
          <textarea name="comment" rows={3} placeholder="اكتب مراجعة إيجابية هنا..." className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500"></textarea>
        </div>
        <div className="flex justify-end">
          <Button type="submit" name="submitBtn" variant="success">نشر التقييم</Button>
        </div>
      </form>
    </div>
    </>
  )
}
