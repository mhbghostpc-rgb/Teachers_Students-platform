import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: userData } = await supabase.from('users').select('role_name').eq('id', session.user.id).single()
    if (userData?.role_name !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: alerts, error } = await supabase
      .from('system_alerts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    return NextResponse.json({ alerts })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { title, message, type } = await request.json()

    // Prevent spam by checking if a similar recent alert exists
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: existing } = await supabaseAdmin
      .from('system_alerts')
      .select('id')
      .eq('title', title)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Within 24 hours
      .maybeSingle()

    if (existing) {
      // Already alerted recently, don't spam
      return NextResponse.json({ success: true, note: 'Already alerted' })
    }

    const { error } = await supabaseAdmin
      .from('system_alerts')
      .insert({ title, message, type })

    if (error) {
      console.error('Failed to insert system alert:', error)
      return NextResponse.json({ error: 'Failed to insert alert' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('System alert error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
