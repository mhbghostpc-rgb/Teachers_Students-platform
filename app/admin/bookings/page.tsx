"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Loader2, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Booking {
  id: string
  student_id: string
  teacher_id: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  session_date: string | null
  notes: string | null
  created_at: string
  students: {
    display_name: string
    phone: string
  }
  teachers: {
    display_name: string
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  const supabase = createClient()
  const fetchBookings = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          students:student_id (display_name, phone),
          teachers:teacher_id (display_name)
        `)
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setBookings(data as any[])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('حدث خطأ أثناء جلب الطلبات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [filterStatus])

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      
      setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus as any } : b))
      toast.success('تم تحديث حالة الطلب بنجاح')
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error('حدث خطأ أثناء التحديث')
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="flex items-center justify-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium"><Clock className="w-3 h-3"/> قيد الانتظار</span>
      case 'confirmed': return <span className="flex items-center justify-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3"/> مؤكد</span>
      case 'completed': return <span className="flex items-center justify-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3"/> مكتمل</span>
      case 'cancelled': return <span className="flex items-center justify-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium"><XCircle className="w-3 h-3"/> ملغي</span>
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600" />
            الحجوزات والطلبات
          </h1>
          <p className="text-sm text-gray-500">
            متابعة طلبات الانضمام والحجوزات من الطلاب للمعلمين
          </p>
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="حالة الطلب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="confirmed">مؤكد</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-100">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">التاريخ</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الطالب</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">المعلم المُراد</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">الحالة</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">ملاحظات</th>
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
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    لا يوجد طلبات حالياً
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm">
                      {new Date(booking.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{booking.students?.display_name || 'طالب محذوف'}</div>
                      <div className="text-xs text-gray-500" dir="ltr">{booking.students?.phone}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-primary-600">{booking.teachers?.display_name || 'معلم محذوف'}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {booking.notes || '-'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700 h-8"
                              onClick={() => updateStatus(booking.id, 'confirmed')}
                              disabled={updatingId === booking.id}
                            >
                              تأكيد
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="h-8"
                              onClick={() => updateStatus(booking.id, 'cancelled')}
                              disabled={updatingId === booking.id}
                            >
                              إلغاء
                            </Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 h-8"
                            onClick={() => updateStatus(booking.id, 'completed')}
                            disabled={updatingId === booking.id}
                          >
                            اكتمل
                          </Button>
                        )}
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
