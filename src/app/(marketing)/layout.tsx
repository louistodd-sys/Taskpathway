import Link from 'next/link'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TP</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">TaskPathway</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16">{children}</main>

      <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">TP</span>
              </div>
              <span className="text-white font-semibold">TaskPathway</span>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} TaskPathway. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
              <Link href="/register" className="hover:text-white transition-colors">Get started</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
