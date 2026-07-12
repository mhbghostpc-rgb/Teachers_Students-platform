"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'

export function ReviewDialog({ teacherId, teacherName }: { teacherId: string, teacherName: string }) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('يرجى تحديد التقييم')
      return
    }

    setSubmitting(true)
    try {
      // Logic would be added to save review to the database here
      toast.success('تم إرسال التقييم بنجاح للادارة للمراجعة')
      setOpen(false)
    } catch (error) {
      toast.error('حدث خطأ أثناء إرسال التقييم')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Star className="w-4 h-4" />
          تقييم المعلم
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تقييم الأستاذ {teacherName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">تعليق (اختياري)</label>
            <textarea
              className="w-full border border-gray-200 rounded-md p-2 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="اكتب تعليقك هنا..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
