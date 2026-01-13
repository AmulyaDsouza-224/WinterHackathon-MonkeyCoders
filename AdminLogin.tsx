import React from 'react';
import { SignIn } from "@clerk/clerk-react";
import { Icons } from '../constants';

const AdminLogin: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [isVerified, setIsVerified] = React.useState(false);
    const [key, setKey] = React.useState('');
    const [error, setError] = React.useState('');

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (key === 'admin') {
            setIsVerified(true);
        } else {
            setError('Access Denied: Invalid Neural Key');
            setKey('');
        }
    };

    if (!isVerified) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-rose-900/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="absolute top-8 left-8 z-20">
                    <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors group">
                        <span className="font-bold uppercase tracking-widest text-xs">← Abort</span>
                    </button>
                </div>

                <div className="relative z-10 w-full max-w-md bg-[#0f172a] p-10 rounded-[44px] border border-rose-500/20 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl mx-auto flex items-center justify-center mb-6 text-rose-500">
                            <Icons.Lock size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">RESTRICTED <span className="text-rose-500">ACCESS</span></h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Security Clearance Required</p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <input
                                type="password"
                                value={key}
                                onChange={e => { setKey(e.target.value); setError(''); }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold tracking-widest text-center focus:border-rose-500 focus:outline-none transition-colors placeholder:text-slate-700"
                                placeholder="ENTER KEY"
                                autoFocus
                            />
                            {error && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center mt-3 animate-pulse">{error}</p>}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-rose-600/20 transition-all active:scale-95"
                        >
                            Decrypt Protocol
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="absolute top-8 left-8 z-20">
                <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors group">
                    <div className="p-2 rounded-full bg-slate-900/50 group-hover:bg-indigo-500/20 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </div>
                    <span className="font-bold uppercase tracking-widest text-xs">Back to Lobby</span>
                </button>
            </div>

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">ADMINISTRATOR <span className="text-indigo-500">NEXUS</span></h1>
                    <p className="text-indigo-500 font-black uppercase tracking-[0.3em] text-[10px]">Restricted Network Control</p>
                </div>

                <SignIn
                    appearance={{
                        layout: {
                            socialButtonsPlacement: 'bottom',
                            showOptionalSignInFields: false
                        },
                        elements: {
                            rootBox: "w-full",
                            card: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[32px] shadow-2xl p-8",
                            headerTitle: "text-2xl font-black text-slate-800 dark:text-white tracking-tight",
                            headerSubtitle: "text-slate-500 dark:text-slate-400 font-medium",
                            formButtonPrimary: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl py-3 shadow-lg shadow-indigo-500/20 transition-all",
                            socialButtonsBlockButton: "hidden", // Hides Social Buttons
                            footer: "hidden", // Hides Sign up footer
                            dividerRow: "hidden", // Hides the "or" divider
                            formFieldInput: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50",
                            formFieldLabel: "text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wide text-xs mb-1"
                        }
                    }}
                />

                <p className="mt-8 text-slate-500 text-xs font-medium text-center max-w-xs leading-relaxed">
                    <Icons.Lock /> <span className="ml-2">Session activity is monitored and logged to the global ledger.</span>
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
