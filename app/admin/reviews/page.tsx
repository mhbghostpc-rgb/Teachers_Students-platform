import { createClient } from '@/lib/supabase/server'
import { ReviewsTable } from '@/components/admin/ReviewsTable'
import { Review } from '@/types'

export const metadata = {
  title: 'إدارة التقييمات | لوحة التحكم',
}

export default async function ReviewsPage() {
  const supabase = createClient()

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(`
      *,
      student:students (id, display_name),
      teacher:teachers (id, display_name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">إدارة التقييمات والمراجعات</h1>
      </div>

      <ReviewsTable initialReviews={(reviews as unknown as Review[]) || []} />
    </div>
  )
}
