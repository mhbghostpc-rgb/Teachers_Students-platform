import { createClient } from '@/lib/supabase/server'
import { ClaimActions } from './ClaimActions'

export const metadata = {
  title: 'طلبات ربط الحسابات | لوحة التحكم'
}

export default async function ClaimsPage() {
  const supabase = createClient()
  
  // Fetch pending claims
  const { data: claims } = await supabase
    .from('profile_claims')
    .select(`
      id,
      provided_phone,
      status,
      created_at,
      user_id,
      teacher_profile_id,
      teachers ( display_name, phone )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Fetch users info
  const userIds = claims?.map(c => c.user_id) || []
  let userMap = new Map()
  if (userIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, email, display_name').in('id', userIds)
    if (users) {
      userMap = new Map(users.map(u => [u.id, u]))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">طلبات ربط الحسابات للمعلمين</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المعلم المُطالِب (صاحب الحساب)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الملف المطلوب ربطه</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الهاتف المُدخل</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {!claims || claims.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">لا توجد طلبات ربط قيد المراجعة حالياً.</td>
              </tr>
            ) : (
              claims.map((claim: any) => {
                const user = userMap.get(claim.user_id)
                const isMatch = claim.provided_phone === claim.teachers?.phone
                return (
                  <tr key={claim.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{user?.display_name || 'بدون اسم'}</div>
                      <div className="text-sm text-gray-500">{user?.email || 'بدون إيميل'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{claim.teachers?.display_name}</div>
                      <div className="text-sm text-gray-500 text-left" dir="ltr">{claim.teachers?.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
                          isMatch ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`} dir="ltr">
                          {claim.provided_phone}
                        </span>
                        {isMatch ? (
                          <span className="text-[10px] text-green-600">متطابق ✓</span>
                        ) : (
                          <span className="text-[10px] text-red-600">غير متطابق ✕</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(claim.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <ClaimActions claimId={claim.id} teacherId={claim.teacher_profile_id} userId={claim.user_id} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
