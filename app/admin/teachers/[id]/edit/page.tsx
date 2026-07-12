import { EditTeacherForm } from '@/components/admin/EditTeacherForm'

export const metadata = {
  title: 'تعديل بيانات المعلم | لوحة التحكم',
}

export default function EditTeacherPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تعديل بيانات المعلم</h1>
        <p className="text-gray-500 mt-1">تحديث بيانات المعلم، المواد الدراسية، وحالة الحساب.</p>
      </div>

      <EditTeacherForm teacherId={params.id} />
    </div>
  )
}
