import { AddTeacherForm } from '@/components/admin/AddTeacherForm'

export const metadata = {
  title: 'إضافة معلم جديد | لوحة التحكم',
}

export default function AddTeacherPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إضافة معلم جديد</h1>
        <p className="text-gray-500 mt-1">قم بملء البيانات التالية لإنشاء حساب جديد لمعلم واعتماده في المنصة.</p>
      </div>

      <AddTeacherForm />
    </div>
  )
}
