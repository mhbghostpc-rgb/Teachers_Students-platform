"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { SearchFilters } from '@/components/shared/SearchFilters'
import { TeacherCard } from '@/components/shared/TeacherCard'
import { Teacher, SearchFilters as FilterTypes } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Loader2, SearchX } from 'lucide-react'

export default function SearchPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterTypes>({})
  const supabase = createClient()

  const [hasSearched, setHasSearched] = useState(false)

  const fetchTeachers = async (currentFilters: FilterTypes) => {
    if (Object.keys(currentFilters).length === 0) {
      setTeachers([])
      setLoading(false)
      return
    }
    setHasSearched(true)
    setLoading(true)
    try {
      let query = supabase
        .from('teachers')
        .select(`
          *,
          teacher_stages!inner (
            stage:educational_stages!inner (name)
          ),
          teacher_subjects!inner (
            subject:subjects!inner (name)
          )
        `)
        .eq('status', 'approved')

      if (currentFilters.system_type) {
        query = query.contains('system_types', [currentFilters.system_type])
      }
      if (currentFilters.stage) {
        query = query.eq('teacher_stages.stage.name', currentFilters.stage)
      }
      if (currentFilters.subject) {
        query = query.eq('teacher_subjects.subject.name', currentFilters.subject)
      }
      if (currentFilters.city) {
        query = query.eq('city', currentFilters.city)
      }
      if (currentFilters.teaching_type) {
        if (currentFilters.teaching_type === 'online') {
          query = query.in('teaching_type', ['online', 'both'])
        } else if (currentFilters.teaching_type === 'offline') {
          query = query.in('teaching_type', ['offline', 'both'])
        } else {
          query = query.eq('teaching_type', currentFilters.teaching_type)
        }
      }

      // Order by sponsored first, then priority score, then featured, then rating, then reviews count
      query = query
        .order('is_sponsored', { ascending: false })
        .order('priority_score', { ascending: false })
        .order('is_featured', { ascending: false })
        .order('average_rating', { ascending: false })
        .order('reviews_count', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setTeachers(data as Teacher[])
    } catch (error) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers(filters)
  }, [filters])

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ابحث عن معلمك المثالي
        </h1>
        <p className="text-gray-600">
          تصفح قائمة المعلمين الموثوقين واختر الأنسب لاحتياجاتك
        </p>
      </motion.div>

      <SearchFilters onFilterChange={setFilters} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
          <p className="text-gray-500 font-medium">جاري البحث عن المعلمين...</p>
        </div>
      ) : teachers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teachers.map((teacher, index) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <TeacherCard teacher={teacher} />
            </motion.div>
          ))}
        </div>
      ) : !hasSearched ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-100 shadow-sm"
        >
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-4">
            <SearchX className="h-10 w-10 text-primary-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">ابدأ البحث الآن</h3>
          <p className="text-gray-500 max-w-sm">
            قم بتحديد المحافظة أو المادة أو المرحلة الدراسية ثم اضغط على زر &quot;بحث&quot; للعثور على المعلمين.
          </p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-100 shadow-sm"
        >
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <SearchX className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا يوجد نتائج</h3>
          <p className="text-gray-500 max-w-sm">
            لم نتمكن من العثور على معلمين يطابقون معايير البحث الحالية. جرب تغيير الفلاتر للحصول على نتائج أكثر.
          </p>
        </motion.div>
      )}
    </div>
  )
}
