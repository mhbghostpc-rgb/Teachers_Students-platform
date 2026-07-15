import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { Toaster } from '@/components/ui/toaster'
import PromoBanner from '@/components/PromoBanner'
import './globals.css'

const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' })

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://teachers-directory-aswan.com'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'دليل المدرسين في أسوان | ابحث عن أحسن المعلمين',
    template: '%s | دليل المدرسين'
  },
  description: 'دليلك الشامل للبحث عن أحسن وأشهر المدرسين في أسوان لجميع المراحل (الابتدائي، الاعدادي، الثانوي، واللغات). ابحث الآن وتواصل مع أفضل المعلمين وتعرف على التنسيق والنتيجة.',
  keywords: [
    'مدرسين', 'مدرسين اسوان', 'اشهر مدرس', 'احسن مدرس', 'معلم', 'معلمين', 
    'النتيجه', 'التنسيق', 'دليل المعلمين', 'دليل', 'الابتدائي', 'الاعدادي', 
    'الثانوي', 'اسوان', 'احمد وصفي', 'ياسر', 'ايمن', 'فايز', 'محمد اسماعيل', 
    'فرغلي', 'بيتر', 'محب', 'هاير', 'بسيمه', 'هاير بيتر', 'جاد', 'مكاوي', 
    'لغات', 'صحاري', 'مجمع', 'السلام', 'العروبه', 'السادات', 'المستقبل', 'نوتردام'
  ],
  authors: [{ name: 'دليل المدرسين' }],
  creator: 'دليل المدرسين بأسوان',
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: baseUrl,
    title: 'دليل المدرسين في أسوان | ابحث عن أحسن المعلمين',
    description: 'ابحث عن أفضل المعلمين في منطقتك، قيّمهم واختر الأنسب لك للمرحلة الابتدائية والاعدادية والثانوية',
    siteName: 'دليل المدرسين',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'دليل المدرسين في أسوان | ابحث عن أحسن المعلمين',
    description: 'ابحث عن أفضل المعلمين في منطقتك بأسوان وتعرف على أشهر المدرسين.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE', // Can be replaced later
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-sans min-h-screen flex flex-col bg-gray-50`}>
        <PromoBanner />
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  )
}
