"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SearchFilters as FilterTypes } from '@/types'
import { CITIES, TEACHING_TYPES, SYSTEM_TYPES, STAGES_BY_SYSTEM, SUBJECTS_BY_SYSTEM_AND_STAGE } from '@/lib/utils/constants'
import { Filter, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SearchFiltersProps {
  onFilterChange: (filters: FilterTypes) => void
}

export function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [filters, setFilters] = useState<FilterTypes>({})
  const [stages, setStages] = useState<{id: string, name: string}[]>([])
  const [subjects, setSubjects] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadLookups() {
      const [stagesRes, subjectsRes] = await Promise.all([
        supabase.from('educational_stages').select('id, name').eq('is_active', true),
        supabase.from('subjects').select('id, name').eq('is_active', true).order('name')
      ])

      if (stagesRes.data) {
        const stageOrder: Record<string, number> = {
          'ابتدائي': 1,
          'إعدادي': 2,
          'ثانوي': 3,
          'دولي': 4,
          'لغات': 5
        }
        const sortedStages = stagesRes.data.sort((a, b) => {
          return (stageOrder[a.name] || 99) - (stageOrder[b.name] || 99)
        })
        setStages(sortedStages)
      }
      if (subjectsRes.data) setSubjects(subjectsRes.data)
      setLoading(false)
    }
    loadLookups()
  }, [])

  const handleFilterChange = (key: keyof FilterTypes, value: string) => {
    let newFilters = { ...filters, [key]: value }
    if (key === 'stage' && value !== filters.stage) {
      delete newFilters.subject // reset subject when stage changes
    }
    setFilters(newFilters)
  }

  const handleSearch = () => {
    onFilterChange(filters)
  }

  const handleClearFilters = () => {
    setFilters({})
    onFilterChange({})
  }

  if (loading) {
    return (
      <Card className="mb-8 border-primary-100 h-32 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </Card>
    )
  }

  return (
    <Card className="mb-8 border-primary-100">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4 text-primary-700 font-semibold">
          <Filter className="h-5 w-5" />
          <h2>تصفية النتائج</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">المدينة</label>
            <Select 
              value={filters.city || ''} 
              onValueChange={(val) => handleFilterChange('city', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المدينة" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">نوع النظام</label>
            <Select 
              value={filters.system_type || ''} 
              onValueChange={(val) => {
                // When system changes, reset stage and subject
                setFilters({ ...filters, system_type: val, stage: undefined, subject: undefined })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر النظام" />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_TYPES.map(sys => (
                  <SelectItem key={sys} value={sys}>{sys}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">المرحلة الدراسية</label>
            <Select 
              value={filters.stage || ''} 
              onValueChange={(val) => {
                // When stage changes, reset subject
                setFilters({ ...filters, stage: val, subject: undefined })
              }}
              disabled={!filters.system_type}
            >
              <SelectTrigger>
                <SelectValue placeholder={filters.system_type ? "اختر المرحلة" : "اختر النظام أولاً"} />
              </SelectTrigger>
              <SelectContent>
                {stages
                  .filter(stage => !filters.system_type || STAGES_BY_SYSTEM[filters.system_type]?.includes(stage.name))
                  .map(stage => (
                  <SelectItem key={stage.name} value={stage.name}>{stage.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">المادة</label>
            <Select 
              value={filters.subject || ''} 
              onValueChange={(val) => handleFilterChange('subject', val)}
              disabled={!filters.stage || !filters.system_type}
            >
              <SelectTrigger>
                <SelectValue placeholder={filters.stage ? "اختر المادة" : "اختر المرحلة أولاً"} />
              </SelectTrigger>
              <SelectContent>
                {subjects
                  .filter(subject => 
                    !filters.system_type || !filters.stage || 
                    (SUBJECTS_BY_SYSTEM_AND_STAGE[filters.system_type]?.[filters.stage]?.includes(subject.name))
                  )
                  .map(subject => (
                  <SelectItem key={subject.name} value={subject.name}>{subject.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">طريقة التدريس</label>
            <Select 
              value={filters.teaching_type || ''} 
              onValueChange={(val) => handleFilterChange('teaching_type', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الطريقة" />
              </SelectTrigger>
              <SelectContent>
                {TEACHING_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end h-full gap-2 lg:col-span-2">
            <Button 
              variant="default" 
              className="w-full bg-primary-600 hover:bg-primary-700 text-white"
              onClick={handleSearch}
            >
              بحث
            </Button>
            <Button 
              variant="outline" 
              className="w-full text-gray-500"
              onClick={handleClearFilters}
              disabled={Object.keys(filters).length === 0}
            >
              <X className="h-4 w-4 mr-2 shrink-0" />
              مسح
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
