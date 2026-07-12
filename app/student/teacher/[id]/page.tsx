import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { RatingStars } from '@/components/shared/RatingStars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClaimProfileButton } from '@/components/shared/ClaimProfileButton'
import { 
  MapPin, Phone, MessageCircle, Globe, Video, 
  GraduationCap, Clock, Banknote, BookOpen, Layers, Users
} from 'lucide-react'
import { ReviewDialog } from '@/components/shared/ReviewDialog'
import { CopyProfileLink } from '@/components/shared/CopyProfileLink'
import { WhatsAppWithDiscount } from '@/components/shared/WhatsAppWithDiscount'
import { BookingModal } from '@/components/shared/BookingModal'

export const revalidate = 0

const formatWhatsAppNumber = (phone: string) => {
  if (!phone) return ''
  let cleaned = phone.replace(/[\s\-\+]/g, '')
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '2' + cleaned // 201xxxxxxxxx
  }
  return cleaned
}

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
}

export default async function TeacherProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: teacher, error } = await supabase
    .from('teachers')
    .select(`
      *,
      teacher_stages (
        stage: educational_stages(name)
      ),
      teacher_subjects (
        subject: subjects(name)
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !teacher) {
    notFound()
  }

  // Fetch reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      student:students(display_name)
    `)
    .eq('teacher_id', params.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let totalReviews = 0

  if (reviews) {
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1
        totalReviews++
      }
    })
  }

  const stages = teacher.teacher_stages?.map((ts: any) => ts.stage?.name).filter(Boolean) || []
  const subjects = teacher.teacher_subjects?.map((ts: any) => ts.subject?.name).filter(Boolean) || []
  const embedUrl = getYoutubeEmbedUrl(teacher.video_url || '')

  const teachingTypeLabels = {
    online: 'أونلاين',
    offline: 'حضوري',
    both: 'أونلاين وحضوري'
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Cover Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 w-full relative">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        
        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            
            {/* Avatar */}
            <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-2xl border-4 border-white shadow-lg bg-white overflow-hidden relative">
              {teacher.profile_image ? (
                <Image src={teacher.profile_image} alt={teacher.display_name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                  <Users className="w-16 h-16 text-primary-300" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{teacher.display_name}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {teacher.city}، {teacher.area}
                    </div>
                    {teacher.school_name && (
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        {teacher.school_name}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <RatingStars rating={teacher.average_rating || 0} size="md" />
                  <span className="font-bold text-gray-900">{Number(teacher.average_rating || 0).toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({teacher.reviews_count || 0} تقييم)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="flex-1 md:flex-none">
                  <BookingModal 
                    teacherId={teacher.id} 
                    teacherName={teacher.display_name} 
                    className="w-full"
                  />
                </div>
                <Link href={`tel:${teacher.phone}`} className="flex-1 md:flex-none">
                  <Button variant="default" className="w-full gap-2 bg-primary-600 hover:bg-primary-700">
                    <Phone className="w-4 h-4" /> اتصال
                  </Button>
                </Link>
                <div className="flex-1 md:flex-none">
                  <WhatsAppWithDiscount 
                    teacherName={teacher.display_name} 
                    phone={teacher.whatsapp || teacher.phone || ''}
                  />
                </div>
                {teacher.website_url && (
                  <Link href={teacher.website_url} target="_blank" className="flex-1 md:flex-none">
                    <Button variant="outline" className="w-full gap-2">
                      <Globe className="w-4 h-4" /> الموقع الشخصي
                    </Button>
                  </Link>
                )}
              </div>

              {/* Claim Profile */}
              <div className="mt-4">
                <ClaimProfileButton teacherId={teacher.id} teacherName={teacher.display_name} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Right Column: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About */}
            {teacher.about && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </span>
                  نبذة عن المعلم
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{teacher.about}</p>
              </div>
            )}

            {/* Booking URL or Share Link - Premium Glassmorphism */}
            {teacher.booking_url ? (
              <div className="relative group overflow-hidden rounded-3xl p-1 mt-6 mb-8 transform transition-transform hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600 opacity-90 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 via-secondary-400 to-primary-500 animate-pulse-slow opacity-60"></div>
                
                <Link href={teacher.booking_url.startsWith('http') ? teacher.booking_url : `https://${teacher.booking_url}`} target="_blank" className="relative flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/20 backdrop-blur-xl border border-white/50 p-6 md:p-8 rounded-[1.4rem] shadow-2xl hover:shadow-primary-500/40 transition-all duration-300 overflow-hidden">
                  
                  {/* Glass reflection effect */}
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shimmer"></div>
                  
                  <div className="flex items-center gap-5 relative z-10 w-full sm:w-auto">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/40 to-white/10 border border-white/50 shadow-inner flex items-center justify-center flex-shrink-0 backdrop-blur-md">
                      <Globe className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white drop-shadow-md mb-1">منصة المعلم الخاصة</h3>
                      <p className="text-white/90 font-medium text-sm drop-shadow-sm">احجز الآن وتواصل مباشرة عبر المنصة الخاصة أو صفحة الحجز</p>
                    </div>
                  </div>
                  
                  <Button variant="secondary" className="relative z-10 bg-white text-primary-800 hover:bg-gray-50 hover:scale-105 transition-transform duration-300 shadow-xl border-0 h-12 px-8 rounded-xl font-bold text-lg w-full sm:w-auto shrink-0">
                    احجز الآن <span className="mr-2 text-xl">🚀</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <CopyProfileLink />
            )}

            {/* Video */}
            {embedUrl && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                    <Video className="w-5 h-5" />
                  </span>
                  فيديو تعريفي
                </h3>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100">
                  <iframe 
                    src={embedUrl} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              </div>
            )}

            {/* Gallery */}
            {teacher.gallery_images && teacher.gallery_images.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">معرض الصور</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {teacher.gallery_images.map((url: string, idx: number) => (
                    <div key={idx} className="aspect-square relative rounded-xl overflow-hidden bg-gray-100">
                      <Image src={url} alt={`صورة ${idx + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Left Column: Details & Stats */}
          <div className="space-y-8">
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">تفاصيل التدريس</h3>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Layers className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">الأنظمة التعليمية</p>
                    <div className="flex flex-wrap gap-1">
                      {teacher.system_types?.map((sys: string) => (
                        <Badge key={sys} variant="secondary" className="bg-purple-50 text-purple-700">{sys}</Badge>
                      ))}
                    </div>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">المراحل الدراسية</p>
                    <div className="flex flex-wrap gap-1">
                      {stages.map((stage: string) => (
                        <Badge key={stage} variant="secondary" className="bg-blue-50 text-blue-700">{stage}</Badge>
                      ))}
                    </div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">المواد الدراسية</p>
                    <div className="flex flex-wrap gap-1">
                      {subjects.map((sub: string) => (
                        <Badge key={sub} variant="secondary" className="bg-green-50 text-green-700">{sub}</Badge>
                      ))}
                    </div>
                  </div>
                </li>

                <li className="flex items-start gap-3 pt-4 border-t border-gray-100">
                  <Users className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">طريقة التدريس</p>
                    <p className="font-medium text-gray-900">{teachingTypeLabels[teacher.teaching_type as keyof typeof teachingTypeLabels]}</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">سنوات الخبرة</p>
                    <p className="font-medium text-gray-900">{teacher.experience_years} سنوات</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <Banknote className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">سعر الحصة التقريبي</p>
                    <p className="font-medium text-gray-900">{teacher.price_per_session ? `${teacher.price_per_session} ج.م` : 'غير محدد'}</p>
                  </div>
                </li>
              </ul>
            </div>
            
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
              آراء وتقييمات الطلاب
            </h3>

            <div className="flex flex-col lg:flex-row gap-12">
              {/* Left Side: Rating Chart */}
              <div className="lg:w-1/3">
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl font-black text-gray-900">{Number(teacher.average_rating || 0).toFixed(1)}</div>
                  <div>
                    <RatingStars rating={teacher.average_rating || 0} size="md" />
                    <div className="text-sm text-gray-500 mt-1">بناءً على {teacher.reviews_count || 0} تقييم</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = ratingCounts[star] || 0;
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <div className="w-8 font-medium text-gray-700 flex items-center gap-1">
                          {star} <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        </div>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="w-10 text-right text-gray-500 text-xs">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Reviews List */}
              <div className="lg:w-2/3">
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-gray-900">{review.student?.display_name || 'طالب'}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(review.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          <RatingStars rating={review.rating} size="sm" />
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed mt-3">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">لا توجد تقييمات بعد</p>
                    <p className="text-gray-400 text-sm mt-1">كن أول من يشارك رأيه عن هذا المعلم.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
