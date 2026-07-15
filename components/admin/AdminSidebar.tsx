"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Star, 
  BookOpen, 
  Layers, 
  Calendar, 
  Megaphone, 
  TrendingUp, 
  Ticket, 
  ShieldAlert, 
  Bell, 
  FileText, 
  ShieldCheck, 
  Settings, 
  Activity,
  LogOut,
  UserCheck,
  Inbox,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const sidebarItems = [
  { name: 'الرئيسية', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'صندوق الوارد', href: '/admin/inbox', icon: Inbox },
  { name: 'طلبات الربط', href: '/admin/claims', icon: UserCheck },
  { name: 'المعلمين', href: '/admin/teachers', icon: Users },
  { name: 'الطلاب', href: '/admin/students', icon: GraduationCap },
  { name: 'التقييمات', href: '/admin/reviews', icon: Star },
  { name: 'المواد الدراسية', href: '/admin/subjects', icon: BookOpen },
  { name: 'المراحل التعليمية', href: '/admin/stages', icon: Layers },
  { name: 'الحجوزات والطلبات', href: '/admin/bookings', icon: Calendar },
  { name: 'الإعلانات والتمويل', href: '/admin/ads', icon: Megaphone },
  { name: 'الترتيب والأولوية', href: '/admin/ranking', icon: TrendingUp },
  { name: 'أكواد الخصم', href: '/admin/codes', icon: Ticket },
  { name: 'القيود والحظر', href: '/admin/restrictions', icon: ShieldAlert },
  { name: 'الإشعارات', href: '/admin/notifications', icon: Bell },
  { name: 'التقارير', href: '/admin/reports', icon: FileText },
  { name: 'الصلاحيات والمديرين', href: '/admin/permissions', icon: ShieldCheck },
  { name: 'إعدادات المنصة', href: '/admin/settings', icon: Settings },
  { name: 'سجل النشاطات', href: '/admin/activity', icon: Activity },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const checkUnread = async () => {
      try {
        const res = await fetch('/api/support/unread')
        const data = await res.json()
        setHasUnreadSupport(!!data.unread)
      } catch (err) {
        // ignore
      }
    }
    
    checkUnread()
    const interval = setInterval(checkUnread, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <button 
        className="md:hidden fixed top-4 right-4 z-40 p-2 bg-white rounded-lg shadow-md border border-gray-100 text-gray-700"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={cn(
        "w-72 bg-white min-h-screen border-l border-gray-100 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.02)]",
        "fixed md:relative z-50 transition-transform duration-300 right-0",
        isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
      )}>
        <button 
          className="md:hidden absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-800"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex items-center justify-center h-28 shrink-0">
          <h1 className="text-3xl font-light tracking-tight text-gray-800">
            إدارة <span className="font-bold elegant-text">المنصة</span>
          </h1>
        </div>

      <div className="flex-1 overflow-y-auto px-6 py-2 scrollbar-hide">
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'relative flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group',
                  !isActive && 'hover:bg-gray-50'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-luxury-item"
                    className="absolute inset-0 bg-[#F8F9FA] rounded-2xl border border-gray-100"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center w-full">
                  <item.icon
                    className={cn(
                      'shrink-0 h-5 w-5 ml-4 transition-all duration-300',
                      isActive ? 'text-[#1A1D20]' : 'text-gray-400 group-hover:text-gray-600'
                    )}
                  />
                  <span className={cn(
                    "font-medium transition-colors flex-1 flex justify-between items-center",
                    isActive ? "text-[#1A1D20]" : "text-gray-500 group-hover:text-gray-700"
                  )}>
                    <span>{item.name}</span>
                    {item.href === '/admin/inbox' && hasUnreadSupport && (
                      <span className="relative flex h-2.5 w-2.5 ml-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                  </span>
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-6 shrink-0 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-4 rounded-2xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all duration-300 group"
        >
          <LogOut className="shrink-0 h-5 w-5 ml-4 transition-transform group-hover:scale-110" />
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </div>
    </>
  )
}
