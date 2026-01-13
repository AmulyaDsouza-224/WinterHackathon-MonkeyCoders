import React, { useState } from 'react';
import { SignIn, SignUp } from "@clerk/clerk-react";
import { Icons } from '../constants';

interface SecureLoginProps {
    onBack: () => void;
    darkMode: boolean;
    toggleDarkMode: () => void;
}

const SecureLogin: React.FC<SecureLoginProps> = ({ onBack, darkMode, toggleDarkMode }) => {
    const [view, setView] = useState<'signin' | 'signup'>('signin');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-300">
            {/* Background Glows */}
            <div className="absolute top-[-25%] right-[-10%] w-[800px] h-[800px] bg-sky-200/40 dark:bg-sky-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-25%] left-[-10%] w-[800px] h-[800px] bg-indigo-200/40 dark:bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Back Link */}
            <div className="absolute top-8 left-8 z-20">
                <button onClick={onBack} className="text-slate-600 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center space-x-2 text-sm font-bold tracking-wide">
                    <span>← Back to Lobby</span>
                </button>
            </div>

            {/* Dark Mode Toggle */}
            <div className="absolute top-8 right-8 z-20">
                <button
                    onClick={toggleDarkMode}
                    className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:scale-110 active:scale-95 transition-all"
                >
                    {darkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
                </button>
            </div>

            {/* Logo / Header - OUTSIDE CARD */}
            <div className="mb-8 text-center z-10 relative">
                <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center text-white text-2xl mb-6 mx-auto shadow-lg shadow-sky-500/20">
                    <Icons.User size={32} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">PATIENT <span className="text-sky-500">ACCESS</span></h1>
                <p className="text-slate-500 dark:text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Authorized Personnel Only</p>
            </div>

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-[480px] bg-white dark:bg-[#0f172a] rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center animate-in fade-in zoom-in duration-500 transition-colors">

                {/* Content Area */}
                <div className="w-full">
                    {view === 'signin' ? (
                        <SignIn
                            appearance={{
                                layout: {
                                    socialButtonsPlacement: 'bottom',
                                    showOptionalSignInFields: false
                                },
                                elements: {
                                    rootBox: "w-full box-border",
                                    card: "bg-transparent shadow-none p-0 w-full border-none box-border",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                    formButtonPrimary: "bg-sky-500 hover:bg-sky-400 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95 w-full mt-4",
                                    formFieldInput: "w-full box-border bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 py-3 px-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-center",
                                    formFieldLabel: "w-full text-center text-slate-500 dark:text-slate-300 text-xs font-bold uppercase tracking-wide mb-2 block",
                                    footer: "hidden",
                                    socialButtonsBlockButton: "hidden",
                                    dividerRow: "hidden",
                                    identityPreviewText: "text-sky-600 dark:text-sky-400 font-bold text-sm",
                                    identityPreviewEditButton: "text-slate-400 hover:text-sky-500 dark:hover:text-white",
                                    formFieldInputShowPasswordButton: "text-slate-400 hover:text-sky-500 dark:hover:text-white",
                                    otpCodeFieldInput: "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 font-bold !text-lg"
                                }
                            }}
                        />
                    ) : (
                        <SignUp
                            appearance={{
                                layout: {
                                    socialButtonsPlacement: 'bottom',
                                    showOptionalSignInFields: false
                                },
                                elements: {
                                    rootBox: "w-full box-border",
                                    card: "bg-transparent shadow-none p-0 w-full border-none box-border",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                    formButtonPrimary: "bg-sky-500 hover:bg-sky-400 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95 w-full mt-4",
                                    formFieldInput: "w-full box-border bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 py-3 px-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-center",
                                    formFieldLabel: "w-full text-center text-slate-500 dark:text-slate-300 text-xs font-bold uppercase tracking-wide mb-2 block",
                                    footer: "hidden",
                                    socialButtonsBlockButton: "hidden",
                                    dividerRow: "hidden",
                                    identityPreviewText: "text-sky-600 dark:text-sky-400 font-bold text-sm",
                                    identityPreviewEditButton: "text-slate-400 hover:text-sky-500 dark:hover:text-white",
                                    formFieldInputShowPasswordButton: "text-slate-400 hover:text-sky-500 dark:hover:text-white",
                                    otpCodeFieldInput: "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 font-bold !text-lg"
                                }
                            }}
                        />
                    )}
                </div>

                {/* Footer Toggle */}
                <div className="mt-8 text-center pt-6 border-t border-slate-200 dark:border-slate-800 w-full">
                    <p className="text-slate-500 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest">
                        {view === 'signin' ? "New Patient Node?" : "Already have a node?"}
                        <button
                            onClick={() => setView(view === 'signin' ? 'signup' : 'signin')}
                            className="text-sky-500 hover:text-sky-400 ml-1 transition-colors"
                        >
                            {view === 'signin' ? "Create Record" : "Access Ledger"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SecureLogin;
