import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TaskPathway',
  description: 'Build it once. Follow it every time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
