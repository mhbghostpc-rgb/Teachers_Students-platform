import { createClient } from '@/lib/supabase/server'
import { StudentsTable } from '@/components/admin/StudentsTable'
import { Student } from '@/types'

export const metadata = {
  title: 'إدارة الطلاب | لوحة التحكم',
}

export default async function StudentsPage() {
  const supabase = createClient()

  // Fetch students with their stage
  const { data: students, error } = await supabase
    .from('students')
    .select(`
      *,
      stage:educational_stages (id, name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching students:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الطلاب</h1>
      </div>

      <StudentsTable initialStudents={(students as unknown as Student[]) || []} />
    </div>
  )
}
