"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Teacher } from '@/types'
import { 
  Loader2, 
  Search, 
  TrendingUp,
  Award,
  Star,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function RankingPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'sponsored', 'featured'
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  const supabase = createClient()
  const fetchTeachers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('teachers')
        .select(`
          id,
          display_name,
          profile_image,
          priority_score,
          is_sponsored,
          is_featured,
          status,
          average_rating
        `)
        .eq('status', 'approved')
        .order('is_sponsored', { ascending: false })
        .order('priority_score', { ascending: false })
        .order('is_featured', { ascending: false })

      if (searchQuery) {
        query = query.ilike('display_name', `%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error
      
      let filteredData = data as any[]
      if (filterType === 'sponsored') {
        filteredData = filteredData.filter(t => t.is_sponsored)
      } else if (filterType === 'featured') {
        filteredData = filteredData.filter(t => t.is_featured)
      }

      setTeachers(filteredData)
    } catch (error) {
      console.error('Error fetching teachers:', error)
      toast.error('حدث خطأ أثناء جلب بيانات المعلمين')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [searchQuery, filterType])

  const updateTeacherPriority = async (teacherId: string, updates: Partial<Teacher>) => {
    setUpdatingId(teacherId)
    try {
      const { error } = await supabase
        .from('teachers')
        .update(updates)
        .eq('id', teacherId)

      if (error) throw error

      setTeachers(teachers.map(t => t.id === teacherId ? { ...t, ...updates } : t))
      
      toast.success('تم تحديث أولوية المعلم بنجاح')
    } catch (error) {
      console.error('Error updating priority:', error)
      toast.error('حدث خطأ أثناء التحديث')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-600" />
            الترتيب والأولوية
          </h1>
          <p className="text-sm text-gray-500">
            إدارة ترتيب المعلمين في صفحة البحث وتفعيل العضويات المميزة والممولة
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input 
              placeholder="ابحث باسم المعلم..." 
              className="pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="تصفية حسب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المعلمين</SelectItem>
              <SelectItem value="sponsored">الممولين فقط</SelectItem>
              <SelectItem value="featured">المميزين فقط</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-100">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">المعلم</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">درجة الأولوية (Priority Score)</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">حساب ممول (Sponsored)</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">معلم مميز (Featured)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-500">
                    لا يوجد معلمين مطابقين للبحث
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className={`hover:bg-gray-50 transition-colors ${teacher.is_sponsored ? 'bg-primary-50/30' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                          {teacher.profile_image ? (
                            <Image src={teacher.profile_image} alt={teacher.display_name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                              {teacher.display_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{teacher.display_name}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            {teacher.average_rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Input 
                          type="number" 
                          min="0"
                          max="1000"
                          className="w-20 text-center text-lg font-bold"
                          defaultValue={teacher.priority_score}
                          disabled={updatingId === teacher.id}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value)
                            if (val !== teacher.priority_score && !isNaN(val)) {
                              updateTeacherPriority(teacher.id, { priority_score: val })
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch 
                          checked={teacher.is_sponsored}
                          disabled={updatingId === teacher.id}
                          onCheckedChange={(checked) => updateTeacherPriority(teacher.id, { is_sponsored: checked })}
                          className="data-[state=checked]:bg-primary-600"
                        />
                        {teacher.is_sponsored && <Award className="w-5 h-5 text-primary-600" />}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch 
                          checked={teacher.is_featured}
                          disabled={updatingId === teacher.id}
                          onCheckedChange={(checked) => updateTeacherPriority(teacher.id, { is_featured: checked })}
                          className="data-[state=checked]:bg-yellow-500"
                        />
                        {teacher.is_featured && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
