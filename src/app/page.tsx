import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/marketing/LandingPage'
import MarketingLayout from '@/components/marketing/MarketingLayout'

export const metadata: Metadata = {
  title: 'TaskPathway — SOP & Work Instruction Software for Teams',
  description: 'Create, manage, and execute standard operating procedures and work instructions with TaskPathway. Role-based approval flows, version control, and an interactive step-by-step viewer built for manufacturing and operations teams.',
}

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/library')

  return (
    <MarketingLayout>
      <LandingPage />
    </MarketingLayout>
  )
}
