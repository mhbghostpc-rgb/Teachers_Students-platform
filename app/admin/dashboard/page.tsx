import { Card, CardContent } from '@/components/ui/card'
import { Users, GraduationCap, Star, Clock, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'لوحة التحكم | منصة المعلمين',
}

export default async function AdminDashboard() {
  const supabase = createClient()
  
  // Fetch stats concurrently
  const [
    { count: teachersCount },
    { count: studentsCount },
    { count: reviewsCount },
    { count: pendingReviewsCount },
    { count: visitorsCount }
  ] = await Promise.all([
    supabase.from('teachers').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('site_visitors').select('*', { count: 'exact', head: true })
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">نظرة عامة</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">المعلمين</p>
              <h3 className="text-2xl font-bold text-gray-900">{teachersCount || 0}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">الطلاب</p>
              <h3 className="text-2xl font-bold text-gray-900">{studentsCount || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
              <Star className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">إجمالي التقييمات</p>
              <h3 className="text-2xl font-bold text-gray-900">{reviewsCount || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-full">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">بانتظار المراجعة</p>
              <h3 className="text-2xl font-bold text-gray-900">{pendingReviewsCount || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
              <Eye className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">إجمالي الزوار</p>
              <h3 className="text-2xl font-bold text-gray-900">{visitorsCount || 0}</h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts placeholder */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 h-64 flex flex-col justify-center items-center mt-8 shadow-sm">
        <h3 className="text-lg font-bold mb-2">مساحة للرسوم البيانية والإحصائيات المتقدمة</h3>
        <p>سيتم عرض الإحصائيات الخاصة بالإعلانات وتفاعل الطلاب هنا.</p>
      </div>
    </div>
  )
}
