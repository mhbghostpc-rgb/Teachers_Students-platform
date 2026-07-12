"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EducationalStage, Subject } from '@/types'
import { CITIES, TEACHING_TYPES, SYSTEM_TYPES, STAGES_BY_SYSTEM, SUBJECTS_BY_SYSTEM_AND_STAGE } from '@/lib/utils/constants'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export function AddTeacherForm() {
  const router = useRouter()
  const supabase = createClient()
  
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [stages, setStages] = useState<EducationalStage[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    display_name: '',
    phone: '',
    whatsapp: '',
    city: '',
    area: '',
    teaching_type: 'online',
    experience_years: 0,
    price_per_session: '',
    session_duration: 60,
    status: 'approved',
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
    async function loadLookups() {
      const [stagesRes, subjectsRes] = await Promise.all([
        supabase.from('educational_stages').select('*').eq('is_active', true),
        supabase.from('subjects').select('*').eq('is_active', true)
      ])

      if (stagesRes.data) setStages(stagesRes.data)
      if (subjectsRes.data) setSubjects(subjectsRes.data)
      setLoading(false)
    }
    loadLookups()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData({ ...formData, gallery_images: value.split(',').map(url => url.trim()).filter(Boolean) })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.selectedStages.length === 0 || formData.selectedSubjects.length === 0) {
      toast.error('يجب اختيار مرحلة تعليمية ومادة دراسية واحدة على الأقل')
      return
    }

    setSubmitting(true)
    try {
      // 1. Create user in Supabase Auth (We must use admin API or signUp)
      // Since admin API requires service role, we might have to use signUp
      // WARNING: Client side signUp logs the current admin out! 
      // This is a known issue. The proper way is a server action using service_role key.
      
      const submitData = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          submitData.append(key, JSON.stringify(value))
        } else {
          submitData.append(key, value.toString())
        }
      })
      
      if (profileImage) {
        submitData.append('profile_image', profileImage)
      }

      const response = await fetch('/api/admin/create-teacher', {
        method: 'POST',
        body: submitData
      })

      if (!response.ok) {
        let errorMessage = 'فشل في إنشاء الحساب'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.error("Non-JSON error:", e)
        }
        throw new Error(errorMessage)
      }

      toast.success('تم إضافة المعلم بنجاح')
      router.push('/admin/teachers')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow border border-gray-200 max-w-4xl space-y-8">
      
      {/* Account Info */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">بيانات الحساب</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" dir="ltr" />
          </div>
        </div>
      </section>

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
            <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" />
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
            <input type="text" onChange={handleGalleryChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500" dir="ltr" placeholder="ضع روابط الصور مفصولة بفاصلة (,)" />
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
            <select name="teaching_type" required value={formData.teaching_type} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة عند الإضافة</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500">
              <option value="approved">معتمد (يظهر للطلاب فوراً)</option>
              <option value="pending">قيد المراجعة</option>
            </select>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {submitting ? 'جاري الإضافة...' : 'إضافة المعلم'}
        </Button>
      </div>

    </form>
  )
}
