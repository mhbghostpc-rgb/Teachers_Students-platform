import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const metadata = {
  title: 'لوحة التحكم | منصة المعلمين',
  description: 'لوحة تحكم الإدارة الشاملة',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Check admin role
  const { data: userData } = await supabase
    .from('users')
    .select('role_name')
    .eq('id', session.user.id)
    .single()

  if (!userData || !['admin', 'super_admin'].includes(userData.role_name)) {
    redirect('/')
  }

  return (
    <div className="flex h-screen bg-[#FCFCFD] text-[#1A1D20] overflow-hidden" dir="rtl">
      
      {/* Elegant Sidebar */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative z-10 w-full overflow-hidden">
        
        {/* Elegant Top Header */}
        <header className="px-4 md:px-12 py-4 md:py-8 flex justify-between items-center bg-transparent mt-12 md:mt-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-light tracking-tight elegant-text">إدارة المنصة</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-2 font-medium">مرحباً بعودتك، مدير النظام</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-full champagne-gradient p-[2px] cursor-pointer hover:shadow-lg transition-all duration-300">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <span className="font-semibold text-gray-700">
                  AD
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto px-4 md:px-12 pb-12 w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
