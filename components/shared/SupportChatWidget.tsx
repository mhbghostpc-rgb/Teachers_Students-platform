"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Headset, Send, Mic, Square, Loader2, Play, Pause } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SupportMessage, SupportTicket } from '@/types'

export function SupportChatWidget() {
  const [open, setOpen] = useState(false)
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [hasUnread, setHasUnread] = useState(false)

  // Polling for unread messages when chat is closed
  useEffect(() => {
    const checkUnread = async () => {
      if (open) return
      try {
        const res = await fetch('/api/support/unread')
        const data = await res.json()
        if (data.updatedAt && data.isLastFromAdmin) {
          const lastRead = localStorage.getItem('support_last_read_at')
          if (!lastRead || new Date(data.updatedAt) > new Date(lastRead)) {
            setHasUnread(true)
          } else {
            setHasUnread(false)
          }
        } else {
          setHasUnread(false)
        }
      } catch (err) {
        // ignore
      }
    }
    
    checkUnread()
    const interval = setInterval(checkUnread, 15000) // check every 15s
    return () => clearInterval(interval)
  }, [open])

  useEffect(() => {
    if (open && !ticket) {
      fetchChat()
    }
    if (open) {
      setHasUnread(false)
      if (ticket?.updated_at) {
        localStorage.setItem('support_last_read_at', ticket.updated_at)
      }
      const interval = setInterval(fetchChat, 10000) // Poll every 10 seconds
      return () => clearInterval(interval)
    }
  }, [open, ticket])

  // also mark as read when fetching updates while open
  useEffect(() => {
    if (open && ticket?.updated_at) {
      localStorage.setItem('support_last_read_at', ticket.updated_at)
    }
  }, [messages, ticket, open])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchChat = async () => {
    if (!open && ticket) return
    setFetching(true)
    try {
      const res = await fetch('/api/support' + (ticket ? `?ticketId=${ticket.id}` : ''))
      const data = await res.json()
      if (data.ticket) {
        setTicket(data.ticket)
        if (data.ticket.id && !ticket) {
          // Fetch messages now that we have ticket id
          const msgRes = await fetch(`/api/support?ticketId=${data.ticket.id}`)
          const msgData = await msgRes.json()
          setMessages(msgData.messages || [])
        }
      } else if (data.messages) {
        setMessages(data.messages)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!text.trim() && !audioBlob) return

    setLoading(true)
    try {
      const formData = new FormData()
      if (text.trim()) formData.append('content', text)
      if (audioBlob) {
        formData.append('audio', audioBlob, 'voice-message.webm')
      }
      if (ticket) {
        formData.append('ticketId', ticket.id)
      }

      const res = await fetch('/api/support', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const { message } = await res.json()
        setMessages(prev => [...prev, message])
        setText('')
        setAudioBlob(null)
        setAudioUrl(null)
        scrollToBottom()
      }
    } catch (err) {
      console.error(err)
      alert('فشل إرسال الرسالة')
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        setAudioUrl(URL.createObjectURL(audioBlob))
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone', err)
      alert('الرجاء السماح بصلاحية المايكروفون لتسجيل الصوت')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const cancelRecording = () => {
    setAudioBlob(null)
    setAudioUrl(null)
  }

  const toggleAudio = (url: string, msgId: string) => {
    if (playingAudioId === msgId) {
      audioRef.current?.pause()
      setPlayingAudioId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      audioRef.current = new Audio(url)
      audioRef.current.play()
      setPlayingAudioId(msgId)
      
      audioRef.current.onended = () => {
        setPlayingAudioId(null)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="relative gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
          <Headset className="w-5 h-5" /> للتواصل مع خدمة الدعم الفني والإدارة اضغط هنا
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-sm border border-white"></span>
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md h-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="p-4 border-b bg-gray-50 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Headset className="w-5 h-5 text-primary-600" /> الدعم الفني
          </DialogTitle>
        </DialogHeader>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.length === 0 && !fetching && (
            <div className="text-center text-gray-500 mt-10">
              <p>أهلاً بك في الدعم الفني.</p>
              <p className="text-sm">كيف يمكننا مساعدتك اليوم؟</p>
            </div>
          )}
          {messages.map((msg) => {
            const isAdmin = msg.sender?.role_name === 'admin'
            return (
              <div key={msg.id} className={`flex flex-col max-w-[80%] ${isAdmin ? 'mr-auto items-start' : 'ml-auto items-end'}`}>
                <div className={`text-xs text-gray-500 mb-1 mx-1`}>
                  {isAdmin ? 'الإدارة' : 'أنت'}
                </div>
                <div className={`p-3 rounded-2xl ${isAdmin ? 'bg-white border border-gray-200 text-gray-800 rounded-tr-sm' : 'bg-primary-600 text-white rounded-tl-sm'}`}>
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                  
                  {msg.audio_url && (
                    <div className="mt-2 flex items-center gap-2 bg-black/10 rounded-full p-1 pr-3 w-48">
                      <button 
                        onClick={() => toggleAudio(msg.audio_url!, msg.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? 'bg-primary-100 text-primary-600' : 'bg-white text-primary-600'}`}
                      >
                        {playingAudioId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
                      </button>
                      <div className="flex-1 h-1 bg-black/20 rounded-full overflow-hidden">
                        {playingAudioId === msg.id && <div className="h-full bg-black/40 w-full animate-pulse" />}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 mt-1 mx-1">
                  {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )
          })}
          {fetching && messages.length === 0 && (
            <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-white flex-shrink-0">
          {isRecording ? (
            <div className="flex items-center justify-between bg-red-50 text-red-600 px-4 py-3 rounded-full border border-red-100 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-600" /> جاري التسجيل...
              </div>
              <button onClick={stopRecording} className="p-2 hover:bg-red-100 rounded-full transition-colors">
                <Square className="w-5 h-5" />
              </button>
            </div>
          ) : audioUrl ? (
            <div className="flex items-center gap-2 mb-3 bg-gray-100 p-2 rounded-lg">
              <button 
                onClick={() => toggleAudio(audioUrl, 'preview')}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-primary-600 shrink-0"
              >
                {playingAudioId === 'preview' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
              </button>
              <span className="text-sm flex-1 text-gray-600">تسجيل صوتي جاهز للإرسال</span>
              <Button variant="ghost" size="sm" onClick={cancelRecording} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2">إلغاء</Button>
            </div>
          ) : null}

          {!isRecording && (
            <form onSubmit={handleSend} className="flex items-end gap-2 mt-2">
              <div className="flex-1 relative">
                <Input 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  className="pr-4 pl-10 py-6 rounded-2xl bg-gray-50 border-gray-200 focus-visible:ring-primary-500"
                  disabled={loading || !!audioUrl}
                />
              </div>
              
              {!text && !audioUrl ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="w-12 h-12 rounded-full shrink-0 border-gray-200 text-gray-500 hover:text-primary-600 hover:bg-primary-50"
                  onClick={startRecording}
                  disabled={loading}
                >
                  <Mic className="w-5 h-5" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  size="icon" 
                  className="w-12 h-12 rounded-full shrink-0 bg-primary-600 hover:bg-primary-700 shadow-md"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -mr-1" />}
                </Button>
              )}
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
