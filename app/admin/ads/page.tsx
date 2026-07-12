"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Loader2, 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface Ad {
  id: string
  title: string
  image_url: string
  target_url: string
  status: 'active' | 'inactive'
  start_date: string
  end_date: string | null
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Ad>>({ status: 'active' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const supabase = createClient()
  const fetchAds = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('platform_ads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAds(data || [])
    } catch (error) {
      console.error('Error fetching ads:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAds()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.image_url) {
      toast.error('يرجى إدخال العنوان وصورة الإعلان')
      return
    }

    setIsSubmitting(true)
    try {
      if (formData.id) {
        const { error } = await supabase.from('platform_ads').update(formData).eq('id', formData.id)
        if (error) throw error
        toast.success('تم تحديث الإعلان بنجاح')
      } else {
        const { error } = await supabase.from('platform_ads').insert([formData])
        if (error) throw error
        toast.success('تم إضافة الإعلان بنجاح')
      }
      setIsDialogOpen(false)
      setFormData({ status: 'active' })
      fetchAds()
    } catch (error) {
      console.error('Error saving ad:', error)
      toast.error('حدث خطأ أثناء حفظ الإعلان')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return
    
    try {
      const { error } = await supabase.from('platform_ads').delete().eq('id', id)
      if (error) throw error
      toast.success('تم حذف الإعلان')
      setAds(ads.filter(a => a.id !== id))
    } catch (error) {
      console.error('Error deleting ad:', error)
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      const { error } = await supabase.from('platform_ads').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      setAds(ads.map(a => a.id === id ? { ...a, status: newStatus } : a))
      toast.success('تم تحديث حالة الإعلان')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('حدث خطأ أثناء التحديث')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary-600" />
            الإعلانات والتمويل
          </h1>
          <p className="text-sm text-gray-500">
            إدارة البانرات الإعلانية التي تظهر للطلاب في الصفحة الرئيسية
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setFormData({ status: 'active' })
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary-600 hover:bg-primary-700">
              <Plus className="w-4 h-4" /> إعلان جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{formData.id ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>عنوان الإعلان</Label>
                <Input 
                  value={formData.title || ''} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="مثال: خصم خاص على حصص المراجعة"
                />
              </div>
              <div className="space-y-2">
                <Label>رابط الصورة (URL)</Label>
                <Input 
                  value={formData.image_url || ''} 
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://example.com/banner.jpg"
                  dir="ltr"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label>رابط التوجيه (عند الضغط)</Label>
                <Input 
                  value={formData.target_url || ''} 
                  onChange={(e) => setFormData({...formData, target_url: e.target.value})}
                  placeholder="https://..."
                  dir="ltr"
                  className="text-right"
                />
              </div>
              <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ الإعلان'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-100">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الإعلان</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">رابط التوجيه</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">الحالة</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                  </td>
                </tr>
              ) : ads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-500">
                    لا توجد إعلانات مسجلة
                  </td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-24 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          {/* We use standard img to avoid Next.js Image external domain issues unless configured */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                        </div>
                        <p className="font-semibold text-gray-900">{ad.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {ad.target_url ? (
                        <a href={ad.target_url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline flex items-center justify-center gap-1">
                          <ExternalLink className="w-4 h-4" />
                          زيارة الرابط
                        </a>
                      ) : (
                        <span className="text-gray-400">لا يوجد رابط</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Switch 
                        checked={ad.status === 'active'}
                        onCheckedChange={() => toggleStatus(ad.id, ad.status)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setFormData(ad)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(ad.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
