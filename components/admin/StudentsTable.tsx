"use client"

import { useState } from 'react'
import { Student } from '@/types'
import { Trash2, Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils/helpers'

interface StudentsTableProps {
  initialStudents: Student[]
}

export function StudentsTable({ initialStudents }: StudentsTableProps) {
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleDelete = async (id: string, userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب بالكامل؟')) return

    try {
      // Delete from Supabase auth first using the secure admin route
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        throw new Error('فشل في حذف المستخدم من المصادقة')
      }

      setStudents(students.filter(s => s.id !== id))
      toast.success('تم حذف الطالب بنجاح')
      router.refresh()
    } catch (error) {
      console.error('Error deleting student:', error)
      toast.error('حدث خطأ أثناء حذف الطالب')
    }
  }

  const filteredStudents = students.filter(s => {
    return s.display_name.includes(searchTerm) || (s.phone && s.phone.includes(searchTerm))
  })

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50 rounded-t-lg">
        <input 
          type="text" 
          placeholder="بحث باسم الطالب أو التليفون..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-64 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">الطالب</th>
              <th className="px-6 py-3">المرحلة والصف</th>
              <th className="px-6 py-3">التواصل</th>
              <th className="px-6 py-3">تاريخ الانضمام</th>
              <th className="px-6 py-3 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => (
                <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div>{student.display_name}</div>
                    <div className="text-xs text-gray-500">{student.city || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{student.stage?.name || '-'}</div>
                    <div className="text-xs text-gray-500">{student.grade || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-left" dir="ltr">
                    <div>{student.phone || '-'}</div>
                    <div className="text-xs text-gray-400">ولي الأمر: {student.parent_phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500" dir="ltr">
                    {formatDate(student.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleDelete(student.id, student.user_id)} className="text-red-600 hover:text-red-800" title="حذف بالكامل">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  لا يوجد طلاب مطابقين للبحث...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
