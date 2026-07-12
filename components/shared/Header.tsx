"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { GraduationCap, Menu, X, User } from 'lucide-react'
import { useState, useRef } from 'react'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/', label: 'الرئيسية' },
    { href: '/student/search', label: 'ابحث عن معلم' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 group">
          <div 
            className="p-2 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors cursor-pointer"
            onDoubleClick={() => router.push('/admin/dashboard')}
            title="لوحة الإدارة"
          >
            <GraduationCap className="h-6 w-6 text-primary-600" />
          </div>
          <Link href="/">
            <span className="text-xl font-bold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              دليل المدرسين
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary-600 relative ${
                pathname === link.href ? 'text-primary-600' : 'text-gray-600'
              }`}
            >
              {link.label}
              {pathname === link.href && (
                <motion.span
                  layoutId="activeNav"
                  className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-primary-600 rounded-full"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-gray-600 hover:text-primary-600">
              تسجيل الدخول
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="gradient" className="gap-2">
              <User className="h-4 w-4" />
              حساب جديد
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b bg-white shadow-lg overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-medium py-2 ${
                    pathname === link.href ? 'text-primary-600' : 'text-gray-600'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-gray-100" />
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  تسجيل الدخول
                </Button>
              </Link>
              <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="gradient" className="w-full gap-2">
                  <User className="h-4 w-4" />
                  حساب جديد
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
