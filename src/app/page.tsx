import { Check, ArrowRight, Zap, Shield, BarChart3, Users, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">FlowSync</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900">Sign in</button>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Star className="w-4 h-4" />
            New: AI-powered workflow automation
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight mb-6">
            Work smarter.
            <br />
            <span className="text-indigo-600">Not harder.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            FlowSync helps teams automate repetitive tasks, streamline workflows, and focus on what actually matters. Join 10,000+ teams already saving 10+ hours per week.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto bg-white text-gray-700 border border-gray-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition">
              Watch Demo
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">No credit card required. 14-day free trial.</p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm mb-8">Trusted by leading teams worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
            {['Acme Corp', 'GlobalTech', 'Innovate Labs', 'DataFlow', 'CloudSync'].map((company) => (
              <span key={company} className="text-xl font-bold text-gray-400">{company}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to move fast
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features that help you automate, collaborate, and scale without the complexity.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Automate repetitive tasks in seconds. Set up workflows that run while you sleep.'
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'Bank-grade encryption, SOC 2 compliance, and granular permissions for peace of mind.'
              },
              {
                icon: BarChart3,
                title: 'Powerful Analytics',
                description: 'Track performance, identify bottlenecks, and optimize your workflows with data.'
              }
            ].map((feature) => (
              <div key={feature.title} className="p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '0',
                description: 'Perfect for individuals getting started',
                features: ['5 workflows', '100 runs/month', 'Basic integrations', 'Email support']
              },
              {
                name: 'Pro',
                price: '29',
                description: 'For growing teams that need more power',
                features: ['Unlimited workflows', '10,000 runs/month', 'All integrations', 'Priority support', 'Team collaboration', 'Advanced analytics'],
                popular: true
              },
              {
                name: 'Enterprise',
                price: '99',
                description: 'For organizations with advanced needs',
                features: ['Everything in Pro', 'Unlimited runs', 'Custom integrations', 'Dedicated support', 'SSO & SAML', 'SLA guarantee']
              }
            ].map((plan) => (
              <div key={plan.name} className={`relative p-8 rounded-2xl ${plan.popular ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'bg-white text-gray-900 border border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-indigo-100' : 'text-gray-500'}`}>{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className={`text-sm ${plan.popular ? 'text-indigo-200' : 'text-gray-500'}`}>/month</span>
                </div>
                <button className={`w-full py-3 rounded-xl font-semibold mb-8 transition ${plan.popular ? 'bg-white text-indigo-600 hover:bg-gray-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  Get Started
                </button>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className={`w-5 h-5 ${plan.popular ? 'text-indigo-300' : 'text-indigo-600'}`} />
                      <span className={`text-sm ${plan.popular ? 'text-indigo-100' : 'text-gray-600'}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Ready to reclaim your time?
          </h2>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Join thousands of teams who&apos;ve already made the switch. Start your free trial today — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto bg-white text-gray-700 border border-gray-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
              <Users className="w-5 h-5" />
              Talk to Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900">FlowSync</span>
              </div>
              <p className="text-gray-500 text-sm">
                Automating the future of work. Built for teams that move fast.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-gray-900">Features</a></li>
                <li><a href="#" className="hover:text-gray-900">Integrations</a></li>
                <li><a href="#" className="hover:text-gray-900">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-gray-900">About</a></li>
                <li><a href="#" className="hover:text-gray-900">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900">Careers</a></li>
                <li><a href="#" className="hover:text-gray-900">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-gray-900">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900">Terms</a></li>
                <li><a href="#" className="hover:text-gray-900">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">© 2026 FlowSync. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-gray-600">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-gray-600">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
