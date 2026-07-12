"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Calendar, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface BookingModalProps {
  teacherId: string
  teacherName: string
  className?: string
}

export function BookingModal({ teacherId, teacherName, className }: BookingModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    session_date: '',
    notes: ''
  })
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/student/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          session_date: formData.session_date || null,
          notes: formData.notes
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to submit booking')

      toast.success('تم إرسال الطلب بنجاح. سيقوم المعلم أو إدارة المنصة بالتواصل معك قريباً لتأكيد الموعد.')
      
      setIsOpen(false)
      setFormData({ session_date: '', notes: '' })
    } catch (error: any) {
      toast.error(error.message || 'يرجى المحاولة مرة أخرى لاحقاً')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className={`bg-primary-600 hover:bg-primary-700 gap-2 ${className}`}>
          <Calendar className="w-4 h-4" /> احجز موعد
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-right">طلب حجز مع أ. {teacherName}</DialogTitle>
          <DialogDescription className="text-right">
            قم بتعبئة النموذج التالي وسنتواصل معك لتأكيد الحجز.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">التاريخ المفضل (اختياري)</label>
            <Input 
              type="date"
              value={formData.session_date}
              onChange={(e) => setFormData({...formData, session_date: e.target.value})}
              dir="rtl"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">ملاحظات إضافية (اختياري)</label>
            <Textarea 
              placeholder="اكتب هنا إذا كان لديك استفسار محدد أو وقت مفضل للاتصال بك..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'تأكيد إرسال الطلب'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
