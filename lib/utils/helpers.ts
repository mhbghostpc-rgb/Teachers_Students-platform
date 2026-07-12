export function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatArabicNumber(number: number) {
  return new Intl.NumberFormat('ar-SA').format(number)
}

export function generateInitials(name: string) {
  if (!name) return ''
  const words = name.trim().split(' ')
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`
  }
  return name.slice(0, 2)
}
