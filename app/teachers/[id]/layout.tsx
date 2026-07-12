import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id
  const supabase = createClient()
  
  const { data: teacher } = await supabase
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
    .eq('id', id)
    .single()

  if (!teacher) {
    return {
      title: 'معلم غير موجود | دليل المدرسين'
    }
  }

  const subjects = teacher.teacher_subjects?.map((ts: any) => ts.subject?.name).join(' و ') || 'المواد الدراسية'
  const stages = teacher.teacher_stages?.map((ts: any) => ts.stage?.name).join(' و ') || 'المراحل الدراسية'

  // Define keywords combining general SEO + Teacher specifics
  const keywords = [
    teacher.display_name,
    `مدرس ${subjects}`,
    `احسن مدرس ${subjects}`,
    `اشهر مدرس ${subjects} اسوان`,
    `مدرس ${subjects} ${stages}`,
    teacher.city,
    'مدرسين', 'مدرسين اسوان', 'معلم', 'دليل المعلمين'
  ].join(', ')

  return {
    title: `${teacher.display_name} | أحسن وأشهر مدرس ${subjects} في أسوان`,
    description: `احجز مع الأستاذ ${teacher.display_name}، أشهر مدرس ${subjects} للمرحلة ${stages} في ${teacher.city} (${teacher.area}). تعرف على التقييمات وتواصل مباشرة.`,
    keywords: keywords,
    openGraph: {
      title: `${teacher.display_name} - مدرس ${subjects}`,
      description: `تعرف على تقييمات ${teacher.display_name}، مدرس ${subjects} بأسوان`,
      type: 'profile',
      images: teacher.profile_image ? [teacher.profile_image] : [],
    }
  }
}

export default async function TeacherLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const supabase = createClient()
  
  const { data: teacher } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', params.id)
    .single()

  // Generate JSON-LD Schema
  const jsonLd = teacher ? {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": teacher.display_name,
    "jobTitle": `مدرس ${teacher.subject}`,
    "description": teacher.about || `مدرس ${teacher.subject} للمرحلة ${teacher.stage}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": teacher.city,
      "addressRegion": "أسوان",
      "addressCountry": "EG"
    },
    ...(teacher.average_rating > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": teacher.average_rating.toString(),
        "reviewCount": teacher.reviews_count.toString(),
        "bestRating": "5",
        "worstRating": "1"
      }
    })
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}
