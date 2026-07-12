"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft } from 'lucide-react'

interface Ad {
  id: string
  title: string
  image_url: string
  target_url: string | null
}

export function AdsCarousel() {
  const [ads, setAds] = useState<Ad[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase
        .from('platform_ads')
        .select('*')
        .eq('status', 'active')
      if (data) {
        setAds(data)
      }
    }
    fetchAds()
  }, [])

  useEffect(() => {
    if (ads.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [ads.length])

  if (ads.length === 0) return null

  const next = () => setCurrentIndex((prev) => (prev + 1) % ads.length)
  const prev = () => setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length)

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="relative w-full h-[200px] md:h-[300px] lg:h-[400px] rounded-3xl overflow-hidden shadow-2xl group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full"
          >
            {ads[currentIndex].target_url ? (
              <a href={ads[currentIndex].target_url} target="_blank" rel="noreferrer" className="block w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ads[currentIndex].image_url} alt={ads[currentIndex].title} className="w-full h-full object-cover" />
              </a>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={ads[currentIndex].image_url} alt={ads[currentIndex].title} className="w-full h-full object-cover" />
            )}
          </motion.div>
        </AnimatePresence>

        {ads.length > 1 && (
          <>
            <button 
              onClick={prev}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button 
              onClick={next}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {ads.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
