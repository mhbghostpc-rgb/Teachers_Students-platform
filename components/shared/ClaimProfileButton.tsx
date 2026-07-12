"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { UserCheck } from 'lucide-react'

export function ClaimProfileButton({ teacherId, teacherName }: { teacherId: string, teacherName: string }) {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, phone })
      })

      let data;
      try {
        data = await res.json()
      } catch (e) {
        throw new Error('حدث خطأ غير متوقع في الخادم.')
      }

      if (!res.ok) {
        throw new Error(data?.error || 'حدث خطأ ما')
      }

      setStatus('success')
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || 'حدث خطأ أثناء الاتصال بالخادم.')
    }
  }

  // Reset state when modal is opened/closed
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setTimeout(() => {
        setStatus('idle')
        setPhone('')
        setErrorMessage('')
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 text-primary-600 border-primary-200 hover:bg-primary-50">
          <UserCheck className="w-4 h-4" /> هل أنت هذا المعلم؟
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">المطالبة بالملف الشخصي</DialogTitle>
          <DialogDescription className="text-right">
            هل أنت {teacherName}؟ أدخل رقم هاتفك المسجل لدينا لتأكيد هويتك وإرسال طلب لربط هذا الملف بحسابك الحالي.
            (يجب أن تكون مسجلاً الدخول بحسابك الجديد كمعلم أولاً).
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <UserCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">أهلاً بك أستاذ {teacherName}!</h3>
            <div className="text-gray-600 text-sm leading-relaxed space-y-3">
              <p>
                شرفنا بزيارتك لمنصتنا، دليلك الأول للمعلمين في جمهورية مصر العربية.
              </p>
              <p className="font-medium text-gray-900 bg-gray-50 p-2 rounded-lg">
                برجاء معاودة الدخول على الملف الشخصي الخاص بك بعد <span className="text-primary-600 font-bold">24 ساعة</span>، وذلك حتى تنتهي الإدارة من مراجعة طلبك وتفعيل الربط.
              </p>
              <p className="text-gray-500">
                لقد تشرفنا بوجودك معنا.. نحن منصة ستكبر بك ومعك، وسنصل معاً لكل مكان. وجودك يمثل إضافة كبيرة وقيمة حقيقية لمنصتنا، ونثق بأنك ستحقق أقصى استفادة من تواجدك بيننا.
              </p>
            </div>
            <Button className="w-full mt-4 bg-primary-600 hover:bg-primary-700" onClick={() => setOpen(false)}>حسناً، فهمت</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-right">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف (الذي تتواصل به مع المنصة)</label>
              <Input
                id="phone"
                type="tel"
                dir="ltr"
                placeholder="01xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="text-left focus-visible:ring-primary-500"
              />
            </div>

            {status === 'error' && (
              <p className="text-red-500 text-sm font-medium">{errorMessage}</p>
            )}

            <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700" disabled={status === 'loading' || !phone}>
              {status === 'loading' ? 'جاري الإرسال...' : 'تأكيد وإرسال الطلب'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
