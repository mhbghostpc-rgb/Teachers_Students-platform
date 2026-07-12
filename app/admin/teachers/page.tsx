import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TeachersTable } from '@/components/admin/TeachersTable'
import { BulkImportTeachers } from '@/components/admin/BulkImportTeachers'
import { Teacher } from '@/types'

export const metadata = {
  title: 'إدارة المعلمين | لوحة التحكم',
}

export default async function TeachersPage() {
  const supabase = createClient()

  // Fetch teachers with their stages and subjects
  const { data: teachers, error } = await supabase
    .from('teachers')
    .select(`
      *,
      teacher_stages (
        stage:educational_stages (id, name)
      ),
      teacher_subjects (
        subject:subjects (id, name)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching teachers:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900 mb-2">إدارة المعلمين</h1>
          <p className="text-gray-500 font-medium">عرض وإدارة حسابات وبيانات المعلمين</p>
        </div>
        <div className="flex gap-4">
          <BulkImportTeachers />
          <Link 
            href="/admin/teachers/add" 
            className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 font-semibold"
          >
            <Plus className="w-5 h-5" />
            إضافة معلم يدويًا
          </Link>
        </div>
      </div>

      <TeachersTable initialTeachers={(teachers as unknown as Teacher[]) || []} />
    </div>
  )
}
