import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/', 
        '/teacher/dashboard', 
        '/api/'
      ],
    },
    sitemap: 'https://teachers-directory-aswan.com/sitemap.xml', // Replace with your production URL
  }
}
