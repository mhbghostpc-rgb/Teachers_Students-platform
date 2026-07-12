"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function StagesPage() {
  const [stages, setStages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<any>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  const fetchStages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('educational_stages')
      .select('*')
      .order('name')
    
    if (error) {
      toast.error('حدث خطأ أثناء جلب المراحل التعليمية')
    } else {
      setStages(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStages()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('يرجى إدخال اسم المرحلة')
    
    setSubmitting(true)
    try {
      if (editingStage) {
        const { error } = await supabase
          .from('educational_stages')
          .update({ name, is_active: isActive })
          .eq('id', editingStage.id)
        if (error) throw error
        toast.success('تم التعديل بنجاح')
      } else {
        const { error } = await supabase
          .from('educational_stages')
          .insert({ name, is_active: isActive })
        if (error) throw error
        toast.success('تمت الإضافة بنجاح')
      }
      
      closeModal()
      fetchStages()
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('هل أنت متأكد من حذف هذه المرحلة؟')) return
    
    try {
      const { error } = await supabase.from('educational_stages').delete().eq('id', id)
      if (error) throw error
      toast.success('تم الحذف بنجاح')
      fetchStages()
    } catch (error: any) {
      toast.error('لا يمكن الحذف لارتباط المرحلة ببيانات أخرى')
    }
  }

  const toggleStatus = async (stage: any, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { error } = await supabase
        .from('educational_stages')
        .update({ is_active: !stage.is_active })
        .eq('id', stage.id)
      if (error) throw error
      toast.success('تم تحديث الحالة')
      setStages(stages.map(s => s.id === stage.id ? { ...s, is_active: !s.is_active } : s))
    } catch (error) {
      toast.error('حدث خطأ')
    }
  }

  const openModal = (stage?: any) => {
    if (stage) {
      setEditingStage(stage)
      setName(stage.name)
      setIsActive(stage.is_active)
    } else {
      setEditingStage(null)
      setName('')
      setIsActive(true)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingStage(null)
    setName('')
    setIsActive(true)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-gray-900 mb-3">المراحل التعليمية</h1>
          <p className="text-gray-500 font-medium">إدارة وتنظيم المراحل الدراسية عبر المنصة</p>
        </div>
        <button
          onClick={() => openModal()}
          className="group px-6 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 font-semibold"
        >
          <Plus className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition-colors" />
          <span>إضافة مرحلة</span>
        </button>
      </div>

      {/* Grid Content */}
      <div className="flex-1 pb-10">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
          </div>
        ) : (
          <motion.div 
            variants={container as any}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence>
              {stages.map((stage) => (
                <motion.div
                  key={stage.id}
                  variants={item as any}
                  layoutId={`stage-${stage.id}`}
                  className="luxury-card p-8 flex flex-col justify-between group cursor-pointer h-52 relative overflow-hidden"
                  onClick={() => openModal(stage)}
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors ${
                        stage.is_active 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {stage.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {stage.is_active ? 'نشط' : 'معطل'}
                      </div>
                      
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={(e) => toggleStatus(stage, e)}
                          className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                          title="تغيير الحالة"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(stage.id, e)}
                          className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-800">{stage.name}</h3>
                  </div>
                  
                  <div className="text-sm font-medium text-gray-400 group-hover:text-gray-900 transition-colors flex items-center gap-2">
                    <span>انقر للتعديل</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">←</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {stages.length === 0 && (
              <div className="col-span-full h-40 flex items-center justify-center border border-dashed border-gray-200 rounded-2xl bg-white/50">
                <p className="text-gray-500">لا توجد مراحل تعليمية مضافة بعد.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-[2rem] shadow-2xl p-10 w-full max-w-md relative z-10"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                {editingStage ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">اسم المرحلة</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                    placeholder="مثال: ابتدائي، إعدادي..."
                  />
                </div>
                
                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-semibold">حالة المرحلة</span>
                    <span className="text-xs text-gray-500 mt-1">تفعيل أو تعطيل ظهور المرحلة للطلاب</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      isActive ? 'bg-gray-900' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${
                        isActive ? '-translate-x-1' : '-translate-x-7'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black hover:shadow-lg transition-all flex justify-center items-center"
                  >
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'حفظ التغييرات'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-8 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
