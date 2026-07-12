"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StudentRegistrationForm } from '@/components/forms/StudentRegistrationForm'
import { TeacherRegistrationForm } from '@/components/forms/TeacherRegistrationForm'
import { GraduationCap, User, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleStudentSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (authError) throw authError

      if (authData.user) {
        const isAdmin = data.email.toLowerCase() === 'mhbghost@gmail.com';
        
        // Create user profile
        const { error: profileError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: data.email,
          role_name: isAdmin ? 'admin' : 'student'
        })

        if (profileError) throw profileError

        // Create student profile
        const { error: studentError } = await supabase.from('students').insert({
          user_id: authData.user.id,
          display_name: data.display_name,
          phone: data.phone || null,
          stage: data.stage || null
        })

        if (studentError) throw studentError

        toast.success('تم التسجيل بنجاح! يرجى تسجيل الدخول')
        router.push('/login')
      }
    } catch (error: any) {
      let msg = error.message || 'حدث خطأ أثناء التسجيل'
      if (msg.includes('already registered')) {
        msg = 'البريد الإلكتروني مسجل مسبقاً، يرجى استخدام بريد إلكتروني مختلف أو تسجيل الدخول.'
      }
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTeacherSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (authError) throw authError

      if (authData.user) {
        const isAdmin = data.email.toLowerCase() === 'mhbghost@gmail.com';

        // Create user profile
        const { error: profileError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: data.email,
          role_name: isAdmin ? 'admin' : 'teacher'
        })

        if (profileError) throw profileError

        // Create teacher profile
        const { data: teacherData, error: teacherError } = await supabase.from('teachers').insert({
          user_id: authData.user.id,
          display_name: data.display_name,
          system_types: data.selectedSystems,
          city: data.city,
          area: data.area,
          teaching_type: data.teaching_type,
          phone: data.phone,
          whatsapp: data.whatsapp,
          about: data.about || null,
          status: 'pending' // requires admin approval
        }).select('id').single()

        if (teacherError) throw teacherError
        
        const teacherId = teacherData.id

        // Insert Stages
        if (data.selectedStages && data.selectedStages.length > 0) {
          const { error: stagesError } = await supabase.from('teacher_stages').insert(
            data.selectedStages.map((id: string) => ({ teacher_id: teacherId, stage_id: id }))
          )
          if (stagesError) throw stagesError
        }

        // Insert Subjects
        if (data.selectedSubjects && data.selectedSubjects.length > 0) {
          const { error: subjectsError } = await supabase.from('teacher_subjects').insert(
            data.selectedSubjects.map((id: string) => ({ teacher_id: teacherId, subject_id: id }))
          )
          if (subjectsError) throw subjectsError
        }

        toast.success('تم التسجيل بنجاح! سيتم مراجعة حسابك من قبل الإدارة قريباً')
        router.push('/login')
      }
    } catch (error: any) {
      let msg = error.message || 'حدث خطأ أثناء التسجيل'
      if (msg.includes('already registered')) {
        msg = 'البريد الإلكتروني مسجل مسبقاً، يرجى استخدام بريد إلكتروني مختلف أو تسجيل الدخول.'
      }
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
      <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary-50 rounded-xl">
              <GraduationCap className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            إنشاء حساب جديد
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            انضم إلى منصة دليل المدرسين وابدأ رحلتك التعليمية
          </p>
        </div>

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
            <TabsTrigger value="student" className="text-base gap-2 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              <User className="h-4 w-4" />
              أنا طالب
            </TabsTrigger>
            <TabsTrigger value="teacher" className="text-base gap-2 data-[state=active]:bg-secondary-50 data-[state=active]:text-secondary-700">
              <BookOpen className="h-4 w-4" />
              أنا معلم
            </TabsTrigger>
          </TabsList>

          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              <TabsContent value="student" className="mt-0 outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <StudentRegistrationForm onSubmit={handleStudentSubmit} isLoading={isLoading} />
                </motion.div>
              </TabsContent>

              <TabsContent value="teacher" className="mt-0 outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TeacherRegistrationForm onSubmit={handleTeacherSubmit} isLoading={isLoading} />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>

        <div className="mt-8 text-center text-sm">
          <span className="text-gray-500">لديك حساب بالفعل؟ </span>
          <a href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            تسجيل الدخول
          </a>
        </div>
      </div>
    </div>
  )
}
