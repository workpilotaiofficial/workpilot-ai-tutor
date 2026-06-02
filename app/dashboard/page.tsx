'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Sparkles, ClipboardCheck, ArrowRight } from 'lucide-react'
import { getStoredStudySets, type StudySet } from '@/components/study-sets/utils'

export default function DashboardIndexPage() {
  const [studySets, setStudySets] = useState<StudySet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStudySets(getStoredStudySets())
      setIsLoading(false)
    }
  }, [])

  const recentStudySets = studySets.slice(0, 3)

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/30 p-4 md:p-8">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Welcome Hero */}
        <div className="mb-16">
          {/* <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200/60 shadow-sm mb-6">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
            <span className="text-sm font-semibold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Welcome back!</span>
          </div> */}
          <div className="space-y-4">
            <h1 className="text-2xl md:text-5xl font-black bg-linear-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent leading-tight tracking-tight">
              Let's continue learning
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl leading-relaxed font-medium">
              Master new topics with AI-powered study materials, personalized quizzes, and interactive flashcards.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {/* Study Sets Stats */}
          <div className="group relative overflow-hidden p-6 bg-linear-to-br from-blue-50 to-white rounded-2xl border border-blue-200/30 hover:border-blue-300/50 transition-all duration-300 shadow-xl">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-100/40 rounded-full blur-2xl group-hover:bg-blue-100/60 transition-all"></div>
            <div className="relative z-10 flex items-end justify-between">
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-semibold mb-2">Study Sets</p>
                <div className="mb-2">
                  <h3 className="text-4xl font-black text-blue-600">{studySets.length}</h3>
                </div>
                <span className="inline-block px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 rounded-full">+12%</span>
              </div>
              <div className="p-4 bg-linear-to-br from-blue-100 to-blue-50 rounded-xl group-hover:shadow-lg transition-all">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Learning Streak */}
          <div className="group relative overflow-hidden p-6 bg-linear-to-br from-purple-50 to-white rounded-2xl border border-purple-200/30 hover:border-purple-300/50 transition-all duration-300 shadow-xl">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-purple-100/40 rounded-full blur-2xl group-hover:bg-purple-100/60 transition-all"></div>
            <div className="relative z-10 flex items-end justify-between">
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-semibold mb-2">Ready to Generate</p>
                <div className="mb-2">
                  <h3 className="text-4xl font-black text-purple-600">{studySets.length > 0 ? '∞' : '0'}</h3>
                </div>
                <span className="inline-block px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 rounded-full">Unlimited</span>
              </div>
              <div className="p-4 bg-linear-to-br from-purple-100 to-purple-50 rounded-xl group-hover:shadow-lg transition-all">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="group relative overflow-hidden p-6 bg-linear-to-br from-cyan-50 to-white rounded-2xl border border-cyan-200/30 hover:border-cyan-300/50 transition-all duration-300 shadow-xl">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-cyan-100/40 rounded-full blur-2xl group-hover:bg-cyan-100/60 transition-all"></div>
            <div className="relative z-10 flex items-end justify-between">
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-semibold mb-2">Tools Available</p>
                <div className="mb-2">
                  <h3 className="text-4xl font-black text-cyan-600">5+</h3>
                </div>
                <span className="inline-block px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 rounded-full">Active</span>
              </div>
              <div className="p-4 bg-linear-to-br from-cyan-100 to-cyan-50 rounded-xl group-hover:shadow-lg transition-all">
                <ClipboardCheck className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions with Enhanced Animations & Effects */}
        <div className="mb-12">
          <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-1 h-8 bg-linear-to-b from-blue-600 to-purple-600 rounded-full"></div>
            Quick Actions
          </h2>

          <style>{`
            @keyframes float-up {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-6px); }
            }
            @keyframes gradient-shimmer {
              0% { background-position: -1000px 0; }
              100% { background-position: 1000px 0; }
            }
            @keyframes pulse-border {
              0%, 100% { border-color: rgba(59, 130, 246, 0.3); }
              50% { border-color: rgba(147, 51, 234, 0.5); }
            }
            .action-button {
              position: relative;
              overflow: hidden;
              transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
              background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            }
            .action-button::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
              opacity: 0;
              transition: opacity 0.4s;
            }
            .action-button:hover {
              transform: translateY(-4px);
              box-shadow: 0 20px 40px rgba(59, 130, 246, 0.2), 0 0 0 1px rgba(59, 130, 246, 0.15);
              border-color: rgba(59, 130, 246, 0.6);
              background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
            }
            .action-button:hover::before {
              opacity: 1;
              animation: gradient-shimmer 0.6s;
            }
            .action-icon {
              transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
              animation: float-up 3s ease-in-out infinite;
            }
            .action-button:hover .action-icon {
              transform: scale(1.1) rotate(5deg);
              animation: none;
              filter: brightness(1.2);
            }
            .action-arrow {
              transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .action-button:hover .action-arrow {
              transform: translateX(6px);
              color: inherit;
            }
          `}</style>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/dashboard/study-sets')}
              className="action-button group p-5 bg-linear-to-br from-blue-100 to-blue-50 rounded-xl border border-blue-200/50 text-left"
            >
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-2.5 bg-blue-50 rounded-lg shrink-0">
                  <BookOpen className="action-icon w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 mb-1">Create Study Sets</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">Upload files or paste content to generate study materials</p>
                </div>
                <ArrowRight className="action-arrow w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/syllabus-intelligence')}
              className="action-button group p-5 bg-linear-to-br from-purple-100 to-purple-50 rounded-xl border border-purple-200/50 text-left"
            >
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-2.5 bg-purple-50 rounded-lg shrink-0">
                  <Sparkles className="action-icon w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 mb-1">Syllabus Intelligence</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">Analyze and generate insights from your syllabus</p>
                </div>
                <ArrowRight className="action-arrow w-4 h-4 text-slate-400 group-hover:text-purple-600 shrink-0 mt-0.5" />
              </div>
            </button>
          </div>
        </div>

        {/* Recent Study Sets */}
        {recentStudySets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-1 h-8 bg-linear-to-b from-blue-600 to-cyan-600 rounded-full"></div>
                Recent Study Sets
              </h2>
              <button
                onClick={() => router.push('/dashboard/study-sets')}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-all duration-300 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentStudySets.map((set) => (
                <button
                  key={set.id}
                  onClick={() => router.push(`/dashboard/study-sets/${encodeURIComponent(set.id)}`)}
                  className="group relative p-7 bg-white rounded-xl border border-slate-200 hover:border-blue-300/60 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-100/30 text-left overflow-hidden"
                >
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-linear-to-br from-blue-100 to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full blur-2xl"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <span className="px-3 py-1.5 bg-linear-to-r from-blue-50/80 to-purple-50/80 text-slate-700 text-xs font-bold rounded-lg border border-blue-100/40">
                        {set.sections.length} section{set.sections.length !== 1 ? 's' : ''}
                      </span>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-all duration-300 group-hover:translate-x-1" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">{set.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-5 leading-relaxed">{set.description || 'No description'}</p>
                    <div className="flex flex-wrap gap-2">
                      {set.sections.slice(0, 2).map((section) => (
                        <span key={section.id} className="px-3 py-1.5 bg-linear-to-r from-blue-50 to-blue-50/50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100/40">
                          {section.label}
                        </span>
                      ))}
                      {set.sections.length > 2 && (
                        <span className="px-3 py-1.5 bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-100/60">
                          +{set.sections.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {studySets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 px-6">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-linear-to-br from-blue-200/30 to-purple-200/30 rounded-3xl blur-2xl"></div>
              <div className="relative w-20 h-20 bg-linear-to-br from-blue-100/80 to-purple-50/40 rounded-3xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3 text-center">No study sets yet</h2>
            <p className="text-slate-600 mb-10 max-w-sm text-center leading-relaxed font-medium">
              Create your first study set to start generating interactive flashcards, quizzes, and study guides.
            </p>
            <button
              onClick={() => router.push('/dashboard/study-sets')}
              className="group px-8 py-4 bg-linear-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-300 hover:-translate-y-1 hover:scale-105 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative">Create Your First Study Set</span>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
