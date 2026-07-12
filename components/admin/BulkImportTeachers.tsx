"use client"

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileSpreadsheet, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import { toast } from 'react-hot-toast'

export function BulkImportTeachers() {
  const [isOpen, setIsOpen] = useState(false)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number, errors: string[] } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Attempt to map Arabic column names to English keys if needed
        const mappedData = results.data.map((row: any) => ({
          name: row['الاسم'] || row['اسم المعلم'] || row['name'] || '',
          phone: row['رقم الهاتف'] || row['الموبايل'] || row['phone'] || '',
          subject: row['التخصص'] || row['المادة'] || row['subject'] || '',
          city: row['البلد'] || row['المحافظة'] || row['city'] || ''
        }))
        
        // Filter out completely empty rows
        const validData = mappedData.filter(d => d.name || d.phone || d.subject)
        
        if (validData.length === 0) {
          toast.error('الملف فارغ أو لا يحتوي على الأعمدة المطلوبة (الاسم، الموبايل، التخصص، البلد)')
          return
        }
        
        setParsedData(validData)
        setImportResult(null)
      },
      error: (err) => {
        toast.error('حدث خطأ في قراءة الملف')
        console.error(err)
      }
    })
  }

  const handleImport = async () => {
    if (parsedData.length === 0) return
    setIsProcessing(true)

    try {
      const response = await fetch('/api/admin/bulk-import-teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teachers: parsedData })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'حدث خطأ أثناء الرفع')
      }

      setImportResult({
        success: result.successCount,
        errors: result.errors || []
      })
      
      toast.success(result.message)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const closeModal = () => {
    const didSucceed = importResult && importResult.success > 0
    setIsOpen(false)
    setParsedData([])
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    
    if (didSucceed) {
      window.location.reload()
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group px-6 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 font-semibold"
      >
        <FileSpreadsheet className="w-5 h-5 text-green-600" />
        <span>استيراد من Excel (CSV)</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-8 border-b border-gray-100">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">استيراد المعلمين</h3>
                  <p className="text-sm text-gray-500 mt-1">قم برفع ملف CSV يحتوي على (الاسم، الموبايل، التخصص، البلد)</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-8 overflow-y-auto flex-1">
                {!importResult ? (
                  <>
                    {parsedData.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                          <UploadCloud className="w-10 h-10 text-green-600" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-800 mb-2">اختر ملف CSV</h4>
                        <p className="text-gray-500 mb-6 max-w-sm">
                          يجب أن يكون الملف بصيغة .csv وأن يحتوي على أعمدة واضحة لأسماء المعلمين وبياناتهم.
                        </p>
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors shadow-lg"
                        >
                          تصفح الملفات
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-2xl border border-blue-100">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-blue-600" />
                            <span className="font-bold text-blue-900">تم قراءة {parsedData.length} صف جاهز للاستيراد</span>
                          </div>
                          <button
                            onClick={() => setParsedData([])}
                            className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            اختيار ملف آخر
                          </button>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                          <div className="max-h-64 overflow-y-auto">
                            <table className="w-full text-right text-sm">
                              <thead className="bg-gray-50 text-gray-600 sticky top-0">
                                <tr>
                                  <th className="px-6 py-3 font-semibold">اسم المعلم</th>
                                  <th className="px-6 py-3 font-semibold">التخصص</th>
                                  <th className="px-6 py-3 font-semibold">رقم الهاتف</th>
                                  <th className="px-6 py-3 font-semibold">البلد</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {parsedData.slice(0, 10).map((row, i) => (
                                  <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-medium text-gray-900">{row.name || '-'}</td>
                                    <td className="px-6 py-3 text-gray-600">{row.subject || '-'}</td>
                                    <td className="px-6 py-3 text-gray-600">{row.phone || '-'}</td>
                                    <td className="px-6 py-3 text-gray-600">{row.city || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {parsedData.length > 10 && (
                            <div className="p-3 text-center text-xs font-semibold text-gray-400 bg-gray-50">
                              ... و {parsedData.length - 10} صفوف أخرى
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Results View
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-green-50 rounded-3xl border border-green-100">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="text-2xl font-bold text-green-900 mb-2">تم الاستيراد بنجاح!</h4>
                      <p className="text-green-700 font-medium">تم إضافة {importResult.success} معلم إلى المنصة.</p>
                    </div>

                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                        <div className="flex items-center gap-2 text-red-800 font-bold mb-4">
                          <AlertCircle className="w-5 h-5" />
                          <span>بعض الصفوف لم يتم إضافتها لوجود أخطاء:</span>
                        </div>
                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                          {importResult.errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-[2rem] flex gap-4">
                {!importResult ? (
                  <>
                    <button
                      onClick={handleImport}
                      disabled={parsedData.length === 0 || isProcessing}
                      className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black hover:shadow-lg transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'تأكيد الرفع وبدء الاستيراد'}
                    </button>
                    <button
                      onClick={closeModal}
                      disabled={isProcessing}
                      className="px-8 bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      إلغاء
                    </button>
                  </>
                ) : (
                  <button
                    onClick={closeModal}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all"
                  >
                    إغلاق النافذة
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
