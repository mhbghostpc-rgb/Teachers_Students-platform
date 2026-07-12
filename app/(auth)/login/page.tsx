"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginSchema } from '@/lib/utils/validators'
import { GraduationCap, LogIn, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        return
      }

      toast.success('تم تسجيل الدخول بنجاح')
      
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        const { data: profile } = await supabase.from('users').select('role_name').eq('id', userData.user.id).single()
        if (profile?.role_name === 'admin') {
          router.push('/admin/dashboard')
        } else if (profile?.role_name === 'teacher') {
          router.push('/teacher/dashboard')
        } else {
          router.push('/')
        }
      } else {
        router.push('/')
      }
      
      router.refresh()
    } catch (err) {
      toast.error('حدث خطأ أثناء تسجيل الدخول')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary-50 rounded-xl">
              <GraduationCap className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <h2 className="text-center text-2xl font-bold text-gray-900">
            تسجيل الدخول لحسابك
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
            <Input 
              {...register('email')} 
              type="email" 
              placeholder="example@email.com" 
              dir="ltr" 
              className="text-right" 
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">كلمة المرور</label>
              <Link href="#" className="text-sm text-primary-600 hover:text-primary-500">
                نسيت كلمة المرور؟
              </Link>
            </div>
            <Input 
              {...register('password')} 
              type="password" 
              placeholder="******" 
              dir="ltr" 
              className="text-right" 
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <Button type="submit" variant="gradient" className="w-full h-11 text-base gap-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                جاري التحقق...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                تسجيل الدخول
              </>
            )}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">ليس لديك حساب؟</span>
            </div>
          </div>

          <div className="mt-6">
            <Link href="/register">
              <Button variant="outline" className="w-full h-11 text-base text-primary-600 border-primary-200 hover:bg-primary-50">
                إنشاء حساب جديد
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
