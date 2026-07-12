import * as z from 'zod'

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
})

export const studentRegisterSchema = z.object({
  display_name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  phone: z.string().optional(),
  stage: z.string().optional(),
})

export const teacherRegisterSchema = z.object({
  display_name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  phone: z.string().min(9, 'رقم الجوال غير صالح'),
  whatsapp: z.string().min(9, 'رقم الواتساب غير صالح'),
  selectedSystems: z.array(z.string()).min(1, 'يرجى اختيار نظام تعليمي واحد على الأقل'),
  selectedStages: z.array(z.string()).min(1, 'يرجى اختيار مرحلة واحدة على الأقل'),
  selectedSubjects: z.array(z.string()).min(1, 'يرجى اختيار مادة واحدة على الأقل'),
  city: z.string().min(1, 'يرجى اختيار المدينة'),
  area: z.string().min(1, 'يرجى تحديد المنطقة أو الحي'),
  teaching_type: z.enum(['online', 'offline', 'both']),
  about: z.string().optional(),
})

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
})
