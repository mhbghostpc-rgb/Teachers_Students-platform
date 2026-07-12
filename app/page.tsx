"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  GraduationCap, 
  User, 
  Users, 
  Star, 
  BookOpen,
  ArrowLeft,
  Shield,
  Award,
  Clock
} from 'lucide-react'
import { AdsCarousel } from '@/components/shared/AdsCarousel'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "name": "دليل المدرسين",
            "alternateName": "دليل المعلمين في أسوان",
            "url": "https://teachers-directory-aswan.com",
            "description": "دليلك الشامل للبحث عن أحسن وأشهر المدرسين في أسوان لجميع المراحل (الابتدائي، الاعدادي، الثانوي، واللغات).",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "أسوان",
              "addressRegion": "أسوان",
              "addressCountry": "EG"
            },
            "sameAs": [
              "https://www.facebook.com/AswanTeachersDir"
            ]
          })
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 animate-pulse-slow" />
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block p-3 bg-primary-100 rounded-full mb-6"
            >
              <GraduationCap className="h-12 w-12 text-primary-600" />
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-primary-700 leading-normal pb-2">
              دليل المدرسين في جمهورية مصر
            </h1>
            <h2 className="text-2xl md:text-4xl font-semibold mb-6 text-gray-800 leading-normal">
              ابحث عن أحسن المعلمين
            </h2>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              ابحث عن أشهر مدرس في منطقتك، ابتدائي، اعدادي، ثانوي، لغات وتعرف على النتيجة والتنسيق
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
              {[
                { icon: Users, label: 'معلمين', value: '500+' },
                { icon: BookOpen, label: 'مواد', value: '30+' },
                { icon: Star, label: 'تقييمات', value: '2,500+' },
                { icon: Shield, label: 'موثوق', value: '100%' }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/40"
                >
                  <stat.icon className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/student/search">
                <Button variant="gradient" size="lg" className="text-white px-8 h-14 text-lg">
                  <User className="ml-2 h-5 w-5" />
                  أنا طالب أبحث عن معلم
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Link href="/register">
                <Button variant="outline" size="lg" className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 h-14 text-lg bg-white">
                  <GraduationCap className="ml-2 h-5 w-5" />
                  أنا معلم وأريد التسجيل
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-300/20 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary-300/20 rounded-full blur-3xl animate-float delay-1000 pointer-events-none" />
      </section>

      {/* Ads Carousel */}
      <AdsCarousel />

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            لماذا تختار منصتنا؟
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            نقدم لك تجربة متكاملة للعثور على أفضل المعلمين
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Award,
              title: 'معلمون موثوقون',
              description: 'جميع المعلمين مسجلون وموثوقون من قبل فريقنا لضمان جودة التعليم.'
            },
            {
              icon: Star,
              title: 'تقييمات حقيقية',
              description: 'تقييمات شفافة من طلاب حقيقيين بعد مراجعتها والموافقة عليها.'
            },
            {
              icon: Clock,
              title: 'مرونة في التعلم',
              description: 'اختر بين التعليم أونلاين أو الحضوري حسب رغبتك وفي الوقت المناسب.'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border border-gray-100 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-r from-primary-600 to-secondary-600 py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-white mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">
              كيف تعمل المنصة؟
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              ثلاث خطوات بسيطة لتبدأ رحلة التعلم مع أفضل المعلمين
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '١', title: 'اختر المرحلة والمادة', desc: 'حدد المرحلة الدراسية والمادة التي تبحث عنها والمدينة.' },
              { step: '٢', title: 'تصفح المعلمين', desc: 'شاهد قائمة المعلمين مرتبة حسب التقييم واختر الأنسب لك.' },
              { step: '٣', title: 'تواصل مع المعلم', desc: 'اتصل أو تواصل عبر الواتساب مباشرة وابدأ التعلم.' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center text-white"
              >
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 border-2 border-white/30">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-white/80 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
