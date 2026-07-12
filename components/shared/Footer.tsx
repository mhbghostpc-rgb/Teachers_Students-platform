import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary-900 rounded-lg">
                <GraduationCap className="h-6 w-6 text-primary-400" />
              </div>
              <span className="text-xl font-bold text-white">
                دليل المدرسين
              </span>
            </Link>
            <p className="text-gray-400 max-w-sm">
              المنصة الأولى للبحث عن أفضل المعلمين في منطقتك، مع تقييمات حقيقية وخدمات موثوقة.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-primary-400 transition-colors">الرئيسية</Link>
              </li>
              <li>
                <Link href="/student/search" className="hover:text-primary-400 transition-colors">ابحث عن معلم</Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-primary-400 transition-colors">سجل كمعلم</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">تواصل معنا</h4>
            <ul className="space-y-2 text-sm">
              <li>البريد: support@teachers-dir.com</li>
              <li>الهاتف: +966 50 000 0000</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} دليل المدرسين</p>
        </div>
      </div>
    </footer>
  )
}
