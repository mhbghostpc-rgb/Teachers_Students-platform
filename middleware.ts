import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  // Update the Supabase session
  const supabaseResponse = await updateSession(request)

  // Visitor Tracking Logic
  let visitorId = request.cookies.get('visitor_id')?.value
  
  if (!visitorId) {
    visitorId = crypto.randomUUID()
    supabaseResponse.cookies.set('visitor_id', visitorId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    
    // Track in database
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      )
      
      // We wrap in try-catch so if DB fails, it doesn't break the response
      try {
        await supabaseAdmin.from('site_visitors').insert({ visitor_id: visitorId })
      } catch (err) {
        console.error('Visitor tracking error:', err)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
