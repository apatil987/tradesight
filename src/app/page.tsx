import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-800/50 bg-gray-950/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">TS</span>
            </div>
            <span className="font-bold text-base tracking-tight">TradeSight</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link href="/auth/signup" className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/25 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            AI-Powered Trading Coach
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-5 tracking-tight">
            Know Why You Trade<br />The Way You Do
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            TradeSight turns your trade history into behavioral insights — so you can fix the habits that are costing you money.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/auth/signup" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">
              Get Started Free
            </Link>
            <Link href="/auth/login" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl border border-gray-700 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-900/40 border-y border-gray-800/50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                title: 'Log Your Trades',
                desc: 'Enter trades manually in seconds — ticker, entry, exit, and a note on your mindset going in.',
              },
              {
                step: '02',
                title: 'Get Your Score',
                desc: 'Every trade gets a 0–100 performance score based on entry timing, exit quality, and profit capture.',
              },
              {
                step: '03',
                title: 'Fix Your Habits',
                desc: 'See your worst time of day, what revenge trading costs you, and exactly where you leave money on the table.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step}>
                <p className="text-5xl font-bold text-gray-800 mb-3 leading-none">{step}</p>
                <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white text-center mb-12">Everything You Need to Trade Better</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                badge: 'Scoring',
                title: 'Trade Score (0–100)',
                desc: 'A single number for every trade combining entry timing, exit quality, and how much of the available move you captured.',
              },
              {
                badge: 'Analysis',
                title: 'What-If Analysis',
                desc: 'See what your P&L would have been if you held 5 or 10 minutes longer. Powered by real market data — no guessing.',
              },
              {
                badge: 'Analytics',
                title: 'Time of Day Breakdown',
                desc: 'Discover when you trade best and worst. Most traders have a strong 90-minute window — do you know yours?',
              },
              {
                badge: 'AI Coach',
                title: 'Coach Insights',
                desc: 'Behavioral patterns flagged automatically: revenge trading, cutting winners short, overtrading after losses.',
              },
            ].map(({ badge, title, desc }) => (
              <div key={title} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <span className="text-xs font-medium text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full">{badge}</span>
                <h3 className="text-white font-semibold mt-3 mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <span className="text-gray-500 text-sm font-medium">TradeSight</span>
          </div>
          <p className="text-gray-600 text-xs">© 2025 TradeSight. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
