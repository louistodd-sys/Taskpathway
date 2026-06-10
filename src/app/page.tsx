import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandingPage from './(marketing)/page'
import MarketingLayout from './(marketing)/layout'

export { metadata } from './(marketing)/page'

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
