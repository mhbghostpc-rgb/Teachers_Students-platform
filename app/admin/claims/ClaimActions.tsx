"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'

export function ClaimActions({ claimId, teacherId, userId }: { claimId: string, teacherId: string, userId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!confirm(action === 'approve' ? 'هل أنت متأكد من الموافقة وربط هذا الحساب؟' : 'هل أنت متأكد من رفض هذا الطلب؟')) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/admin/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, teacherId, userId, action })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'حدث خطأ')
      }

      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        size="sm" 
        variant="success" 
        className="gap-1 bg-green-600 hover:bg-green-700"
        onClick={() => handleAction('approve')}
        disabled={loading}
      >
        <Check className="w-4 h-4" /> موافقة وربط
      </Button>
      <Button 
        size="sm" 
        variant="destructive" 
        className="gap-1"
        onClick={() => handleAction('reject')}
        disabled={loading}
      >
        <X className="w-4 h-4" /> رفض
      </Button>
    </div>
  )
}
