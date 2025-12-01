import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight, Zap, Target, Mail, Calendar, CheckCircle2, Sparkles, Users, TrendingUp, Lock, Globe, BarChart3, Rocket, ChevronRight, Star, ArrowUpRight, MessageSquare, Bot, Shield, Clock, MousePointer } from 'lucide-react';
import AuthHandler from './components/AuthHandler';

export default async function LandingPage() {
  // Check if user is authenticated
  let isAuthenticated = false;
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    isAuthenticated = !!session;
  } catch (error) {
    console.error('Auth check error:', error);
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden">
      {/* Auth Handler - handles OAuth redirect */}
      <Suspense fallback={null}>
        <AuthHandler />
      </Suspense>
      
      {/* Gradient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl" />
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5">
          <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur-xl" />
          <div className="relative max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur-lg opacity-50" />
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                    <Zap size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <span className="text-xl font-bold text-white font-space">
                  OutboundAI
                </span>
              </div>
              
              <div className="hidden md:flex items-center gap-1">
                <a href="#features" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">Features</a>
                <a href="#how-it-works" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">How It Works</a>
                <a href="#testimonials" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">Testimonials</a>
                <a href="#pricing" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">Pricing</a>
              </div>
              
              <div className="flex gap-3">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="px-5 py-2.5 rounded-full bg-white text-slate-900 font-semibold text-sm transition-all hover:bg-slate-100 flex items-center gap-2"
                  >
                    Dashboard
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-5 py-2.5 rounded-full text-sm text-slate-300 hover:text-white font-medium transition-all hover:bg-white/5"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="px-5 py-2.5 rounded-full bg-white text-slate-900 font-semibold text-sm transition-all hover:bg-slate-100"
                    >
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Badge */}
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight animate-fade-in-up font-soria">
                <span className="text-white">Your AI Sales Agent</span>
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  That Never Sleeps
                </span>
              </h1>

              <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto animate-fade-in-up delay-200">
                From finding leads to booking meetings—completely autonomous. 
                Let AI handle your outbound while you focus on closing deals.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in-up delay-300">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="group px-8 py-4 rounded-full bg-white text-slate-900 font-semibold transition-all text-base flex items-center gap-2 hover:bg-slate-100 shadow-xl shadow-white/10"
                  >
                    Open Dashboard
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <Link
                    href="/signup"
                    className="group px-8 py-4 rounded-full bg-white text-slate-900 font-semibold transition-all text-base flex items-center gap-2 hover:bg-slate-100 shadow-xl shadow-white/10"
                  >
                    Start Free Trial
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500 animate-fade-in delay-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>5 minute setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="mt-20 relative animate-scale-in delay-600">
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10 pointer-events-none" />
              <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-slate-900/50 backdrop-blur-sm shadow-2xl shadow-indigo-500/10">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-slate-900/80">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-slate-800/50 text-xs text-slate-500">
                      app.outboundai.com/dashboard
                    </div>
                  </div>
                </div>
                
                {/* Dashboard Mockup */}
                <div className="bg-[#0a0f1a] p-4">
                  <div className="flex gap-4">
                    {/* Sidebar */}
                    <div className="hidden md:flex flex-col w-52 bg-slate-900/50 rounded-xl p-3 border border-white/5">
                      <div className="flex items-center gap-2 mb-6 px-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <Zap size={16} className="text-white" />
                        </div>
                        <span className="font-semibold text-white text-sm">OutboundAI</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 text-sm">
                          <BarChart3 size={16} />
                          <span>Dashboard</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 text-sm hover:bg-white/5">
                          <Target size={16} />
                          <span>Campaigns</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 text-sm hover:bg-white/5">
                          <Users size={16} />
                          <span>Leads</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 text-sm hover:bg-white/5">
                          <Mail size={16} />
                          <span>Inbox</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 text-sm hover:bg-white/5">
                          <Calendar size={16} />
                          <span>Meetings</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="flex-1 space-y-4">
                      {/* Stats Row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                          <div className="text-xs text-slate-500 mb-1">Active Campaigns</div>
                          <div className="text-2xl font-bold text-white">12</div>
                          <div className="text-xs text-emerald-400 mt-1">+3 this week</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                          <div className="text-xs text-slate-500 mb-1">Total Leads</div>
                          <div className="text-2xl font-bold text-white">847</div>
                          <div className="text-xs text-emerald-400 mt-1">+127 new</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                          <div className="text-xs text-slate-500 mb-1">Emails Sent</div>
                          <div className="text-2xl font-bold text-white">2.4k</div>
                          <div className="text-xs text-emerald-400 mt-1">68% open rate</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                          <div className="text-xs text-slate-500 mb-1">Meetings Booked</div>
                          <div className="text-2xl font-bold text-white">38</div>
                          <div className="text-xs text-emerald-400 mt-1">+8 this week</div>
                        </div>
                      </div>
                      
                      {/* Content Grid */}
                      <div className="grid md:grid-cols-2 gap-3">
                        {/* Recent Leads */}
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-white">Recent Leads</span>
                            <span className="text-xs text-indigo-400">View all</span>
                          </div>
                          <div className="space-y-2">
                            {[
                              { name: 'Sarah Johnson', company: 'TechCorp', score: 92 },
                              { name: 'Mike Chen', company: 'StartupXYZ', score: 88 },
                              { name: 'Emily Davis', company: 'CloudSoft', score: 85 },
                            ].map((lead, i) => (
                              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
                                  <div>
                                    <div className="text-sm text-white">{lead.name}</div>
                                    <div className="text-xs text-slate-500">{lead.company}</div>
                                  </div>
                                </div>
                                <div className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                                  {lead.score}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Campaign Performance */}
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-white">Campaign Performance</span>
                            <span className="text-xs text-indigo-400">This month</span>
                          </div>
                          <div className="space-y-3">
                            {[
                              { name: 'SaaS Outreach', sent: 450, replies: 67, color: 'indigo' },
                              { name: 'Enterprise Sales', sent: 280, replies: 42, color: 'purple' },
                              { name: 'Startup Founders', sent: 320, replies: 58, color: 'pink' },
                            ].map((campaign, i) => (
                              <div key={i}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-slate-300">{campaign.name}</span>
                                  <span className="text-slate-500">{campaign.replies} replies</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full bg-gradient-to-r ${campaign.color === 'indigo' ? 'from-indigo-500 to-indigo-400' : campaign.color === 'purple' ? 'from-purple-500 to-purple-400' : 'from-pink-500 to-pink-400'}`}
                                    style={{ width: `${(campaign.replies / campaign.sent) * 100 * 5}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logos Section */}
        <section className="py-16 px-6 border-y border-white/5">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-sm text-slate-500 mb-8">POWERED BY INDUSTRY-LEADING TECHNOLOGY</p>
            <div className="flex justify-center items-center gap-12 md:gap-16 opacity-60">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <span className="font-semibold">Google Gemini</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <span className="font-semibold">Supabase</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <span className="font-semibold">Resend</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <span className="font-semibold">Google Calendar</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard number="10x" label="More Leads" sublabel="vs manual prospecting" />
              <StatCard number="24/7" label="Automation" sublabel="Always working" />
              <StatCard number="80%" label="Time Saved" sublabel="On outreach tasks" />
              <StatCard number="3x" label="Reply Rate" sublabel="Industry average" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                <Sparkles size={14} className="text-indigo-400" />
                <span className="text-sm text-indigo-400 font-medium">Features</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white font-space">
                Everything you need to
                <br />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">automate sales</span>
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                A complete autonomous sales platform powered by cutting-edge AI
              </p>
            </div>

            {/* Feature Bento Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="animate-fade-in-up delay-100 lg:col-span-2">
                <FeatureCard
                  icon={<Target className="text-indigo-400" size={24} />}
                  title="AI Lead Discovery"
                  description="Automatically find and qualify 30+ prospects matching your ICP using Google Search and Gemini AI."
                  large
                />
              </div>
              <div className="animate-fade-in-up delay-200">
                <FeatureCard
                  icon={<Mail className="text-purple-400" size={24} />}
                  title="Smart Outreach"
                  description="Generate hyper-personalized emails that convert."
                />
              </div>
              <div className="animate-fade-in-up delay-300">
                <FeatureCard
                  icon={<Calendar className="text-pink-400" size={24} />}
                  title="Auto Booking"
                  description="AI detects meeting intent and books to your calendar."
                />
              </div>
              <div className="animate-fade-in-up delay-400">
                <FeatureCard
                  icon={<MessageSquare className="text-emerald-400" size={24} />}
                  title="Inbox Management"
                  description="Smart reply categorization with sentiment analysis."
                />
              </div>
              <div className="animate-fade-in-up delay-500">
                <FeatureCard
                  icon={<BarChart3 className="text-blue-400" size={24} />}
                  title="Analytics"
                  description="Track campaigns, lead quality, and conversions."
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/5 via-transparent to-transparent" />
          <div className="max-w-6xl mx-auto relative">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                <MousePointer size={14} className="text-purple-400" />
                <span className="text-sm text-purple-400 font-medium">How It Works</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white font-space">
                Set it up once,
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">let AI do the rest</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="animate-slide-in-left delay-100">
                <StepCard
                  number="1"
                  title="Define Your ICP"
                  description="Tell us about your ideal customer profile and value proposition"
                  icon={<Target size={20} />}
                />
              </div>
              <div className="animate-fade-in-up delay-200">
                <StepCard
                  number="2"
                  title="AI Discovers Leads"
                  description="Our AI finds 30+ qualified prospects automatically"
                  icon={<Globe size={20} />}
                />
              </div>
              <div className="animate-fade-in-up delay-300">
                <StepCard
                  number="3"
                  title="Send Outreach"
                  description="Review AI-generated emails and send with one click"
                  icon={<Mail size={20} />}
                />
              </div>
              <div className="animate-slide-in-right delay-400">
                <StepCard
                  number="4"
                  title="Book Meetings"
                  description="AI handles replies and schedules meetings for you"
                  icon={<Calendar size={20} />}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 px-6 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <Star size={14} className="text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">Testimonials</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white font-space">
                Loved by sales teams
              </h2>
            </div>

            {/* Testimonials Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="animate-fade-in-up delay-100">
                <TestimonialCard
                  quote="OutboundAI 10x'd our lead generation. We went from manually finding 5 leads a day to 50+ qualified prospects automatically."
                  author="Sarah Chen"
                  role="Head of Growth"
                  company="TechStartup Inc"
                />
              </div>
              <div className="animate-fade-in-up delay-200">
                <TestimonialCard
                  quote="The AI-generated emails are incredible. They're personalized and convert way better than our old templates."
                  author="Mike Johnson"
                  role="Sales Director"
                  company="SaaS Company"
                />
              </div>
              <div className="animate-fade-in-up delay-300">
                <TestimonialCard
                  quote="Finally, a tool that actually books meetings for us. Our calendar is full without the manual follow-up grind."
                  author="Emily Rodriguez"
                  role="VP of Sales"
                  company="B2B Solutions"
                />
              </div>
              <div className="animate-fade-in-up delay-400 lg:col-span-2">
                <TestimonialCard
                  quote="The automation is seamless. Set it up once and it runs 24/7. Best investment we've made in our sales stack."
                  author="David Kim"
                  role="Founder"
                  company="Growth Labs"
                />
              </div>
              <div className="animate-fade-in-up delay-500">
                <TestimonialCard
                  quote="Response rates improved by 3x. The AI personalization is next-level."
                  author="Lisa Martinez"
                  role="Sales Manager"
                  company="CloudTech"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-600/10 to-transparent" />
          <div className="max-w-4xl mx-auto text-center relative animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-8 shadow-lg shadow-indigo-500/30">
              <Rocket size={32} className="text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white font-space">
              Ready to automate your outbound?
            </h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Join hundreds of sales teams using AI to scale their pipeline. Start free, no credit card required.
            </p>

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-slate-900 font-semibold text-base transition-all hover:bg-slate-100 shadow-xl shadow-white/10"
              >
                Go to Dashboard
                <ArrowRight size={20} />
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-slate-900 font-semibold text-base transition-all hover:bg-slate-100 shadow-xl shadow-white/10"
              >
                Start Your Free Trial
                <ArrowRight size={20} />
              </Link>
            )}

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Free forever plan
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Setup in 5 minutes
              </span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12 px-6 bg-slate-950/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Zap size={20} className="text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">OutboundAI</span>
                </div>
                <p className="text-slate-400 text-sm max-w-sm">
                  The autonomous AI sales agent that finds leads, sends personalized outreach, and books meetings while you sleep.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-500">
                © 2025 OutboundAI. Built with Next.js, Supabase & Google Gemini.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StatCard({ number, label, sublabel }: { number: string; label: string; sublabel: string }) {
  return (
    <div className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5">
      <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
        {number}
      </div>
      <div className="text-white font-semibold mb-1">{label}</div>
      <div className="text-sm text-slate-500">{sublabel}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description, className = "", large = false }: { icon: React.ReactNode; title: string; description: string; className?: string; large?: boolean }) {
  return (
    <div className={`group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all h-full ${className}`}>
      <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${large ? 'w-14 h-14' : ''}`}>
        {icon}
      </div>
      <h3 className={`font-semibold text-white mb-2 font-space ${large ? 'text-xl' : 'text-lg'}`}>{title}</h3>
      <p className={`text-slate-400 leading-relaxed ${large ? 'text-base' : 'text-sm'}`}>{description}</p>
    </div>
  );
}

function StepCard({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="relative group h-full">
      <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all h-full">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 text-lg font-bold shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
          {number}
        </div>
        <div className="text-indigo-400 mb-3">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 font-space">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, author, role, company, className = "" }: { quote: string; author: string; role: string; company: string; className?: string }) {
  return (
    <div className={`p-6 rounded-2xl border border-white/5 bg-white/[0.02] h-full ${className}`}>
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-slate-300 mb-6 leading-relaxed">&quot;{quote}&quot;</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
        <div>
          <div className="font-semibold text-white text-sm font-space">{author}</div>
          <div className="text-xs text-slate-500">{role}, {company}</div>
        </div>
      </div>
    </div>
  );
}