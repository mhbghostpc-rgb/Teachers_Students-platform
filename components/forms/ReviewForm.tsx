"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, Send, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { reviewSchema } from '@/lib/utils/validators'

type ReviewFormData = z.infer<typeof reviewSchema>

interface ReviewFormProps {
  teacherId: string
}

export function ReviewForm({ teacherId }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' }
  })

  const handleFormSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, rating, teacherId })
      })
      const result = await res.json()
      
      if (!res.ok) throw new Error(result.error || 'حدث خطأ')
      
      setIsSuccess(true)
      reset()
      setRating(0)
      toast.success('تم إرسال التقييم بنجاح! ينتظر موافقة الإدارة.')
      
      setTimeout(() => setIsSuccess(false), 5000)
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ، يرجى المحاولة مرة أخرى')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
    >
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary-700">
        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
        قيّم المدرس
      </h3>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            اختر التقييم
          </label>
          <div className="flex items-center gap-2 dir-ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => {
                  setRating(star)
                  reset({ rating: star })
                }}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
          {errors.rating && (
            <span className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-4 w-4" />
              يرجى اختيار التقييم
            </span>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            أضف تعليقك (اختياري ولكن مفيد للآخرين)
          </label>
          <Textarea
            {...register('comment')}
            placeholder="شارك تجربتك مع هذا المعلم..."
            className="min-h-[100px] resize-none focus:ring-primary-500 focus:border-primary-500"
          />
          {errors.comment && (
            <span className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-4 w-4" />
              {errors.comment.message}
            </span>
          )}
        </div>

        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-green-50 text-green-800 p-3 rounded-lg flex items-center gap-2 overflow-hidden"
            >
              <CheckCircle className="h-5 w-5" />
              <span>تم إرسال تقييمك بنجاح! سيظهر بعد مراجعته.</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full gap-2"
          variant="gradient"
        >
          {isSubmitting ? (
            <span className="animate-pulse">جاري الإرسال...</span>
          ) : (
            <>
              <Send className="h-4 w-4" />
              إرسال التقييم
            </>
          )}
        </Button>
      </form>
    </motion.div>
  )
}
