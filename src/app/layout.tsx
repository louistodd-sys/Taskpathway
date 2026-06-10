import type { Metadata } from 'next'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://taskpathway.com'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'TaskPathway — SOP & Work Instruction Software',
    template: '%s | TaskPathway',
  },
  description: 'Create, manage, and execute standard operating procedures and work instructions. Role-based approval flows, version control, and interactive step-by-step viewer for manufacturing and operations teams.',
  keywords: [
    'SOP software', 'SOP management software', 'standard operating procedure software',
    'work instruction software', 'work instruction creator', 'SOP creator',
    'manufacturing SOP tool', 'procedure management system',
    'digital work instructions', 'interactive SOP viewer', 'operations management software',
    'work procedure software', 'TaskPathway',
  ],
  authors: [{ name: 'TaskPathway' }],
  creator: 'TaskPathway',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: APP_URL,
    siteName: 'TaskPathway',
    title: 'TaskPathway — SOP & Work Instruction Software for Teams',
    description: 'Create, manage, and execute standard operating procedures with role-based approval flows, version control, and an interactive viewer built for manufacturing teams.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'TaskPathway' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskPathway — SOP & Work Instruction Software',
    description: 'Digital SOPs and work instructions with approval flows, version control, and interactive execution.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'TaskPathway',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              url: APP_URL,
              description: 'Multi-tenant SOP and work instruction software with role-based approval workflows, version control, and an interactive step-by-step viewer for manufacturing and operations teams.',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'GBP',
              },
              featureList: [
                'SOP Creation and Management',
                'Work Instruction Builder',
                'Approval Workflow',
                'Version Control',
                'Interactive Step-by-Step Viewer',
                'Role-Based Access Control',
                'Multi-Tenant Workspaces',
                'Audit Trail',
              ],
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
