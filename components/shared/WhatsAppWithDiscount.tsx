"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { MessageCircle, ExternalLink } from 'lucide-react'

interface WhatsAppWithDiscountProps {
  teacherName: string
  phone: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "gradient"
  size?: "default" | "sm" | "lg" | "icon"
}

export function WhatsAppWithDiscount({ 
  teacherName, 
  phone, 
  className = "w-full gap-2",
  variant = "success",
  size = "default"
}: WhatsAppWithDiscountProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [discountCode, setDiscountCode] = useState('')

  // Format number for WhatsApp API
  const formatWhatsAppNumber = (phoneStr: string) => {
    if (!phoneStr) return ''
    let cleaned = phoneStr.replace(/[\s\-\+]/g, '')
    if (cleaned.startsWith('01') && cleaned.length === 11) {
      cleaned = '2' + cleaned // 201xxxxxxxxx
    }
    return cleaned
  }

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsOpen(true)
  }

  const handleProceed = () => {
    let message = `أهلاً أ. ${teacherName}، أود الاستفسار عن الانضمام لمجموعاتك الدراسية.`
    if (discountCode.trim()) {
      message += `\n\nلدي كود خصم من المنصة: *${discountCode.trim().toUpperCase()}*`
    }
    
    const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    setIsOpen(false)
  }

  return (
    <>
      <Button 
        variant={variant as any} 
        size={size} 
        className={className}
        onClick={handleWhatsAppClick}
      >
        <MessageCircle className={size === 'sm' ? "h-4 w-4" : "h-5 w-5"} />
        واتساب
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">تواصل عبر الواتساب</DialogTitle>
            <DialogDescription className="text-center pt-2">
              هل تمتلك كود خصم من المنصة؟ أدخله هنا ليتم إرساله للمعلم.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="أدخل كود الخصم (اختياري)"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                dir="ltr"
                className="text-center font-mono text-lg uppercase tracking-widest"
              />
            </div>
            
            <div className="flex flex-col gap-2 mt-6">
              <Button onClick={handleProceed} className="w-full gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white">
                <MessageCircle className="w-5 h-5" />
                {discountCode.trim() ? 'تطبيق الكود والانتقال للواتساب' : 'المتابعة للواتساب مباشرة'}
                <ExternalLink className="w-4 h-4 mr-auto opacity-50" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
