import { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://taskpathway.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: ['/', '/login', '/register'], disallow: ['/library', '/create', '/edit/', '/admin/', '/changelog/', '/settings/'] },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
