"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { Teacher } from '@/types'

export function EditTeacherProfileForm({ teacher, onSuccess }: { teacher: Teacher, onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    display_name: teacher.display_name || '',
    phone: teacher.phone || '',
    whatsapp: teacher.whatsapp || '',
    city: teacher.city || '',
    area: teacher.area || '',
    teaching_type: teacher.teaching_type || 'both',
    profile_image: teacher.profile_image || '',
    about: teacher.about || '',
    price_per_session: teacher.price_per_session || '',
    experience_years: teacher.experience_years || '',
    video_url: teacher.video_url || '',
    booking_url: teacher.booking_url || '',
  })

  const [uploadingImage, setUploadingImage] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    
    try {
      console.log('Compressing image natively...')
      
      // Native Canvas Compression to avoid device freeze
      const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = (event) => {
            const img = new Image()
            img.src = event.target?.result as string
            img.onload = () => {
              const canvas = document.createElement('canvas')
              const MAX_WIDTH = 800
              const MAX_HEIGHT = 800
              let width = img.width
              let height = img.height

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width
                  width = MAX_WIDTH
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height
                  height = MAX_HEIGHT
                }
              }
              canvas.width = width
              canvas.height = height
              const ctx = canvas.getContext('2d')
              ctx?.drawImage(img, 0, 0, width, height)
              
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  }))
                } else {
                  reject(new Error('فشل ضغط الصورة'))
                }
              }, 'image/jpeg', 0.6) // 60% quality JPEG for maximum compression
            }
            img.onerror = () => reject(new Error('فشل قراءة الصورة'))
          }
          reader.onerror = () => reject(new Error('فشل تحميل الملف'))
        })
      }

      const compressedFile = await compressImage(file)
      console.log('Image compressed natively:', compressedFile.size)
      
      const formDataUpload = new FormData()
      formDataUpload.append('image', compressedFile)

      console.log('Uploading image to server...')
      const res = await fetch('/api/teacher/upload-image', {
        method: 'POST',
        body: formDataUpload,
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'فشل رفع الصورة')
      
      setFormData(prev => ({ ...prev, profile_image: data.imageUrl }))
      toast.success('تم رفع وتحديث الصورة بنجاح!')
    } catch (error: any) {
      console.error('Upload Error:', error)
      toast.error(error.message || 'حدث خطأ أثناء الرفع')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/teacher/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل تحديث البيانات')
      }

      toast.success('تم تحديث الملف الشخصي بنجاح')
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">الاسم بالكامل</label>
          <Input name="display_name" value={formData.display_name} onChange={handleChange} required />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">الصورة الشخصية</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 border overflow-hidden shrink-0">
              {formData.profile_image ? (
                <img src={formData.profile_image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">بدون</div>
              )}
            </div>
            <div className="flex-1">
              <input 
                type="file" 
                accept="image/*" 
                id="profile-upload" 
                className="hidden" 
                onChange={handleImageUpload} 
                disabled={uploadingImage}
              />
              <label 
                htmlFor="profile-upload" 
                className={`flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'اختر صورة من جهازك'}
              </label>
              <p className="text-xs text-gray-500 mt-2">يتم حفظ الصورة تلقائياً بمجرد اختيارها</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">رقم الهاتف</label>
          <Input name="phone" value={formData.phone} onChange={handleChange} dir="ltr" className="text-right" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">رقم الواتساب</label>
          <Input name="whatsapp" value={formData.whatsapp} onChange={handleChange} dir="ltr" className="text-right" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">المحافظة</label>
          <Input name="city" value={formData.city} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">المنطقة</label>
          <Input name="area" value={formData.area} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">سعر الحصة التقريبي (جنيه)</label>
          <Input type="number" name="price_per_session" value={formData.price_per_session} onChange={handleChange} dir="ltr" className="text-right" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">سنوات الخبرة</label>
          <Input type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} dir="ltr" className="text-right" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">رابط فيديو تعريفي (YouTube)</label>
          <Input name="video_url" value={formData.video_url} onChange={handleChange} dir="ltr" className="text-right" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">رابط منصتك الخاصة أو صفحة الحجز (اختياري)</label>
          <Input name="booking_url" value={formData.booking_url} onChange={handleChange} dir="ltr" className="text-right" placeholder="https://..." />
          <p className="text-xs text-gray-500">سيظهر هذا الرابط للطلاب بشكل مميز ليتمكنوا من الحجز معك</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">طريقة التدريس</label>
          <select 
            name="teaching_type" 
            value={formData.teaching_type} 
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="both">أونلاين وحضوري</option>
            <option value="online">أونلاين فقط</option>
            <option value="offline">حضوري فقط</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">نبذة عنك</label>
        <Textarea 
          name="about" 
          value={formData.about} 
          onChange={handleChange} 
          rows={5} 
          placeholder="اكتب نبذة احترافية عن خبراتك وطريقة تدريسك..." 
        />
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" variant="gradient" className="gap-2 min-w-[150px]" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          حفظ التعديلات
        </Button>
      </div>
    </form>
  )
}
