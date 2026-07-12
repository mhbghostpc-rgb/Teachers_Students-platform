import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const ticketId = searchParams.get('ticketId')

  if (ticketId) {
    const { data: messages } = await supabase
      .from('support_messages')
      .select('*, sender:users(display_name, role_name)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    
    return NextResponse.json({ messages })
  }

  // Get user's ticket (create if not exists)
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  if (ticket) {
    return NextResponse.json({ ticket })
  }

  // Create a new ticket
  const { data: newTicket, error } = await supabase
    .from('support_tickets')
    .insert({ user_id: session.user.id, status: 'open' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }

  return NextResponse.json({ ticket: newTicket })
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const content = formData.get('content') as string
    const audioFile = formData.get('audio') as File | null
    let ticketId = formData.get('ticketId') as string

    if (!ticketId) {
      // Find or create ticket for user
      let { data: ticket } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('user_id', session.user.id)
        .single()
      
      if (!ticket) {
        const { data: newTicket } = await supabase
          .from('support_tickets')
          .insert({ user_id: session.user.id, status: 'open' })
          .select()
          .single()
        ticketId = newTicket.id
      } else {
        ticketId = ticket.id
      }
    }

    let audioUrl = null

    if (audioFile && audioFile.size > 0) {
      // Use service role for upload to bypass RLS
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const buffer = Buffer.from(await audioFile.arrayBuffer())
      const fileExt = audioFile.name.split('.').pop() || 'webm'
      const fileName = `${session.user.id}/${uuidv4()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('support_audio')
        .upload(fileName, buffer, {
          contentType: audioFile.type || 'audio/webm',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload Error:', uploadError)
        return NextResponse.json({ error: 'فشل رفع الملف الصوتي' }, { status: 500 })
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from('support_audio')
        .getPublicUrl(fileName)
        
      audioUrl = publicUrlData.publicUrl
    }

    if (!content && !audioUrl) {
      return NextResponse.json({ error: 'لا توجد رسالة لإرسالها' }, { status: 400 })
    }

    const { data: message, error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: session.user.id,
        content: content || null,
        audio_url: audioUrl
      })
      .select('*, sender:users(display_name, role_name)')
      .single()

    if (messageError) {
      console.error('Message Insert Error:', messageError)
      return NextResponse.json({ error: 'فشل إرسال الرسالة' }, { status: 500 })
    }

    // Update ticket updated_at
    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticketId)

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('Support API error:', error)
    return NextResponse.json({ error: 'حدث خطأ داخلي' }, { status: 500 })
  }
}
