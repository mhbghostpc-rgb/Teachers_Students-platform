"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { teacherRegisterSchema } from '@/lib/utils/validators'
import { CITIES, TEACHING_TYPES, SYSTEM_TYPES, STAGES_BY_SYSTEM, SUBJECTS_BY_SYSTEM_AND_STAGE } from '@/lib/utils/constants'
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

type TeacherFormData = z.infer<typeof teacherRegisterSchema>

interface Props {
  onSubmit: (data: TeacherFormData) => Promise<void>
  isLoading?: boolean
}

export function TeacherRegistrationForm({ onSubmit, isLoading }: Props) {
  const [step, setStep] = useState(1)
  const totalSteps = 3

  const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherRegisterSchema),
    mode: 'onTouched',
    defaultValues: {
      selectedSystems: [],
      selectedStages: [],
      selectedSubjects: []
    }
  })

  const [stages, setStages] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const [stagesRes, subjectsRes] = await Promise.all([
        supabase.from('educational_stages').select('*').eq('is_active', true),
        supabase.from('subjects').select('*').eq('is_active', true)
      ])
      if (stagesRes.data) setStages(stagesRes.data)
      if (subjectsRes.data) setSubjects(subjectsRes.data)
    }
    loadData()
  }, [])

  const selectedSystems = watch('selectedSystems') || []
  const selectedStages = watch('selectedStages') || []
  const selectedSubjects = watch('selectedSubjects') || []

  const nextStep = async () => {
    let fieldsToValidate: any[] = []
    if (step === 1) fieldsToValidate = ['display_name', 'email', 'password', 'phone', 'whatsapp']
    if (step === 2) fieldsToValidate = ['selectedSystems', 'selectedStages', 'selectedSubjects', 'teaching_type']
    
    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`text-sm font-medium ${step >= i ? 'text-primary-600' : 'text-gray-400'}`}>
              {i === 1 ? 'البيانات الشخصية' : i === 2 ? 'التخصص' : 'الموقع'}
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary-600"
            initial={{ width: '33%' }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">الاسم الكامل (كما سيظهر للطلاب)</label>
                <Input {...register('display_name')} placeholder="أ. أحمد محمد" />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">رقم الجوال للمكالمات</label>
                  <Input {...register('phone')} type="tel" placeholder="05xxxxxxxx" dir="ltr" className="text-right" />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">رقم الواتساب</label>
                  <Input {...register('whatsapp')} type="tel" placeholder="05xxxxxxxx" dir="ltr" className="text-right" />
                  {errors.whatsapp && <p className="text-sm text-red-500">{errors.whatsapp.message}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium block mb-2">نوع النظام التعليمي (يمكنك اختيار أكثر من نظام)</label>
                <div className="flex flex-wrap gap-2">
                  {SYSTEM_TYPES.map(system => (
                    <button
                      key={system}
                      type="button"
                      onClick={() => {
                        const newSystems = selectedSystems.includes(system)
                          ? selectedSystems.filter(s => s !== system)
                          : [...selectedSystems, system];
                        setValue('selectedSystems', newSystems, { shouldValidate: true });
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        selectedSystems.includes(system) 
                          ? 'bg-purple-600 text-white border-purple-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      {system}
                    </button>
                  ))}
                </div>
                {errors.selectedSystems && <p className="text-sm text-red-500 mt-1">{errors.selectedSystems.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block mb-2">المراحل التعليمية (يمكنك اختيار أكثر من مرحلة)</label>
                <div className="flex flex-wrap gap-2">
                  {stages
                    .filter(stage => 
                      selectedSystems.length === 0 || 
                      selectedSystems.some(system => STAGES_BY_SYSTEM[system]?.includes(stage.name))
                    )
                    .map(stage => (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => {
                        const newStages = selectedStages.includes(stage.id)
                          ? selectedStages.filter(s => s !== stage.id)
                          : [...selectedStages, stage.id];
                        setValue('selectedStages', newStages, { shouldValidate: true });
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        selectedStages.includes(stage.id) 
                          ? 'bg-primary-600 text-white border-primary-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                      }`}
                    >
                      {stage.name}
                    </button>
                  ))}
                </div>
                {errors.selectedStages && <p className="text-sm text-red-500 mt-1">{errors.selectedStages.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block mb-2">المواد الدراسية (يمكنك اختيار أكثر من مادة)</label>
                <div className="flex flex-wrap gap-2">
                  {subjects
                    .filter(subject => {
                      if (selectedSystems.length === 0 || selectedStages.length === 0) return true;
                      
                      const selectedStageNames = stages
                        .filter(s => selectedStages.includes(s.id))
                        .map(s => s.name);

                      return selectedSystems.some(system => 
                        selectedStageNames.some(stageName => 
                          SUBJECTS_BY_SYSTEM_AND_STAGE[system]?.[stageName]?.includes(subject.name)
                        )
                      );
                    })
                    .map(subject => (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => {
                        const newSubjects = selectedSubjects.includes(subject.id)
                          ? selectedSubjects.filter(s => s !== subject.id)
                          : [...selectedSubjects, subject.id];
                        setValue('selectedSubjects', newSubjects, { shouldValidate: true });
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        selectedSubjects.includes(subject.id) 
                          ? 'bg-secondary-600 text-white border-secondary-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-secondary-400'
                      }`}
                    >
                      {subject.name}
                    </button>
                  ))}
                </div>
                {errors.selectedSubjects && <p className="text-sm text-red-500 mt-1">{errors.selectedSubjects.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">طريقة التدريس المتاحة</label>
                <Select onValueChange={(val: any) => setValue('teaching_type', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="كيف تقدم دروسك؟" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEACHING_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.teaching_type && <p className="text-sm text-red-500">{errors.teaching_type.message}</p>}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">المدينة</label>
                  <Select onValueChange={(val) => setValue('city', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مدينتك" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">الحي / المنطقة</label>
                  <Input {...register('area')} placeholder="مثال: حي الياسمين" />
                  {errors.area && <p className="text-sm text-red-500">{errors.area.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">نبذة عنك (اختياري)</label>
                <Textarea 
                  {...register('about')} 
                  placeholder="اكتب نبذة مختصرة عن خبرتك وطريقتك في التدريس لجذب الطلاب..."
                  className="h-32 resize-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4 pt-4 border-t">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              <ArrowRight className="h-4 w-4 ml-2" />
              السابق
            </Button>
          )}
          
          {step < totalSteps ? (
            <Button type="button" className="mr-auto" onClick={nextStep}>
              التالي
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>
          ) : (
            <Button type="submit" variant="gradient" className="mr-auto" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التسجيل...
                </>
              ) : (
                <>
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                  إكمال التسجيل
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
