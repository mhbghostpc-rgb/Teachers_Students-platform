"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { studentRegisterSchema } from '@/lib/utils/validators'
import { UserPlus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

type StudentFormData = z.infer<typeof studentRegisterSchema>

interface Props {
  onSubmit: (data: StudentFormData) => Promise<void>
  isLoading?: boolean
}

export function StudentRegistrationForm({ onSubmit, isLoading }: Props) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<StudentFormData>({
    resolver: zodResolver(studentRegisterSchema),
  })

  const [stages, setStages] = useState<{id: string, name: string}[]>([])

  useEffect(() => {
    async function fetchStages() {
      const supabase = createClient()
      const { data } = await supabase.from('educational_stages').select('id, name').eq('is_active', true)
      if (data) setStages(data)
    }
    fetchStages()
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">الاسم الكامل</label>
        <Input {...register('display_name')} placeholder="أدخل اسمك الكامل" />
        {errors.display_name && <p className="text-sm text-red-500">{errors.display_name.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">البريد الإلكتروني</label>
        <Input {...register('email')} type="email" placeholder="example@email.com" dir="ltr" className="text-right" />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">كلمة المرور</label>
        <Input {...register('password')} type="password" placeholder="******" dir="ltr" className="text-right" />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">رقم الجوال (اختياري)</label>
        <Input {...register('phone')} type="tel" placeholder="05xxxxxxxx" dir="ltr" className="text-right" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">المرحلة الدراسية (اختياري)</label>
        <Select onValueChange={(val) => setValue('stage', val)}>
          <SelectTrigger>
            <SelectValue placeholder="اختر مرحلتك الدراسية" />
          </SelectTrigger>
          <SelectContent>
            {stages.map(stage => (
              <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" variant="gradient" className="w-full mt-6" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            جاري التسجيل...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            تسجيل كطالب
          </>
        )}
      </Button>
    </form>
  )
}
