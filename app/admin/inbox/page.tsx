import { createClient } from '@/lib/supabase/server'
import { AdminInboxClient } from './AdminInboxClient'

export const metadata = {
  title: 'صندوق الوارد والدعم | لوحة التحكم'
}

export default async function InboxPage() {
  const supabase = createClient()
  
  // Fetch all tickets with user details
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select(`
      id,
      status,
      updated_at,
      user_id,
      users ( email, display_name, role_name )
    `)
    .order('updated_at', { ascending: false })

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">صندوق الوارد والدعم الفني</h1>
      </div>
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        <AdminInboxClient initialTickets={tickets || []} />
      </div>
    </div>
  )
}
