"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RatingStars } from './RatingStars'
import { WhatsAppWithDiscount } from './WhatsAppWithDiscount'
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  Users,
  Sparkles
} from 'lucide-react'
import { Teacher } from '@/types'

interface TeacherCardProps {
  teacher: Teacher
}

export function TeacherCard({ teacher }: TeacherCardProps) {
  const router = useRouter()

  const teachingTypeLabels = {
    online: '🖥️ أونلاين',
    offline: '🏫 حضوري',
    both: '🔄 الاثنين',
    center: '🏢 سنتر',
    home_visit: '🏠 زيارة منزلية'
  }

  const teachingTypeColors = {
    online: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    offline: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
    both: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
    center: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
    home_visit: 'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200'
  }

  // Format number for WhatsApp API (remove +, spaces, and add country code 20 if it's an Egyptian number starting with 01)
  const formatWhatsAppNumber = (phone: string) => {
    if (!phone) return ''
    let cleaned = phone.replace(/[\s\-\+]/g, '')
    if (cleaned.startsWith('01') && cleaned.length === 11) {
      cleaned = '2' + cleaned // 201xxxxxxxxx
    }
    return cleaned
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="relative cursor-pointer"
      onDoubleClick={() => router.push(`/student/teacher/${teacher.id}`)}
    >
      {teacher.is_featured && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
            <Sparkles className="h-3 w-3" />
            مميز
          </div>
        </div>
      )}

      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm h-full flex flex-col">
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-t-xl w-full">
            {/* Empty gradient background as requested */}
          </div>
          
          <div className="absolute -bottom-8 right-6">
            <div className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden relative">
              {teacher.profile_image ? (
                <Image
                  src={teacher.profile_image}
                  alt={teacher.display_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600">
                    {teacher.display_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <CardContent className="pt-10 pb-4 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <Link href={`/student/teacher/${teacher.id}`}>
                <h3 className="text-xl font-bold text-gray-800 hover:text-primary-600 transition-colors">
                  {teacher.display_name}
                </h3>
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 flex-wrap line-clamp-2">
                <span>{teacher.teacher_stages ? teacher.teacher_stages.map((ts: any) => ts.stage.name).join('، ') : (teacher as any).stage}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0" />
                <span>{teacher.teacher_subjects ? teacher.teacher_subjects.map((ts: any) => ts.subject.name).join('، ') : (teacher as any).subject}</span>
              </div>
            </div>
            <Badge className={teachingTypeColors[teacher.teaching_type || 'both']}>
              {teachingTypeLabels[teacher.teaching_type || 'both']}
            </Badge>
          </div>

          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              <RatingStars rating={teacher.average_rating} size="sm" />
              <span className="text-sm font-medium text-gray-700">
                {teacher.average_rating.toFixed(1)}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              ({teacher.reviews_count} تقييم)
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-1">
            <MapPin className="h-4 w-4" />
            <span>{teacher.city}، {teacher.area}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-auto">
            <Link href={`tel:${teacher.phone}`} className="flex-1 block">
              <Button variant="gradient" size="sm" className="w-full gap-2">
                <Phone className="h-4 w-4" />
                اتصل
              </Button>
            </Link>
            
            <WhatsAppWithDiscount 
              teacherName={teacher.display_name} 
              phone={teacher.whatsapp || teacher.phone || ''}
              size="sm"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
