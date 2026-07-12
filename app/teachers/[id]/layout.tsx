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
    .select('*')
    .eq('id', id)
    .single()

  if (!teacher) {
    return {
      title: 'معلم غير موجود | دليل المدرسين'
    }
  }

  // Define keywords combining general SEO + Teacher specifics
  const keywords = [
    teacher.display_name,
    `مدرس ${teacher.subject}`,
    `احسن مدرس ${teacher.subject}`,
    `اشهر مدرس ${teacher.subject} اسوان`,
    `مدرس ${teacher.subject} ${teacher.stage}`,
    teacher.city,
    'مدرسين', 'مدرسين اسوان', 'معلم', 'دليل المعلمين'
  ].join(', ')

  return {
    title: `${teacher.display_name} | أحسن وأشهر مدرس ${teacher.subject} في أسوان`,
    description: `احجز مع الأستاذ ${teacher.display_name}، أشهر مدرس ${teacher.subject} للمرحلة ${teacher.stage} في ${teacher.city} (${teacher.area}). تعرف على التقييمات وتواصل مباشرة.`,
    keywords: keywords,
    openGraph: {
      title: `${teacher.display_name} - مدرس ${teacher.subject}`,
      description: `تعرف على تقييمات ${teacher.display_name}، مدرس ${teacher.subject} بأسوان`,
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
