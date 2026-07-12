import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) return NextResponse.json({ unread: false })

    const { data: user } = await supabase
      .from('users')
      .select('role_name')
      .eq('id', session.user.id)
      .single()

    const isAdmin = user?.role_name === 'admin'

    if (isAdmin) {
      // For admin: check if there are any tickets where the LAST message is from a user
      // Since complex group-by is hard in postgrest, we can just fetch all tickets with their last message
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select(`
          id,
          messages:support_messages (
            sender_id,
            users:sender_id ( role_name )
          )
        `)
        .order('created_at', { referencedTable: 'support_messages', ascending: false })
        .limit(1, { referencedTable: 'support_messages' })

      let hasUnread = false
      if (tickets) {
        for (const ticket of tickets) {
          if (ticket.messages && ticket.messages.length > 0) {
            const lastMsg = ticket.messages[0] as any
            if (lastMsg.users?.role_name !== 'admin') {
              hasUnread = true
              break
            }
          }
        }
      }
      
      return NextResponse.json({ unread: hasUnread })
    } else {
      // For user: get the ticket's updated_at timestamp
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('id, updated_at, messages:support_messages(sender_id, users:sender_id(role_name))')
        .eq('user_id', session.user.id)
        .order('created_at', { referencedTable: 'support_messages', ascending: false })
        .limit(1, { referencedTable: 'support_messages' })
        .single()

      if (ticket) {
        let isLastFromAdmin = false
        if (ticket.messages && ticket.messages.length > 0) {
          const lastMsg = ticket.messages[0] as any
          isLastFromAdmin = lastMsg.users?.role_name === 'admin'
        }
        return NextResponse.json({ 
          ticketId: ticket.id, 
          updatedAt: ticket.updated_at,
          isLastFromAdmin
        })
      }
      
      return NextResponse.json({ unread: false })
    }
  } catch (error) {
    console.error('Unread check error:', error)
    return NextResponse.json({ unread: false })
  }
}
