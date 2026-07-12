import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { RatingStars } from '@/components/shared/RatingStars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClaimProfileButton } from '@/components/shared/ClaimProfileButton'
import { ReviewForm } from '@/components/forms/ReviewForm'
import { 
  MapPin, Phone, MessageCircle, Globe, Video, 
  GraduationCap, Clock, Banknote, BookOpen, Layers, Users, Star
} from 'lucide-react'
import { ReviewDialog } from '@/components/shared/ReviewDialog'
import { CopyProfileLink } from '@/components/shared/CopyProfileLink'
import { WhatsAppWithDiscount } from '@/components/shared/WhatsAppWithDiscount'

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

  if (error || !teacher || teacher.status === 'hidden') {
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
    .eq('status', 'approved')
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
    both: 'أونلاين وحضوري',
    center: 'سنتر',
    home_visit: 'زيارة منزلية'
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: teacher.display_name,
    jobTitle: `مدرس ${subjects.join(' و ')}`,
    description: teacher.bio || `مدرس ${subjects.join(' و ')} للمرحلة ${stages.join(' و ')} في أسوان.`,
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://teachers-directory-aswan.com'}/teachers/${teacher.id}`,
    image: teacher.profile_image,
    address: {
      '@type': 'PostalAddress',
      addressLocality: teacher.city,
      addressRegion: 'Aswan',
      addressCountry: 'EG'
    },
    aggregateRating: totalReviews > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: teacher.rating,
      reviewCount: totalReviews
    } : undefined
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Premium Cover Banner */}
      <div className="h-56 md:h-72 bg-gradient-to-r from-primary-800 via-primary-600 to-secondary-600 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        
        {/* Main Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 mb-8 border border-white/40 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            
            {/* Avatar */}
            <div className="w-36 h-36 md:w-48 md:h-48 shrink-0 rounded-full border-8 border-white shadow-xl bg-white overflow-hidden relative group">
              {teacher.profile_image ? (
                <img src={teacher.profile_image} alt={teacher.display_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                  <span className="text-6xl font-black text-primary-300">
                    {teacher.display_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div>
                  <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">{teacher.display_name}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 font-medium">
                    {teacher.city && teacher.area && (
                      <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                        <MapPin className="w-4 h-4 text-primary-500" />
                        {teacher.city}، {teacher.area}
                      </div>
                    )}
                    {teacher.teaching_type && (
                      <div className="flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1 rounded-full">
                        <Users className="w-4 h-4" />
                        {teachingTypeLabels[teacher.teaching_type as keyof typeof teachingTypeLabels] || teacher.teaching_type}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-yellow-50 px-5 py-3 rounded-2xl border border-yellow-100">
                  <div className="text-3xl font-black text-yellow-600">{Number(teacher.average_rating || 0).toFixed(1)}</div>
                  <div className="flex flex-col">
                    <RatingStars rating={teacher.average_rating || 0} size="sm" />
                    <span className="text-xs font-bold text-yellow-700 mt-1">{teacher.reviews_count || 0} تقييم من الطلاب</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mt-8">
                {teacher.phone && (
                  <Link href={`tel:${teacher.phone}`} className="flex-1 sm:flex-none">
                    <Button size="lg" className="w-full gap-2 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/30 text-base h-12 px-8 rounded-xl transition-all hover:-translate-y-1">
                      <Phone className="w-5 h-5" /> اتصل الآن
                    </Button>
                  </Link>
                )}
                {teacher.whatsapp && (
                  <div className="flex-1 sm:flex-none">
                    <WhatsAppWithDiscount 
                      teacherName={teacher.display_name} 
                      phone={teacher.whatsapp}
                    />
                  </div>
                )}
              </div>

              {/* Claim Profile */}
              <div className="mt-6">
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
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 flex items-center justify-center shadow-inner">
                    <BookOpen className="w-5 h-5" />
                  </span>
                  نبذة عن المعلم
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">{teacher.about}</p>
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
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-red-200 text-red-700 flex items-center justify-center shadow-inner">
                    <Video className="w-5 h-5" />
                  </span>
                  فيديو تعريفي
                </h3>
                <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-gray-100 relative group">
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors pointer-events-none z-10"></div>
                  <iframe 
                    src={embedUrl} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full h-full relative z-0"
                  ></iframe>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700 flex items-center justify-center shadow-inner">
                  <Star className="w-5 h-5" />
                </span>
                آراء وتقييمات الطلاب
              </h3>

              {reviews && reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 transition-colors hover:bg-white hover:shadow-md">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg shadow-sm border border-white">
                            {review.student?.display_name?.charAt(0) || 'ط'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">{review.student?.display_name || 'طالب'}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              {new Date(review.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white px-3 py-1 rounded-full shadow-sm">
                          <RatingStars rating={review.rating} size="sm" />
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 text-base leading-relaxed mt-4 bg-white p-4 rounded-xl border border-gray-100">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                  <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                    <Star className="w-10 h-10 text-gray-300" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">لا توجد تقييمات بعد</h4>
                  <p className="text-gray-500 max-w-sm">كن أول من يشارك رأيه عن هذا المعلم لتساعد زملائك الطلاب.</p>
                </div>
              )}
            </div>
          </div>

          {/* Left Column: Details & Stats */}
          <div className="space-y-8">
            
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sticky top-24 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-6">تفاصيل التدريس</h3>
              
              <ul className="space-y-6">
                
                <li className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2 font-medium">المراحل الدراسية</p>
                    <div className="flex flex-wrap gap-2">
                      {stages.length > 0 ? stages.map((stage: string) => (
                        <Badge key={stage} variant="secondary" className="bg-blue-50/50 text-blue-700 border border-blue-100">{stage}</Badge>
                      )) : <span className="text-gray-400 text-sm">غير محدد</span>}
                    </div>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="p-3 bg-green-50 rounded-xl text-green-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2 font-medium">المواد الدراسية</p>
                    <div className="flex flex-wrap gap-2">
                      {subjects.length > 0 ? subjects.map((sub: string) => (
                        <Badge key={sub} variant="secondary" className="bg-green-50/50 text-green-700 border border-green-100">{sub}</Badge>
                      )) : <span className="text-gray-400 text-sm">غير محدد</span>}
                    </div>
                  </div>
                </li>

                <li className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-600">سنوات الخبرة</span>
                  </div>
                  <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{teacher.experience_years ? `+${teacher.experience_years} سنوات` : 'غير محدد'}</span>
                </li>

                <li className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-3">
                    <Banknote className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-600">سعر الحصة التقريبي</span>
                  </div>
                  <span className="font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-lg">
                    {teacher.price_per_session ? `${teacher.price_per_session} ج.م` : 'غير محدد'}
                  </span>
                </li>
              </ul>
              
              <div className="mt-8 pt-8 border-t border-gray-100">
                <ReviewForm teacherId={teacher.id} />
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  )
}
