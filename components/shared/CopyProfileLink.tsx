"use client"

import { useState, useEffect } from 'react'
import { Link as LinkIcon, Check, Share2 } from 'lucide-react'

export function CopyProfileLink() {
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(window.location.href)
  }, [])

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  return (
    <div className="relative group overflow-hidden rounded-3xl p-1 mt-6 mb-8 transform transition-transform hover:-translate-y-1 cursor-pointer" onClick={handleCopy}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600 opacity-90 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary-400 via-secondary-400 to-primary-500 animate-pulse-slow opacity-60"></div>
      
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/20 backdrop-blur-xl border border-white/50 p-6 md:p-8 rounded-[1.4rem] shadow-2xl hover:shadow-primary-500/40 transition-all duration-300 overflow-hidden">
        
        {/* Glass reflection effect */}
        <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shimmer"></div>
        
        <div className="flex items-center gap-5 relative z-10 w-full sm:w-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/40 to-white/10 border border-white/50 shadow-inner flex items-center justify-center flex-shrink-0 backdrop-blur-md">
            <Share2 className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white drop-shadow-md mb-1">رابط صفحة المعلم</h3>
            <p className="text-white/90 font-medium text-sm drop-shadow-sm">انسخ الرابط لمشاركة هذه الصفحة مع زملائك</p>
          </div>
        </div>
        
        <button className="relative z-10 bg-white text-primary-800 hover:bg-gray-50 hover:scale-105 transition-transform duration-300 shadow-xl border-0 h-12 px-8 rounded-xl font-bold text-lg w-full sm:w-auto shrink-0 flex items-center justify-center gap-2">
          {copied ? (
            <>
              تم النسخ <Check className="w-5 h-5 text-green-500" />
            </>
          ) : (
            <>
              انسخ الرابط <LinkIcon className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
