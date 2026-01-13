import React, { useState, useRef } from 'react';
import { SPECIALTIES, INITIAL_REVIEWS, Icons } from '../constants';
import { Review, UserRole } from '../types';
import { useClerk } from "@clerk/clerk-react";

interface LandingPageProps {
  onStart: (role: UserRole) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onVisitDoctorLogin?: () => void;
  onVisitAdminLogin?: () => void;
  onVisitPatientLogin?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onStart,
  darkMode,
  toggleDarkMode,
  onVisitDoctorLogin,
  onVisitAdminLogin,
  onVisitPatientLogin
}) => {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [newReview, setNewReview] = useState({ author: '', content: '', rating: 5 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const { openSignIn } = useClerk();

  // Section Refs for smooth scrolling
  const visionRef = useRef<HTMLElement>(null);
  const specialtiesRef = useRef<HTMLElement>(null);
  const reviewsRef = useRef<HTMLElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.author || !newReview.content) return;

    setIsSubmitting(true);

    // Simulate synchronization delay
    setTimeout(() => {
      const review: Review = {
        id: Math.random().toString(36).substr(2, 9),
        author: newReview.author,
        role: 'Verified Medical Provider',
        content: newReview.content,
        rating: newReview.rating,
        date: new Date().toISOString().split('T')[0]
      };

      setReviews([review, ...reviews]);
      setNewReview({ author: '', content: '', rating: 5 });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 transition-colors duration-300 scroll-smooth relative">
      {/* Dynamic Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[100] frost-glass border-b border-sky-100/50 dark:border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex justify-between items-center">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 bg-sky-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-sky-500/20 group-hover:rotate-12 transition-transform shrink-0">M</div>
            <span className="text-base font-black tracking-tighter text-slate-900 dark:text-white uppercase whitespace-nowrap">MonkeyCoders</span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">

            <button onClick={() => scrollToSection(visionRef)} className="hover:text-sky-500 transition-colors">Our Vision</button>
            <button onClick={() => scrollToSection(specialtiesRef)} className="hover:text-sky-500 transition-colors">Capabilities</button>
            <button onClick={() => scrollToSection(reviewsRef)} className="hover:text-sky-500 transition-colors">Ledger</button>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl text-slate-400 hover:text-sky-500 transition-all shadow-sm"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <button
              onClick={() => setShowRoleSelector(true)}
              className="bg-slate-900 dark:bg-sky-500 text-white border-2 border-slate-900 dark:border-sky-500 px-6 md:px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[8px] hover:bg-sky-500 hover:border-sky-500 transition-all shadow-sm whitespace-nowrap"
            >
              Secure Login
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-24">
        {/* Majestic Hero Section */}
        <section ref={visionRef} className="max-w-7xl mx-auto px-6 md:px-10 py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10 animate-in slide-in-from-left duration-1000">
            <div className="inline-block bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
              Medical Synchronization Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter uppercase">
              Monkey<span className="text-sky-500">Coders.</span>
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed font-medium">
              Digital clinical synchronization for the modern medical age. Securely connecting patients and specialists.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={() => setShowRoleSelector(true)}
                className="bg-slate-900 dark:bg-sky-500 text-white px-10 py-5 rounded-[24px] text-lg font-black hover:bg-sky-600 dark:hover:bg-sky-400 transition-all shadow-2xl shadow-sky-900/20 hover:-translate-y-1 active:scale-95"
              >
                Launch Workspace
              </button>
            </div>
          </div>

          <div className="relative animate-in zoom-in duration-1000 group cursor-pointer" onClick={() => window.open('https://share.google/PgwTqytQeHPXLQMpX', '_blank')}>
            <div className="absolute -inset-10 bg-sky-200 dark:bg-sky-500/10 rounded-[60px] blur-[100px] opacity-40 animate-pulse"></div>
            <div className="relative rounded-[48px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-8 border-white dark:border-slate-800 bg-white group-hover:scale-[1.02] transition-transform duration-500">
              <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 z-10 shadow-lg">
                Sponsored Partner
              </div>
              <img
                src="/sjec_direct.jpg"
                alt="St Joseph Engineering College - Mangalore"
                className="w-full aspect-[9/4] object-cover object-top"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent p-8 pt-32 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div>
                  <p className="text-white font-black text-xl uppercase tracking-tight">St Joseph Engineering College</p>
                  <p className="text-sky-400 text-xs font-bold uppercase tracking-widest mt-1">Mangalore • Autonomous</p>
                </div>
                <button className="bg-sky-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sky-400 transition-colors">
                  Visit Now
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise Modules Section */}
        <section ref={specialtiesRef} className="bg-sky-50 dark:bg-slate-950 py-40 border-y border-slate-200 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent dark:from-slate-900/50 pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 md:px-10 mb-24 flex flex-col md:flex-row justify-between items-end gap-12 relative z-10">
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.85] uppercase">
                Enterprise <br /><span className="text-sky-500">Modules.</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xl font-medium max-w-lg italic">
                Advanced clinical nodes synchronized for high-stakes medical environments.
              </p>
            </div>

            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <span>Network Status:</span>
                <span className="text-sky-500">Optimized</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 w-[85%] rounded-full shadow-[0_0_15px_rgba(14,165,233,0.5)] animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
            {SPECIALTIES.map((s, idx) => (
              <div key={s.id} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 p-12 md:p-16 rounded-[48px] shadow-xl dark:shadow-2xl group relative overflow-hidden transition-all duration-500 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:-translate-y-2">
                <div className="absolute right-10 top-10 text-[120px] font-black text-slate-100 dark:text-white/5 pointer-events-none leading-none select-none">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="w-16 h-1.5 bg-sky-500 rounded-full mb-10 group-hover:w-24 group-hover:shadow-[0_0_15px_rgba(14,165,233,0.6)] transition-all"></div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 uppercase group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                    {s.title.replace('Cryo-', '').replace('Cyber-', '').replace('Nano-', '')}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed max-w-sm mb-16">
                    {s.desc}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-t border-slate-100 dark:border-white/5 pt-10">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Utilization</p>
                      <div className="flex items-center space-x-3">
                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${s.load === 'Optimal' || s.load === 'Optimized' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-sky-500/10 border-sky-500/30 text-sky-500'}`}>
                          {s.load}
                        </div>
                      </div>
                    </div>
                    <button className="text-sky-500 text-[10px] font-black uppercase tracking-widest flex items-center group/btn">
                      Details <span className="ml-2 group-hover/btn:translate-x-2 transition-transform">→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews Ledger */}
        <section ref={reviewsRef} className="bg-white dark:bg-slate-950 py-40">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-24 gap-12">
              <div className="max-w-2xl">
                <div className="relative group cursor-pointer mb-12" onClick={() => window.open('https://share.google/PgwTqytQeHPXLQMpX', '_blank')}>
                  <div className="relative rounded-[32px] overflow-hidden shadow-xl border-4 border-white dark:border-slate-800 bg-white group-hover:scale-[1.02] transition-transform duration-500">
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-900 z-10 shadow-lg">
                      Sponsored Partner
                    </div>
                    <img
                      src="/sjec_direct.jpg"
                      alt="St Joseph Engineering College - Mangalore"
                      className="w-full aspect-[9/4] object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button className="bg-sky-500 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sky-400 transition-colors shadow-xl">
                        Visit Now
                      </button>
                    </div>
                  </div>
                </div>

                <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 uppercase leading-none">Global Feedback</h2>
                <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">Verified testimonials from clinical experts and patient nodes within the MonkeyCoders network.</p>
              </div>
              <div className="w-full lg:w-1/3 bg-slate-50 dark:bg-slate-900 p-10 rounded-[44px] border border-slate-100 dark:border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-500 mb-8">Add Feedback</h4>
                <form onSubmit={handleAddReview} className="space-y-6">
                  <input
                    value={newReview.author}
                    onChange={e => setNewReview({ ...newReview, author: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-sky-500 focus:outline-none dark:text-white"
                    placeholder="Full Identity"
                    required
                  />
                  <textarea
                    value={newReview.content}
                    onChange={e => setNewReview({ ...newReview, content: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-sky-500 focus:outline-none dark:text-white h-32 resize-none"
                    placeholder="Message Ledger..."
                    required
                  />
                  <div className="flex items-center space-x-4">
                    <select
                      value={newReview.rating}
                      onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest dark:text-white"
                    >
                      {[5, 4, 3, 2, 1].map(v => <option key={v} value={v}>{v} Stars</option>)}
                    </select>
                    <button
                      disabled={isSubmitting}
                      className="flex-1 bg-sky-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-sky-500/20 hover:bg-sky-400 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Syncing...' : 'Submit to Ledger'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {reviews.map(rev => (
                <div key={rev.id} className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[48px] border border-slate-100 dark:border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="flex space-x-1 mb-8">
                      {[...Array(rev.rating)].map((_, i) => (
                        <div key={i} className="text-sky-500"><Icons.Star /></div>
                      ))}
                      {[...Array(5 - rev.rating)].map((_, i) => (
                        <div key={i} className="text-slate-200 dark:text-slate-800"><Icons.Star /></div>
                      ))}
                    </div>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-relaxed italic mb-10">"{rev.content}"</p>
                  </div>
                  <div className="flex items-center space-x-5">
                    <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center font-black text-sky-500 text-xs">{rev.author.charAt(0)}</div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tighter">{rev.author}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{rev.role} • {rev.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-24 text-center text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-white/5 flex flex-col items-center gap-4 transition-colors duration-300">
        <span>© 2024 MonkeyCoders Global • Healthcare Systems</span>
        <button
          onClick={() => {
            localStorage.removeItem('hms_all_users');
            localStorage.removeItem('global_appointments');
            localStorage.removeItem('global_bills');
            localStorage.removeItem('global_medical_records');
            window.location.reload();
          }}
          className="text-rose-500 hover:text-rose-400 transition-colors"
        >
          [ RESET SYSTEM DATA ]
        </button>
      </footer>

      {showRoleSelector && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-4">Select Identity</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-xl uppercase tracking-widest">Choose your access node to proceed</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { role: UserRole.PATIENT, title: "Patient", desc: "Access personal health records and appointments", color: "sky" },
                { role: UserRole.DOCTOR, title: "Doctor", desc: "Manage patients, appointments and medical ledger", color: "emerald" },
                { role: UserRole.ADMIN, title: "Admin", desc: "System oversight and network management", color: "indigo" }
              ].map((opt) => (
                <button
                  key={opt.role}
                  onClick={() => {
                    if (opt.role === UserRole.PATIENT && onVisitPatientLogin) {
                      onVisitPatientLogin();
                    } else if (opt.role === UserRole.DOCTOR && onVisitDoctorLogin) {
                      onVisitDoctorLogin();
                    } else if (opt.role === UserRole.ADMIN && onVisitAdminLogin) {
                      onVisitAdminLogin();
                    }
                  }}
                  className="group bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-sky-500/50 p-10 rounded-[44px] text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-sky-500/10"
                >
                  <div className={`w-16 h-16 rounded-[28px] bg-${opt.color}-500/10 flex items-center justify-center mb-8 group-hover:bg-${opt.color}-500/20 transition-colors`}>
                    <div className={`w-3 h-3 rounded-full bg-${opt.color}-500`}></div>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">{opt.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="mt-16 text-center">
              <button onClick={() => setShowRoleSelector(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white font-black uppercase text-xs tracking-[0.2em] transition-colors">
                Close Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
