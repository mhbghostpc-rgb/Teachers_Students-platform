"use client"

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Teacher } from '@/types'
import { Edit, Ban, CheckCircle, XCircle, MoreVertical, ShieldAlert, Star, Trash2, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { SYSTEM_TYPES, SUBJECTS_BY_SYSTEM_AND_STAGE } from '@/lib/utils/constants'

interface TeachersTableProps {
  initialTeachers: Teacher[]
}

export function TeachersTable({ initialTeachers }: TeachersTableProps) {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [languageSystem, setLanguageSystem] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  
  const supabase = createClient()
  const router = useRouter()

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('teachers')
        .update({ status: newStatus })
        .eq('id', id)
        
      if (error) throw error
      
      setTeachers(teachers.map(t => t.id === id ? { ...t, status: newStatus as any } : t))
      toast.success(`تم تغيير الحالة إلى ${newStatus}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('حدث خطأ أثناء تغيير الحالة')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المعلم نهائياً؟ سيتم حذف جميع بياناته وتقييماته ولا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id)
        
      if (error) throw error
      
      setTeachers(teachers.filter(t => t.id !== id))
      toast.success('تم حذف المعلم نهائياً بنجاح')
      router.refresh()
    } catch (error) {
      console.error('Error deleting teacher:', error)
      toast.error('حدث خطأ أثناء حذف المعلم')
    }
  }

  const systemCategories = useMemo(() => {
    const categories: Record<string, Set<string>> = {}
    SYSTEM_TYPES.forEach(sys => {
      categories[sys] = new Set<string>()
      Object.values(SUBJECTS_BY_SYSTEM_AND_STAGE[sys] || {}).forEach(arr => {
        arr.forEach(subj => categories[sys].add(subj))
      })
    })
    return categories
  }, [])

  const unclassifiedSubjects = useMemo(() => {
    const unclassified = new Set<string>()
    teachers.forEach(t => {
      const s = t.teacher_subjects?.[0]?.subject?.name
      if (s) {
        let found = false
        SYSTEM_TYPES.forEach(sys => {
          if (systemCategories[sys]?.has(s)) found = true
        })
        if (!found) unclassified.add(s)
      }
    })
    return Array.from(unclassified).sort()
  }, [teachers, systemCategories])

  useEffect(() => {
    setSelectedSubject('all')
  }, [languageSystem])

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.display_name.includes(searchTerm) || (t.phone && t.phone.includes(searchTerm))
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus
    
    const subjectName = t.teacher_subjects?.[0]?.subject?.name || 'مواد أخرى'
    
    let matchesSystem = true
    if (languageSystem !== 'all') {
      if (subjectName === 'مواد أخرى') {
        matchesSystem = false
      } else {
        matchesSystem = systemCategories[languageSystem]?.has(subjectName) || false
      }
    }

    let matchesSubject = true
    if (selectedSubject !== 'all') {
      matchesSubject = subjectName === selectedSubject
    }

    return matchesSearch && matchesStatus && matchesSystem && matchesSubject
  })

  const groupedTeachers = useMemo(() => {
    const groups: Record<string, Teacher[]> = {}
    filteredTeachers.forEach(t => {
      const subjectName = t.teacher_subjects?.[0]?.subject?.name || 'مواد أخرى'
      if (!groups[subjectName]) groups[subjectName] = []
      groups[subjectName].push(t)
    })
    return groups
  }, [filteredTeachers])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50 rounded-t-lg border-b border-gray-200">
          <div className="flex-1 w-full sm:max-w-xs">
            <input 
              type="text" 
              placeholder="بحث باسم المعلم أو التليفون..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <select
              value={languageSystem}
              onChange={(e) => setLanguageSystem(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">كل الأنظمة التعليمية</option>
              {SYSTEM_TYPES.map(sys => (
                <option key={sys} value={sys}>نظام {sys}</option>
              ))}
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">كل المواد</option>
              {SYSTEM_TYPES.map(sys => {
                 if (languageSystem === 'all' || languageSystem === sys) {
                    const sysSubjects = Array.from(systemCategories[sys] || []).sort()
                    if (sysSubjects.length > 0) {
                      return (
                         <optgroup key={sys} label={`مواد ${sys}`}>
                           {sysSubjects.map(s => (
                              <option key={`${sys}-${s}`} value={s}>{s}</option>
                           ))}
                         </optgroup>
                      )
                    }
                 }
                 return null
              })}
              
              {languageSystem === 'all' && unclassifiedSubjects.length > 0 && (
                 <optgroup label="مواد غير مصنفة">
                   {unclassifiedSubjects.map(s => (
                     <option key={s} value={s}>{s}</option>
                   ))}
                 </optgroup>
              )}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">كل الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
              <option value="suspended">موقوف</option>
              <option value="banned">محظور</option>
            </select>
          </div>
        </div>
      </div>

      {Object.keys(groupedTeachers).length > 0 ? (
        Object.entries(groupedTeachers).map(([subject, groupTeachers]) => (
          <div key={subject} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {subject === 'مواد أخرى' ? 'مواد أخرى غير مصنفة' : `معلمي ${subject}`}
              </h3>
              <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-semibold">
                {groupTeachers.length} معلم
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">المعلم</th>
                    <th className="px-6 py-3">التواصل</th>
                    <th className="px-6 py-3">التقييم</th>
                    <th className="px-6 py-3">الحالة</th>
                    <th className="px-6 py-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {groupTeachers.map(teacher => (
                    <tr key={teacher.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                            {teacher.profile_image ? (
                              <img src={teacher.profile_image} alt={teacher.display_name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold text-lg">
                                {teacher.display_name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div>{teacher.display_name}</div>
                            <div className="text-xs text-gray-500">
                              {teacher.city} - {teacher.teaching_type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left" dir="ltr">
                        <div>{teacher.phone || '-'}</div>
                        <div className="text-xs text-gray-400">WA: {teacher.whatsapp || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span>{teacher.average_rating}</span>
                          <span className="text-xs text-gray-400 mr-1">({teacher.reviews_count})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          teacher.status === 'approved' ? 'bg-green-100 text-green-800' :
                          teacher.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          teacher.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {teacher.status === 'approved' && 'معتمد'}
                          {teacher.status === 'pending' && 'قيد المراجعة'}
                          {teacher.status === 'rejected' && 'مرفوض'}
                          {teacher.status === 'suspended' && 'موقوف'}
                          {teacher.status === 'banned' && 'محظور'}
                          {teacher.status === 'hidden' && 'مخفي'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {teacher.status === 'pending' && (
                            <>
                              <button onClick={() => handleStatusChange(teacher.id, 'approved')} className="text-green-600 hover:text-green-800" title="اعتماد">
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleStatusChange(teacher.id, 'rejected')} className="text-red-600 hover:text-red-800" title="رفض">
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          
                          {teacher.status === 'approved' && (
                            <button onClick={() => handleStatusChange(teacher.id, 'suspended')} className="text-orange-500 hover:text-orange-700" title="إيقاف مؤقت">
                              <ShieldAlert className="w-5 h-5" />
                            </button>
                          )}

                          {(teacher.status === 'banned' || teacher.status === 'suspended' || teacher.status === 'rejected') && (
                            <button onClick={() => handleStatusChange(teacher.id, 'approved')} className="text-green-600 hover:text-green-800" title="تفعيل / فك الحظر">
                              <RotateCcw className="w-5 h-5" />
                            </button>
                          )}

                          <Link href={`/admin/teachers/${teacher.id}/edit`} className="text-blue-600 hover:text-blue-800" title="تعديل">
                            <Edit className="w-5 h-5" />
                          </Link>

                          {teacher.status !== 'banned' && (
                            <button onClick={() => handleStatusChange(teacher.id, 'banned')} className="text-orange-700 hover:text-orange-900" title="حظر">
                              <Ban className="w-5 h-5" />
                            </button>
                          )}

                          <button onClick={() => handleDelete(teacher.id)} className="text-red-600 hover:text-red-800" title="حذف نهائي">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow border border-gray-200">
          لا يوجد معلمين مطابقين للبحث والفلترة...
        </div>
      )}
    </div>
  )
}
