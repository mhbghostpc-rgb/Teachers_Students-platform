"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Loader2, 
  Ticket, 
  Plus, 
  Trash2, 
  Copy
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface DiscountCode {
  id: string
  code: string
  discount_percentage: number
  max_uses: number | null
  current_uses: number
  valid_until: string | null
  is_active: boolean
  created_at: string
}

export default function CodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<DiscountCode>>({ is_active: true, discount_percentage: 10 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const supabase = createClient()
  const fetchCodes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCodes(data || [])
    } catch (error) {
      console.error('Error fetching codes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCodes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code || !formData.discount_percentage) {
      toast.error('يرجى إدخال الكود ونسبة الخصم')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('discount_codes').insert([{
        code: formData.code.toUpperCase(),
        discount_percentage: formData.discount_percentage,
        max_uses: formData.max_uses || null,
        valid_until: formData.valid_until || null,
        is_active: formData.is_active
      }])
      
      if (error) throw error
      toast.success('تم إنشاء الكود بنجاح')
      
      setIsDialogOpen(false)
      setFormData({ is_active: true, discount_percentage: 10 })
      fetchCodes()
    } catch (error: any) {
      console.error('Error saving code:', error)
      toast.error(error.message?.includes('unique') ? 'هذا الكود مستخدم بالفعل' : 'حدث خطأ أثناء حفظ الكود')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكود؟')) return
    
    try {
      const { error } = await supabase.from('discount_codes').delete().eq('id', id)
      if (error) throw error
      toast.success('تم حذف الكود')
      setCodes(codes.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting code:', error)
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    try {
      const { error } = await supabase.from('discount_codes').update({ is_active: newStatus }).eq('id', id)
      if (error) throw error
      setCodes(codes.map(c => c.id === id ? { ...c, is_active: newStatus } : c))
      toast.success('تم تحديث حالة الكود')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('حدث خطأ أثناء التحديث')
    }
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code: result })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-primary-600" />
            أكواد الخصم
          </h1>
          <p className="text-sm text-gray-500">
            إدارة كوبونات وأكواد الخصم الترويجية للطلاب
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setFormData({ is_active: true, discount_percentage: 10 })
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary-600 hover:bg-primary-700">
              <Plus className="w-4 h-4" /> كود جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>إنشاء كود خصم جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>كود الخصم</Label>
                <div className="flex gap-2">
                  <Input 
                    value={formData.code || ''} 
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="مثال: WINTER20"
                    dir="ltr"
                    className="text-left font-mono"
                    maxLength={20}
                  />
                  <Button type="button" variant="outline" onClick={generateRandomCode}>
                    توليد
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>نسبة الخصم (%)</Label>
                <Input 
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discount_percentage || ''} 
                  onChange={(e) => setFormData({...formData, discount_percentage: parseInt(e.target.value)})}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>الحد الأقصى للاستخدام (اختياري)</Label>
                <Input 
                  type="number"
                  min="1"
                  value={formData.max_uses || ''} 
                  onChange={(e) => setFormData({...formData, max_uses: parseInt(e.target.value) || undefined})}
                  placeholder="اتركه فارغاً لعدد غير محدود"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الانتهاء (اختياري)</Label>
                <Input 
                  type="date"
                  value={formData.valid_until ? new Date(formData.valid_until).toISOString().split('T')[0] : ''} 
                  onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ الكود'}
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
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الكود</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">نسبة الخصم</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">الاستخدام</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">تاريخ الانتهاء</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">الحالة</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    لا توجد أكواد خصم مسجلة
                  </td>
                </tr>
              ) : (
                codes.map((code) => {
                  const isExpired = code.valid_until && new Date(code.valid_until) < new Date()
                  const isExhausted = code.max_uses && code.current_uses >= code.max_uses
                  
                  return (
                    <tr key={code.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800 font-bold tracking-wider">
                            {code.code}
                          </span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(code.code)
                            toast.success('تم نسخ الكود للحافظة')
                            }}
                            className="text-gray-400 hover:text-primary-600 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-green-600">
                        {code.discount_percentage}%
                      </td>
                      <td className="px-4 py-4 text-center text-gray-600">
                        {code.current_uses} / {code.max_uses || 'غير محدود'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {code.valid_until ? (
                          <span className={isExpired ? 'text-red-500' : 'text-gray-600'}>
                            {new Date(code.valid_until).toLocaleDateString('ar-EG')}
                          </span>
                        ) : (
                          <span className="text-gray-400">مفتوح</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Switch 
                          checked={code.is_active && !isExpired && !isExhausted}
                          disabled={!!isExpired || !!isExhausted}
                          onCheckedChange={() => toggleStatus(code.id, code.is_active)}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(code.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
