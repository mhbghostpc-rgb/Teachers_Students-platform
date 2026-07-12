import { Star } from 'lucide-react'

interface RatingStarsProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
}

export function RatingStars({ rating, size = 'md' }: RatingStarsProps) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-7 w-7'
  }

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className={`${sizeClasses[size]} text-yellow-400 fill-yellow-400`} />
      ))}
      
      {hasHalfStar && (
        <div className="relative">
          <Star className={`${sizeClasses[size]} text-gray-300`} />
          <div className="absolute inset-0 overflow-hidden w-[50%]">
            <Star className={`${sizeClasses[size]} text-yellow-400 fill-yellow-400`} />
          </div>
        </div>
      )}
      
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className={`${sizeClasses[size]} text-gray-300`} />
      ))}
    </div>
  )
}
