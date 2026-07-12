"use client"

import { useState } from 'react'
import { Review } from '@/types'
import { CheckCircle, XCircle, EyeOff, Trash2, AlertTriangle, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils/helpers'

interface ReviewsTableProps {
  initialReviews: Review[]
}

export function ReviewsTable({ initialReviews }: ReviewsTableProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [filterStatus, setFilterStatus] = useState<string>('pending')
  const supabase = createClient()
  const router = useRouter()

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: newStatus })
        .eq('id', id)
        
      if (error) throw error
      
      setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus as any } : r))
      toast.success(`تم تغيير حالة التقييم إلى ${newStatus}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('حدث خطأ أثناء تغيير الحالة')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return
    
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id)
        
      if (error) throw error
      
      setReviews(reviews.filter(r => r.id !== id))
      toast.success('تم حذف التقييم')
      router.refresh()
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  const filteredReviews = reviews.filter(r => filterStatus === 'all' || r.status === filterStatus)

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50 rounded-t-lg">
        <h3 className="font-medium text-gray-700">تصفية التقييمات</h3>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium border ${filterStatus === 'all' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700'}`}
          >
            الكل
          </button>
          <button 
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-full text-sm font-medium border ${filterStatus === 'pending' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-700'}`}
          >
            بانتظار المراجعة
          </button>
          <button 
            onClick={() => setFilterStatus('published')}
            className={`px-4 py-2 rounded-full text-sm font-medium border ${filterStatus === 'published' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700'}`}
          >
            منشورة
          </button>
          <button 
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-full text-sm font-medium border ${filterStatus === 'rejected' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700'}`}
          >
            مرفوضة
          </button>
          <button 
            onClick={() => setFilterStatus('flagged')}
            className={`px-4 py-2 rounded-full text-sm font-medium border ${filterStatus === 'flagged' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700'}`}
          >
            مبلغ عنها
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">الطالب</th>
              <th className="px-6 py-3">المعلم</th>
              <th className="px-6 py-3">التقييم والتعليق</th>
              <th className="px-6 py-3">تاريخ الإضافة</th>
              <th className="px-6 py-3">الحالة</th>
              <th className="px-6 py-3 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.length > 0 ? (
              filteredReviews.map(review => (
                <tr key={review.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {review.student?.display_name || review.reviewer_name || 'طالب محذوف'}
                    {!review.student && review.reviewer_name && <span className="text-xs text-gray-400 block">(تقييم إداري)</span>}
                  </td>
                  <td className="px-6 py-4 font-medium text-blue-600">
                    {review.teacher?.display_name || 'معلم محذوف'}
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="flex text-yellow-500 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <div className="text-gray-600 text-xs truncate whitespace-normal leading-relaxed">
                      {review.comment || <span className="italic text-gray-400">لا يوجد تعليق مكتوب</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4" dir="ltr">
                    {formatDate(review.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      review.status === 'published' ? 'bg-green-100 text-green-800' :
                      review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      review.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      review.status === 'flagged' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {review.status === 'published' && 'منشور'}
                      {review.status === 'pending' && 'قيد المراجعة'}
                      {review.status === 'rejected' && 'مرفوض'}
                      {review.status === 'hidden' && 'مخفي'}
                      {review.status === 'flagged' && 'مبلغ عنه'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {review.status === 'pending' && (
                        <>
                          <button onClick={() => handleStatusChange(review.id, 'published')} className="text-green-600 hover:text-green-800" title="نشر">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleStatusChange(review.id, 'rejected')} className="text-red-600 hover:text-red-800" title="رفض">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      
                      {review.status === 'published' && (
                        <button onClick={() => handleStatusChange(review.id, 'hidden')} className="text-gray-600 hover:text-gray-800" title="إخفاء">
                          <EyeOff className="w-5 h-5" />
                        </button>
                      )}

                      {review.status === 'flagged' && (
                        <>
                          <button onClick={() => handleStatusChange(review.id, 'published')} className="text-green-600 hover:text-green-800" title="السماح بالنشر">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleStatusChange(review.id, 'hidden')} className="text-gray-600 hover:text-gray-800" title="إخفاء">
                            <EyeOff className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      <button onClick={() => handleDelete(review.id)} className="text-red-600 hover:text-red-800" title="حذف نهائي">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 bg-white">
                  لا توجد تقييمات في هذه الحالة...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
