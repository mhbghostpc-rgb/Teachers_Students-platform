"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, AlertCircle } from 'lucide-react'

interface AdminReviewFormProps {
  reviewId: string
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, reason: string) => Promise<void>
}

export function AdminReviewForm({ reviewId, onApprove, onReject }: AdminReviewFormProps) {
  const [isRejecting, setIsRejecting] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ reason: string }>()

  const handleReject = async (data: { reason: string }) => {
    await onReject(reviewId, data.reason)
    reset()
    setIsRejecting(false)
  }

  if (isRejecting) {
    return (
      <form onSubmit={handleSubmit(handleReject)} className="space-y-3 mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
        <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
          <AlertCircle className="h-4 w-4" />
          <span>سبب رفض التقييم</span>
        </div>
        <Textarea
          {...register('reason', { required: 'يرجى كتابة سبب الرفض' })}
          placeholder="اكتب سبب الرفض هنا..."
          className="bg-white"
        />
        {errors.reason && <p className="text-sm text-red-500">{errors.reason.message}</p>}
        
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={() => setIsRejecting(false)}>
            إلغاء
          </Button>
          <Button type="submit" variant="destructive">
            تأكيد الرفض
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex gap-2 mt-4">
      <Button 
        onClick={() => onApprove(reviewId)} 
        variant="success" 
        size="sm" 
        className="flex-1 gap-2"
      >
        <Check className="h-4 w-4" />
        قبول التقييم
      </Button>
      <Button 
        onClick={() => setIsRejecting(true)} 
        variant="destructive" 
        size="sm" 
        className="flex-1 gap-2"
      >
        <X className="h-4 w-4" />
        رفض
      </Button>
    </div>
  )
}
