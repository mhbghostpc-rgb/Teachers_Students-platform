"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Mic, Square, Play, Pause, Loader2, UserCircle2 } from 'lucide-react'
import { SupportTicket, SupportMessage } from '@/types'

export function AdminInboxClient({ initialTickets }: { initialTickets: any[] }) {
  const [tickets, setTickets] = useState(initialTickets)
  const [activeTicket, setActiveTicket] = useState<any | null>(null)
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

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Polling
  useEffect(() => {
    const interval = setInterval(fetchTickets, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeTicket) {
      fetchMessages(activeTicket.id)
      const interval = setInterval(() => fetchMessages(activeTicket.id), 5000)
      return () => clearInterval(interval)
    }
  }, [activeTicket])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchTickets = async () => {
    // Refresh tickets from a custom API or we can just let it be, 
    // but a simple fetch is needed if we want live updates in inbox list.
    // For now, let's keep it simple.
  }

  const fetchMessages = async (ticketId: string) => {
    setFetching(true)
    try {
      const res = await fetch(`/api/support?ticketId=${ticketId}`)
      const data = await res.json()
      if (data.messages) {
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
    if ((!text.trim() && !audioBlob) || !activeTicket) return

    setLoading(true)
    try {
      const formData = new FormData()
      if (text.trim()) formData.append('content', text)
      if (audioBlob) {
        formData.append('audio', audioBlob, 'voice-message.webm')
      }
      formData.append('ticketId', activeTicket.id)

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
    <div className="flex h-full divide-x divide-x-reverse divide-gray-200">
      {/* Sidebar: Ticket List */}
      <div className="w-1/3 bg-gray-50 flex flex-col h-full border-l border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="font-bold text-gray-800">المحادثات ({tickets.length})</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => setActiveTicket(ticket)}
              className={`w-full text-right p-4 border-b border-gray-100 hover:bg-gray-100 transition-colors ${activeTicket?.id === ticket.id ? 'bg-primary-50 border-primary-200' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 shrink-0">
                  <UserCircle2 className="w-6 h-6" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {ticket.users?.display_name || 'مستخدم مجهول'}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">{ticket.users?.role_name === 'teacher' ? 'معلم' : 'طالب'}</p>
                </div>
              </div>
            </button>
          ))}
          {tickets.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              لا توجد رسائل حالياً
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-2/3 flex flex-col h-full bg-white">
        {activeTicket ? (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 shrink-0">
                <UserCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{activeTicket.users?.display_name}</h3>
                <p className="text-xs text-gray-500">{activeTicket.users?.email}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              {messages.map((msg) => {
                const isAdmin = msg.sender?.role_name === 'admin'
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[70%] ${isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <div className={`text-xs text-gray-500 mb-1 mx-1`}>
                      {isAdmin ? 'أنت (الإدارة)' : ((msg.sender as any)?.display_name || msg.sender?.email || 'المستخدم')}
                    </div>
                    <div className={`p-4 rounded-2xl shadow-sm ${isAdmin ? 'bg-primary-600 text-white rounded-tl-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tr-sm'}`}>
                      {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                      
                      {msg.audio_url && (
                        <div className={`mt-2 flex items-center gap-2 rounded-full p-1 pr-3 w-48 ${isAdmin ? 'bg-black/10' : 'bg-gray-100'}`}>
                          <button 
                            onClick={() => toggleAudio(msg.audio_url!, msg.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? 'bg-white text-primary-600' : 'bg-primary-100 text-primary-600'}`}
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
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-white">
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
                      placeholder="اكتب ردك هنا..."
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
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <UserCircle2 className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-500">اختر محادثة للبدء في الرد</p>
          </div>
        )}
      </div>
    </div>
  )
}
