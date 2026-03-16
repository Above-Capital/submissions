export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-xl">FlowSync</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
            </div>
            <div className="flex items-center gap-4">
              <button className="hidden sm:block text-gray-600 hover:text-gray-900 transition-colors">Sign In</button>
              <button className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">Get Started</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 text-violet-700 text-sm font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-violet-600 animate-pulse"></span>
            Now with AI-powered automation
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6">
            Automate your workflow
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">without the chaos</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10">
            FlowSync connects your tools, automates your tasks, and gives you back hours every week. No coding required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105">Start Free Trial</button>
            <button className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all">Watch Demo</button>
          </div>
          <p className="mt-4 text-sm text-gray-500">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything you need to scale</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Powerful features that help you automate, integrate, and grow your business.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: "⚡", title: "Lightning Fast", desc: "Automations run in milliseconds. Connect triggers to actions instantly." },
              { icon: "🔗", title: "200+ Integrations", desc: "Connect with your favorite tools. Slack, Notion, GitHub, and more." },
              { icon: "🤖", title: "AI-Powered", desc: "Smart suggestions that learn from your workflow patterns." },
              { icon: "📊", title: "Advanced Analytics", desc: "Track performance, identify bottlenecks, optimize your processes." },
              { icon: "🔒", title: "Enterprise Security", desc: "SOC 2 compliant, end-to-end encryption, audit logs included." },
              { icon: "🚀", title: "No-Code Builder", desc: "Create complex workflows with our visual drag-and-drop interface." }
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white hover:shadow-lg transition-all">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600">Start free, scale as you grow</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-2xl border border-gray-200 bg-white">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-600 mb-4">Perfect for personal projects</p>
              <div className="mb-6"><span className="text-4xl font-bold">$0</span><span className="text-gray-600">/month</span></div>
              <ul className="space-y-3 mb-8">
                {["5 automations", "100 runs/month", "Basic integrations", "Email support"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700"><svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{f}</li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors">Get Started</button>
            </div>
            <div className="p-8 rounded-2xl bg-violet-600 text-white relative scale-105 shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold">Most Popular</div>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-violet-200 mb-4">For growing teams</p>
              <div className="mb-6"><span className="text-4xl font-bold">$29</span><span className="text-violet-200">/month</span></div>
              <ul className="space-y-3 mb-8">
                {["Unlimited automations", "10,000 runs/month", "All integrations", "Priority support", "Advanced analytics"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-violet-100"><svg className="w-5 h-5 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{f}</li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-lg font-semibold bg-white hover:bg-gray-100 text-violet-600 transition-colors">Get Started</button>
            </div>
            <div className="p-8 rounded-2xl border border-gray-200 bg-white">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-4">For large organizations</p>
              <div className="mb-6"><span className="text-4xl font-bold">$99</span><span className="text-gray-600">/month</span></div>
              <ul className="space-y-3 mb-8">
                {["Unlimited everything", "Unlimited runs", "Custom integrations", "Dedicated support", "SSO & Audit logs"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700"><svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{f}</li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-xl">FlowSync</span>
          </div>
          <p className="text-gray-600">© 2026 FlowSync. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
