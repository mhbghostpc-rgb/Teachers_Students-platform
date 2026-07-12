"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RatingStars } from '@/components/shared/RatingStars'
import { createClient } from '@/lib/supabase/client'
import { Teacher, Review } from '@/types'
import { Loader2, Star, Users, CheckCircle, Clock, AlertCircle, Edit, User, Eye, LogOut } from 'lucide-react'
import { formatDate } from '@/lib/utils/helpers'
import { SupportChatWidget } from '@/components/shared/SupportChatWidget'
import { EditTeacherProfileForm } from '@/components/forms/EditTeacherProfileForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TeacherDashboard() {
  const router = useRouter()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Check if user is teacher
      const { data: userData } = await supabase
        .from('users')
        .select('role_name')
        .eq('id', session.user.id)
        .single()

      if (userData?.role_name !== 'teacher') {
        router.push('/')
        return
      }

      // Fetch teacher profile
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (teacherError) throw teacherError
      setTeacher(teacherData as Teacher)

      // Fetch teacher reviews
      if (teacherData) {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select(`
            *,
            student:students(display_name)
          `)
          .eq('teacher_id', teacherData.id)
          .order('created_at', { ascending: false })

        if (reviewsData) {
          setReviews(reviewsData as any[])
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">حدث خطأ في تحميل البيانات</h2>
        </div>
      </div>
    )
  }

  const approvedReviews = reviews.filter(r => r.status === 'published')
  const pendingReviews = reviews.filter(r => r.status === 'pending')

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Premium Header Profile Area */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-secondary-600 text-white pt-12 pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
        <div className="container mx-auto max-w-6xl relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-bold overflow-hidden relative">
              {teacher.profile_image ? (
                <img src={teacher.profile_image} alt={teacher.display_name} className="w-full h-full object-cover" />
              ) : (
                teacher.display_name.charAt(0)
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">مرحباً، {teacher.display_name}</h1>
              <p className="text-primary-100 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {teacher.average_rating.toFixed(1)} من {teacher.reviews_count} تقييم
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              onClick={() => window.open(`/teachers/${teacher.id}`, '_blank')}
            >
              <Eye className="w-4 h-4 ml-2" />
              معاينة الملف
            </Button>
            <Button 
              variant="outline" 
              className="bg-white text-primary-700 hover:bg-gray-100"
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/')
              }}
            >
              <LogOut className="w-4 h-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 -mt-12 relative z-20">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 mb-6 h-14 w-full md:w-auto overflow-x-auto flex-nowrap whitespace-nowrap">
            <TabsTrigger value="overview" className="h-full px-6 rounded-lg data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 text-base flex-shrink-0">
              <User className="w-4 h-4 ml-2" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="edit" className="h-full px-6 rounded-lg data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 text-base flex-shrink-0">
              <Edit className="w-4 h-4 ml-2" />
              تعديل الملف الشخصي
            </TabsTrigger>
            <TabsTrigger value="reviews" className="h-full px-6 rounded-lg data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 text-base flex-shrink-0">
              <Star className="w-4 h-4 ml-2" />
              التقييمات ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              
              {teacher.status !== 'approved' && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-5 mb-6 flex items-start gap-3 shadow-sm">
                  <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-lg">حسابك قيد المراجعة</h3>
                    <p className="text-sm mt-1 opacity-90">لن يظهر حسابك للطلاب في نتائج البحث حتى يتم اعتماده من قبل الإدارة. يرجى الانتظار أو التواصل مع الدعم الفني.</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 text-blue-900 rounded-xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-full flex-shrink-0 text-blue-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">هل كان لديك ملف شخصي سابق على المنصة؟</h3>
                    <p className="text-sm mt-1 opacity-80 max-w-2xl">
                      إذا تم إضافة بياناتك مسبقاً من قبل الإدارة وتريد ربط هذا الحساب بملفك القديم للاحتفاظ بتقييماتك وبياناتك السابقة.
                    </p>
                  </div>
                </div>
                <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-md" onClick={() => router.push('/teachers')}>
                  ابحث عن اسمك واربط حسابك
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-0 shadow-sm ring-1 ring-gray-100 overflow-hidden">
                  <div className="h-1 w-full bg-primary-500"></div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">متوسط التقييم</p>
                        <h3 className="text-3xl font-black text-gray-900">{teacher.average_rating.toFixed(1)}</h3>
                      </div>
                      <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                        <Star className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <RatingStars rating={teacher.average_rating} size="sm" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm ring-1 ring-gray-100 overflow-hidden">
                  <div className="h-1 w-full bg-green-500"></div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">التقييمات المعتمدة</p>
                        <h3 className="text-3xl font-black text-gray-900">{approvedReviews.length}</h3>
                      </div>
                      <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm ring-1 ring-gray-100 overflow-hidden">
                  <div className="h-1 w-full bg-yellow-500"></div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">تقييمات قيد المراجعة</p>
                        <h3 className="text-3xl font-black text-gray-900">{pendingReviews.length}</h3>
                      </div>
                      <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                        <Clock className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Support Widget directly accessible */}
              <Card className="border-0 shadow-sm ring-1 ring-gray-100 overflow-hidden bg-white relative">
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary-500"></div>
                <CardHeader>
                  <CardTitle>الدعم الفني للإدارة</CardTitle>
                  <CardDescription>لديك مشكلة أو استفسار؟ تواصل مع الإدارة مباشرة عبر المحادثات أو الرسائل الصوتية.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 inline-block">
                    <SupportChatWidget />
                  </div>
                </CardContent>
              </Card>

            </motion.div>
          </TabsContent>

          <TabsContent value="edit">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-0 shadow-sm ring-1 ring-gray-100 overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                  <CardTitle className="text-xl">تحديث البيانات</CardTitle>
                  <CardDescription>قم بتحديث صورتك الشخصية وتفاصيل التدريس لتظهر بشكل أفضل للطلاب.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                  <EditTeacherProfileForm teacher={teacher} onSuccess={fetchDashboardData} />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="reviews">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-0 shadow-sm ring-1 ring-gray-100 overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                  <CardTitle className="text-xl">سجل التقييمات</CardTitle>
                  <CardDescription>جميع آراء الطلاب التي تم تقديمها لحسابك.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {reviews.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {reviews.map((review) => (
                        <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                                {review.student?.display_name?.charAt(0) || 'ط'}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{review.student?.display_name || 'طالب غير معروف'}</h4>
                                <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <RatingStars rating={review.rating} size="sm" />
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                review.status === 'published' ? 'bg-green-100 text-green-800' :
                                review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {review.status === 'published' ? 'معتمد' :
                                review.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                              </span>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-gray-600 mt-3 pr-14 leading-relaxed">
                              {review.comment}
                            </p>
                          )}
                          {review.status === 'rejected' && review.rejection_reason && (
                            <div className="mt-3 pr-14">
                              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <p><strong>سبب الرفض:</strong> {review.rejection_reason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-16 text-center">
                      <Star className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">لا توجد تقييمات حتى الآن</h3>
                      <p className="text-gray-500 mt-1">عندما يقوم الطلاب بتقييمك، ستظهر التقييمات هنا.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}
